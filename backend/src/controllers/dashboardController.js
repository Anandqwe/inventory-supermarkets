const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Category = require('../models/Category');
const ResponseUtils = require('../utils/responseUtils');
const mongoose = require('mongoose');

class DashboardController {
  static getDashboardOverview = asyncHandler(async (req, res) => {
    try {
      const { branchId } = req.query;
      
      // Determine target branch
      const targetBranchId = branchId || req.user.branch;
      const branchFilter = {};
      
      if (req.user.role !== 'admin' && req.user.branch) {
        branchFilter.branch = req.user.branch;
      } else if (targetBranchId) {
        branchFilter.branch = targetBranchId;
      }

      // Date ranges
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get total products count
      const productFilter = { isActive: true };
      if (targetBranchId) {
        productFilter['branchStocks.branch'] = targetBranchId;
      }
      const totalProducts = await Product.countDocuments(productFilter);

      // Today's sales
      const todaySalesFilter = {
        ...branchFilter,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      };
      
      const todaySales = await Sale.find(todaySalesFilter);
      const todaySalesCount = todaySales.length;
      const todaySalesAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);

      // This month's sales
      const monthSalesFilter = {
        ...branchFilter,
        createdAt: { $gte: startOfMonth },
        status: 'completed'
      };
      const monthSales = await Sale.find(monthSalesFilter);
      const totalRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalSales = monthSales.length;

      // Low stock items
      const lowStockFilter = { isActive: true };
      if (targetBranchId) {
        lowStockFilter['branchStocks.branch'] = targetBranchId;
      }

      const lowStockItems = await Product.aggregate([
        { $match: lowStockFilter },
        {
          $addFields: {
            lowStockBranches: {
              $filter: {
                input: '$branchStocks',
                cond: { 
                  $and: [
                    { $lte: ['$$this.quantity', '$$this.reorderLevel'] },
                    targetBranchId ? { $eq: ['$$this.branch', mongoose.Types.ObjectId(targetBranchId)] } : {}
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            'lowStockBranches.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            sku: 1,
            category: { $arrayElemAt: ['$category.name', 0] },
            lowStockBranches: 1
          }
        }
      ]);

      // Top categories by sales
      const topCategoriesFilter = {
        ...branchFilter,
        createdAt: { $gte: last30Days },
        status: 'completed'
      };

      const topCategories = await Sale.aggregate([
        { $match: topCategoriesFilter },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            totalSales: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]);

      // Recent sales activity
      const recentSales = await Sale.find(branchFilter)
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('saleNumber total customerName createdAt status');

      // Performance metrics
      const last7DaysFilter = {
        ...branchFilter,
        createdAt: { $gte: last7Days },
        status: 'completed'
      };

      const last7DaysSales = await Sale.find(last7DaysFilter);
      const last7DaysRevenue = last7DaysSales.reduce((sum, sale) => sum + sale.total, 0);
      const averageOrderValue = last7DaysSales.length > 0 ? last7DaysRevenue / last7DaysSales.length : 0;

      const dashboardData = {
        summary: {
          totalProducts,
          totalSales,
          todaySales: {
            count: todaySalesCount,
            amount: todaySalesAmount
          },
          monthlyRevenue: totalRevenue,
          last7DaysRevenue,
          averageOrderValue
        },
        lowStockItems: lowStockItems.slice(0, 5),
        topCategories,
        recentSales,
        alerts: {
          lowStock: lowStockItems.length,
          pendingOrders: 0, // Can be expanded based on requirements
          overduePayments: 0 // Can be expanded based on requirements
        }
      };

      res.json(
        ResponseUtils.success('Dashboard data retrieved successfully', dashboardData)
      );

    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json(
        ResponseUtils.error('Failed to fetch dashboard data', 500)
      );
    }
  });

  static getSalesChartData = asyncHandler(async (req, res) => {
    try {
      const { period = '7days', branchId } = req.query;
      
      // Determine date range
      let startDate = new Date();
      let groupBy = {};
      
      switch (period) {
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' }
          };
          break;
        case '12months':
          startDate.setMonth(startDate.getMonth() - 12);
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          };
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
      }

      const filter = {
        createdAt: { $gte: startDate },
        status: 'completed'
      };

      // Branch filter
      if (branchId) {
        filter.branch = branchId;
      } else if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch;
      }

      const salesData = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupBy,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            totalItems: { $sum: { $size: '$items' } },
            averageOrderValue: { $avg: '$total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);

      // Format data for chart consumption
      const chartData = salesData.map(item => ({
        period: item._id,
        sales: item.totalSales,
        revenue: Math.round(item.totalRevenue * 100) / 100,
        items: item.totalItems,
        averageOrderValue: Math.round(item.averageOrderValue * 100) / 100,
        date: period.includes('day') 
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
          : period === '12months'
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
          : `${item._id.year}-W${item._id.week}`
      }));

      res.json(
        ResponseUtils.success('Sales chart data retrieved successfully', {
          chartData,
          period,
          summary: {
            totalDataPoints: chartData.length,
            totalSales: chartData.reduce((sum, item) => sum + item.sales, 0),
            totalRevenue: chartData.reduce((sum, item) => sum + item.revenue, 0)
          }
        })
      );

    } catch (error) {
      console.error('Sales chart data error:', error);
      res.status(500).json(
        ResponseUtils.error('Failed to fetch sales chart data', 500)
      );
    }
  });

  static getInventoryAnalytics = asyncHandler(async (req, res) => {
    try {
      const { branchId } = req.query;
      
      const filter = { isActive: true };
      if (branchId) {
        filter['branchStocks.branch'] = branchId;
      } else if (req.user.role !== 'admin' && req.user.branch) {
        filter['branchStocks.branch'] = req.user.branch;
      }

      const inventorySummary = await Product.aggregate([
        { $match: filter },
        { $unwind: '$branchStocks' },
        ...(branchId || req.user.branch ? [{ 
          $match: { 
            'branchStocks.branch': mongoose.Types.ObjectId(branchId || req.user.branch) 
          } 
        }] : []),
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$branchStocks.quantity' },
            totalValue: { 
              $sum: { 
                $multiply: ['$branchStocks.quantity', '$pricing.costPrice'] 
              } 
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  { $lte: ['$branchStocks.quantity', '$branchStocks.reorderLevel'] },
                  1,
                  0
                ]
              }
            },
            outOfStockCount: {
              $sum: {
                $cond: [
                  { $eq: ['$branchStocks.quantity', 0] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      // Category-wise inventory
      const categoryInventory = await Product.aggregate([
        { $match: filter },
        { $unwind: '$branchStocks' },
        ...(branchId || req.user.branch ? [{ 
          $match: { 
            'branchStocks.branch': mongoose.Types.ObjectId(branchId || req.user.branch) 
          } 
        }] : []),
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            productCount: { $sum: 1 },
            totalStock: { $sum: '$branchStocks.quantity' },
            totalValue: { 
              $sum: { 
                $multiply: ['$branchStocks.quantity', '$pricing.costPrice'] 
              } 
            }
          }
        },
        { $sort: { totalValue: -1 } }
      ]);

      res.json(
        ResponseUtils.success('Inventory analytics retrieved successfully', {
          summary: inventorySummary[0] || {
            totalProducts: 0,
            totalStock: 0,
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0
          },
          categoryBreakdown: categoryInventory
        })
      );

    } catch (error) {
      console.error('Inventory analytics error:', error);
      res.status(500).json(
        ResponseUtils.error('Failed to fetch inventory analytics', 500)
      );
    }
  });

  static getAlerts = asyncHandler(async (req, res) => {
    try {
      const { branchId } = req.query;
      const alerts = [];
      
      const filter = { isActive: true };
      if (branchId) {
        filter['branchStocks.branch'] = branchId;
      } else if (req.user.role !== 'admin' && req.user.branch) {
        filter['branchStocks.branch'] = req.user.branch;
      }

      // Low stock alerts
      const lowStockProducts = await Product.aggregate([
        { $match: filter },
        {
          $addFields: {
            lowStockBranches: {
              $filter: {
                input: '$branchStocks',
                cond: { 
                  $and: [
                    { $lte: ['$$this.quantity', '$$this.reorderLevel'] },
                    branchId || req.user.branch ? 
                      { $eq: ['$$this.branch', mongoose.Types.ObjectId(branchId || req.user.branch)] } : 
                      {}
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            'lowStockBranches.0': { $exists: true }
          }
        },
        { $limit: 10 }
      ]);

      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockProducts.length} products are running low on stock`,
          priority: 'high',
          data: lowStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            currentStock: p.lowStockBranches[0]?.quantity || 0,
            reorderLevel: p.lowStockBranches[0]?.reorderLevel || 0
          }))
        });
      }

      // Out of stock alerts
      const outOfStockProducts = await Product.aggregate([
        { $match: filter },
        {
          $addFields: {
            outOfStockBranches: {
              $filter: {
                input: '$branchStocks',
                cond: { 
                  $and: [
                    { $eq: ['$$this.quantity', 0] },
                    branchId || req.user.branch ? 
                      { $eq: ['$$this.branch', mongoose.Types.ObjectId(branchId || req.user.branch)] } : 
                      {}
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            'outOfStockBranches.0': { $exists: true }
          }
        },
        { $limit: 5 }
      ]);

      if (outOfStockProducts.length > 0) {
        alerts.push({
          type: 'error',
          title: 'Out of Stock Alert',
          message: `${outOfStockProducts.length} products are out of stock`,
          priority: 'critical',
          data: outOfStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku
          }))
        });
      }

      // Overstock alerts (items above max stock level)
      const overstockProducts = await Product.aggregate([
        { $match: filter },
        {
          $addFields: {
            overstockBranches: {
              $filter: {
                input: '$branchStocks',
                cond: { 
                  $and: [
                    { $gt: ['$$this.quantity', '$$this.maxStockLevel'] },
                    branchId || req.user.branch ? 
                      { $eq: ['$$this.branch', mongoose.Types.ObjectId(branchId || req.user.branch)] } : 
                      {}
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            'overstockBranches.0': { $exists: true }
          }
        },
        { $limit: 5 }
      ]);

      if (overstockProducts.length > 0) {
        alerts.push({
          type: 'info',
          title: 'Overstock Alert',
          message: `${overstockProducts.length} products are overstocked`,
          priority: 'medium',
          data: overstockProducts.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            currentStock: p.overstockBranches[0]?.quantity || 0,
            maxStockLevel: p.overstockBranches[0]?.maxStockLevel || 0
          }))
        });
      }

      res.json(
        ResponseUtils.success('Alerts retrieved successfully', {
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.priority === 'critical').length,
            high: alerts.filter(a => a.priority === 'high').length,
            medium: alerts.filter(a => a.priority === 'medium').length
          }
        })
      );

    } catch (error) {
      console.error('Alerts error:', error);
      res.status(500).json(
        ResponseUtils.error('Failed to fetch alerts', 500)
      );
    }
  });
}

module.exports = DashboardController;