/**
 * Dashboard Controller
 * Provides analytics and summary data for dashboard
 */
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class DashboardController {
  /**
   * Get complete dashboard overview
   */
  static getDashboardOverview = asyncHandler(async (req, res) => {
    const { period = 'today' } = req.query;

    // Calculate date range based on period
    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    // Get sales analytics
    const [salesAnalytics] = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          totalGST: { $sum: '$gstAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItemsSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      }
    ]);

    // Get inventory summary
    const inventorySummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$quantity' },
          totalValue: {
            $sum: { $multiply: ['$quantity', '$price'] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent sales
    const recentSales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('cashierId', 'fullName')
      .select('totalAmount paymentMethod customerName createdAt items');

    // Get top products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Get payment method distribution
    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get sales trend (last 7 days for charts)
    const salesTrend = await Sale.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            $lte: new Date()
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get low stock alerts
    const lowStockAlerts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    })
      .select('name quantity minStockLevel category')
      .sort({ quantity: 1 })
      .limit(10);

    // Get active users count
    const activeUsersCount = await User.countDocuments({ isActive: true });

    const result = {
      period,
      dateRange: { startDate, endDate },
      analytics: {
        sales: salesAnalytics || {
          totalSales: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          totalGST: 0,
          averageOrderValue: 0,
          totalItemsSold: 0
        },
        inventory: inventorySummary[0] || {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0
        },
        users: {
          activeUsers: activeUsersCount
        }
      },
      recentSales,
      topProducts,
      paymentMethodStats,
      salesTrend,
      lowStockAlerts
    };

    ResponseUtils.success(res, result, 'Dashboard overview retrieved successfully');
  });

  /**
   * Get sales chart data
   */
  static getSalesChartData = asyncHandler(async (req, res) => {
    const { period = 'week', type = 'revenue' } = req.query;

    let groupBy, dateRange;
    const now = new Date();

    switch (period) {
      case 'today':
        // Hourly data for today
        groupBy = { hour: { $hour: '$createdAt' } };
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };
        break;
      case 'week':
        // Daily data for last 7 days
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateRange = {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date()
        };
        break;
      case 'month':
        // Daily data for current month
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date()
        };
        break;
      case 'year':
        // Monthly data for current year
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateRange = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date()
        };
        break;
      default:
        // Default to weekly
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateRange = {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date()
        };
    }

    const aggregation = [
      {
        $match: {
          createdAt: dateRange,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          items: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const chartData = await Sale.aggregate(aggregation);

    // Format data for frontend charts
    const formattedData = chartData.map(item => {
      let label;
      if (period === 'today') {
        label = `${item._id.hour}:00`;
      } else if (period === 'year') {
        label = `${item._id.month}/${item._id.year}`;
      } else {
        label = `${item._id.day}/${item._id.month}`;
      }

      return {
        label,
        sales: item.sales,
        revenue: item.revenue,
        items: item.items,
        value: type === 'sales' ? item.sales : type === 'items' ? item.items : item.revenue
      };
    });

    ResponseUtils.success(res, {
      period,
      type,
      data: formattedData
    }, 'Chart data retrieved successfully');
  });

  /**
   * Get inventory analytics
   */
  static getInventoryAnalytics = asyncHandler(async (req, res) => {
    // Category-wise stock distribution
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Stock level distribution
    const stockLevels = await Product.aggregate([
      {
        $project: {
          name: 1,
          category: 1,
          quantity: 1,
          minStockLevel: 1,
          stockStatus: {
            $cond: [
              { $eq: ['$quantity', 0] },
              'Out of Stock',
              {
                $cond: [
                  { $lte: ['$quantity', '$minStockLevel'] },
                  'Low Stock',
                  'In Stock'
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$stockStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top value products
    const topValueProducts = await Product.find()
      .select('name category quantity price')
      .sort({ price: -1 })
      .limit(10);

    // Recent stock movements (products updated in last 24 hours)
    const recentStockMovements = await Product.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .select('name category quantity minStockLevel updatedAt')
      .populate('updatedBy', 'fullName')
      .sort({ updatedAt: -1 })
      .limit(10);

    const result = {
      categoryStats,
      stockLevels,
      topValueProducts,
      recentStockMovements
    };

    ResponseUtils.success(res, result, 'Inventory analytics retrieved successfully');
  });

  /**
   * Get user performance analytics
   */
  static getUserPerformance = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Cashier performance
    const cashierPerformance = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$cashierId',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItemsSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'cashier'
        }
      },
      {
        $project: {
          totalSales: 1,
          totalRevenue: 1,
          averageOrderValue: 1,
          totalItemsSold: 1,
          cashierName: { $arrayElemAt: ['$cashier.fullName', 0] },
          cashierRole: { $arrayElemAt: ['$cashier.role', 0] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    ResponseUtils.success(res, {
      period,
      cashierPerformance
    }, 'User performance analytics retrieved successfully');
  });

  /**
   * Get alerts and notifications
   */
  static getAlerts = asyncHandler(async (req, res) => {
    const alerts = [];

    // Low stock alerts
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    })
      .select('name quantity minStockLevel category')
      .sort({ quantity: 1 });

    lowStockProducts.forEach(product => {
      alerts.push({
        type: 'low_stock',
        priority: product.quantity === 0 ? 'high' : 'medium',
        title: product.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: product.quantity === 0 
          ? `${product.name} is out of stock`
          : `${product.name} is running low (${product.quantity} left)`,
        data: {
          productId: product._id,
          productName: product.name,
          currentStock: product.quantity,
          minStock: product.minStockLevel,
          category: product.category
        },
        createdAt: new Date()
      });
    });

    // Expiring products (within 7 days)
    const expiringProducts = await Product.find({
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
      .select('name expiryDate quantity category')
      .sort({ expiryDate: 1 });

    expiringProducts.forEach(product => {
      const daysToExpiry = Math.ceil((product.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'expiry_warning',
        priority: daysToExpiry <= 2 ? 'high' : 'medium',
        title: 'Product Expiring Soon',
        message: `${product.name} expires in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`,
        data: {
          productId: product._id,
          productName: product.name,
          expiryDate: product.expiryDate,
          daysToExpiry,
          quantity: product.quantity,
          category: product.category
        },
        createdAt: new Date()
      });
    });

    // Sort alerts by priority and date
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    ResponseUtils.success(res, {
      total: alerts.length,
      alerts: alerts.slice(0, 20) // Limit to 20 most important alerts
    }, 'Alerts retrieved successfully');
  });
}

module.exports = DashboardController;
