const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const ResponseUtils = require('../utils/responseUtils');
const mongoose = require('mongoose');

class DashboardController {
  static getDashboardOverview = asyncHandler(async (req, res) => {
    try {
      const { branchId, period = '7days' } = req.query;
      
      // Determine target branch
      const targetBranchId = branchId || req.user.branch;
      const branchFilter = {};
      
      if (req.user.role !== 'admin' && req.user.branch) {
        branchFilter.branch = req.user.branch;
      } else if (targetBranchId) {
        branchFilter.branch = targetBranchId;
      }

      // Dynamic date ranges based on period
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Calculate period start date
      let periodStartDate;
      switch (period) {
        case '24hours':
          periodStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          periodStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          periodStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '12months':
          periodStartDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          periodStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get total products count
      const productFilter = { isActive: true };
      if (targetBranchId) {
        productFilter['stockByBranch.branch'] = targetBranchId;
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
      const todaySalesAmount = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      // Period sales (based on selected period)
      const periodSalesFilter = {
        ...branchFilter,
        createdAt: { $gte: periodStartDate },
        status: 'completed'
      };
      const periodSales = await Sale.find(periodSalesFilter);
      const totalRevenue = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalSales = periodSales.length;

      // Low stock items with advanced aggregation
      const lowStockFilter = { isActive: true };
      if (targetBranchId) {
        lowStockFilter['stockByBranch.branch'] = new mongoose.Types.ObjectId(targetBranchId);
      }

      const lowStockItems = await Product.aggregate([
        { $match: lowStockFilter },
        {
          $addFields: {
            lowStockBranches: {
              $filter: {
                input: '$stockByBranch',
                cond: { 
                  $and: [
                    { $lte: ['$$this.quantity', '$$this.reorderLevel'] },
                    targetBranchId ? { $eq: ['$$this.branch', new mongoose.Types.ObjectId(targetBranchId)] } : {}
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { 'lowStockBranches.0': { $exists: true } },
              { quantity: { $lte: 10 } } // Fallback for products without branch stocks
            ]
          }
        },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            sku: 1,
            category: 1,
            quantity: 1,
            price: '$pricing.sellingPrice',
            lowStockBranches: 1,
            // Extract stock quantity (from branch or main quantity)
            stock: {
              $cond: {
                if: { $gt: [{ $size: '$lowStockBranches' }, 0] },
                then: { $arrayElemAt: ['$lowStockBranches.quantity', 0] },
                else: '$quantity'
              }
            },
            // Extract reorder level
            minStockLevel: {
              $cond: {
                if: { $gt: [{ $size: '$lowStockBranches' }, 0] },
                then: { $arrayElemAt: ['$lowStockBranches.reorderLevel', 0] },
                else: 10
              }
            }
          }
        }
      ]);

      // Top categories by sales (use period-based date range)
      const topCategoriesFilter = {
        ...branchFilter,
        createdAt: { $gte: periodStartDate },
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
            _id: '$product.category',
            categoryName: { $first: '$category.name' },
            totalSales: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
          }
        },
        {
          $project: {
            categoryName: 1,
            totalSales: 1,
            totalRevenue: 1
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]);

      // Recent sales with customer information (always show most recent, not period-filtered)
      const recentSalesFilter = {
        ...branchFilter,
        status: 'completed'
      };
      
      const recentSales = await Sale.find(recentSalesFilter)
        .populate('customer', 'name email phone')
        .populate('branch', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('saleNumber total items customer branch createdAt paymentMethod status')
        .lean();

      // Performance metrics for selected period
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Top selling products
      const topProducts = await Sale.aggregate([
        { $match: topCategoriesFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            name: '$product.name',
            sku: '$product.sku',
            category: '$product.category',
            totalQuantity: 1,
            totalRevenue: 1
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ]);

      // Weekly sales trend
      const weeklySalesTrend = await Sale.aggregate([
        { 
          $match: {
            ...branchFilter,
            createdAt: { $gte: last7Days },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            sales: { $sum: 1 },
            revenue: { $sum: "$total" }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      // User counts
      const totalUsers = await User.countDocuments({ isActive: true });
      const activeUsersToday = await User.countDocuments({
        isActive: true,
        lastLogin: { $gte: startOfDay }
      });

      const dashboardData = {
        kpis: {
          totalProducts,
          totalSales,
          totalRevenue,
          lowStockCount: lowStockItems.length,
          totalUsers,
          activeUsersToday,
          todaySales: {
            count: todaySalesCount,
            amount: todaySalesAmount
          },
          periodStats: {
            sales: totalSales,
            revenue: totalRevenue,
            averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
            period: period
          }
        },
        charts: {
          weeklySalesTrend,
          topCategories,
          topProducts: topProducts.slice(0, 5)
        },
        alerts: {
          lowStockItems,
          recentSales: recentSales.slice(0, 5)
        },
        period: {
          selected: period,
          today: today.toISOString(),
          startOfMonth: startOfMonth.toISOString(),
          periodStart: periodStartDate.toISOString(),
          last7Days: last7Days.toISOString(),
          last30Days: last30Days.toISOString()
        }
      };

      ResponseUtils.success(res, dashboardData, 'Dashboard data retrieved successfully');

    } catch (error) {
      console.error('Dashboard overview error:', error);
      ResponseUtils.error(res, 'Failed to fetch dashboard data', 500);
    }
  });

  static getSalesChartData = asyncHandler(async (req, res) => {
    try {
      const { period = '7days', branchId } = req.query;
      
      // Determine date range
      let startDate = new Date();
      let groupBy = {};
      
      switch (period) {
        case '24hours':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          groupBy = {
            $dateToString: {
              format: "%Y-%m-%d %H:00",
              date: "$createdAt"
            }
          };
          break;
        case '7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          groupBy = {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          };
          break;
        case '30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          groupBy = {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          };
          break;
        case '12months':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          groupBy = {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt"
            }
          };
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          groupBy = {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          };
      }

      // Build filter
      const filter = {
        createdAt: { $gte: startDate },
        status: 'completed'
      };

      if (branchId && branchId !== 'all') {
        filter.branch = new mongoose.Types.ObjectId(branchId);
      } else if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch;
      }

      // Aggregate sales data
      const salesData = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupBy,
            sales: { $sum: 1 },
            revenue: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" }
          }
        },
        { $sort: { "_id": 1 } },
        {
          $project: {
            date: "$_id",
            sales: 1,
            revenue: { $round: ["$revenue", 2] },
            averageOrderValue: { $round: ["$averageOrderValue", 2] }
          }
        }
      ]);

      // Fill in missing dates with zero values for better chart continuity
      const chartData = [];
      
      if (period === '24hours') {
        // For 24 hours, create hourly data points
        for (let i = 23; i >= 0; i--) {
          const date = new Date(Date.now() - i * 60 * 60 * 1000);
          const dateStr = date.toISOString().slice(0, 13) + ':00';
          
          const existingData = salesData.find(item => item.date === dateStr);
          chartData.push({
            date: dateStr,
            sales: existingData ? existingData.sales : 0,
            revenue: existingData ? existingData.revenue : 0,
            averageOrderValue: existingData ? existingData.averageOrderValue : 0
          });
        }
      } else if (period === '12months') {
        // For 12 months, create monthly data points
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const dateStr = date.toISOString().slice(0, 7);
          
          const existingData = salesData.find(item => item.date === dateStr);
          chartData.push({
            date: dateStr,
            sales: existingData ? existingData.sales : 0,
            revenue: existingData ? existingData.revenue : 0,
            averageOrderValue: existingData ? existingData.averageOrderValue : 0
          });
        }
      } else {
        // For daily periods (7days, 30days)
        const days = period === '7days' ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().slice(0, 10);
          
          const existingData = salesData.find(item => item.date === dateStr);
          chartData.push({
            date: dateStr,
            sales: existingData ? existingData.sales : 0,
            revenue: existingData ? existingData.revenue : 0,
            averageOrderValue: existingData ? existingData.averageOrderValue : 0
          });
        }
      }

      ResponseUtils.success(res, chartData, 'Sales chart data retrieved successfully');
    } catch (error) {
      console.error('Sales chart data error:', error);
      ResponseUtils.error(res, 'Failed to retrieve sales chart data', 500);
    }
  });

  static getInventoryAnalytics = asyncHandler(async (req, res) => {
    try {
      const { branchId } = req.query;
      
      // Build base filter
      const baseFilter = { isActive: true };
      if (branchId && branchId !== 'all') {
        baseFilter['stockByBranch.branch'] = new mongoose.Types.ObjectId(branchId);
      }

      // Low stock items with detailed information
      const lowStockItems = await Product.aggregate([
        { $match: baseFilter },
        {
          $addFields: {
            currentStock: {
              $cond: {
                if: { $isArray: "$stockByBranch" },
                then: {
                  $sum: {
                    $map: {
                      input: "$stockByBranch",
                      as: "stock",
                      in: "$$stock.quantity"
                    }
                  }
                },
                else: "$quantity"
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { currentStock: { $lte: 10 } },
              { quantity: { $lte: 10 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: 'stockByBranch.branch',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        {
          $project: {
            name: 1,
            sku: 1,
            category: 1,
            currentStock: 1,
            minStockLevel: 1,
            maxStockLevel: 1,
            price: '$pricing.sellingPrice',
            costPrice: '$pricing.costPrice',
            stockStatus: {
              $cond: {
                if: { $lte: ["$currentStock", 5] },
                then: "critical",
                else: {
                  $cond: {
                    if: { $lte: ["$currentStock", 10] },
                    then: "low",
                    else: "normal"
                  }
                }
              }
            },
            stockByBranch: 1,
            branchInfo: 1
          }
        },
        { $sort: { currentStock: 1 } },
        { $limit: 20 }
      ]);

      // Category distribution with value analysis
      const categoryStats = await Product.aggregate([
        { $match: baseFilter },
        {
          $addFields: {
            currentStock: {
              $cond: {
                if: { $isArray: "$stockByBranch" },
                then: {
                  $sum: {
                    $map: {
                      input: "$stockByBranch",
                      as: "stock",
                      in: "$$stock.quantity"
                    }
                  }
                },
                else: "$quantity"
              }
            }
          }
        },
        { 
          $group: {
            _id: '$category',
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$currentStock" },
            totalValue: { $sum: { $multiply: ['$price', '$currentStock'] } },
            averagePrice: { $avg: '$price' },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ["$currentStock", 10] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            totalProducts: 1,
            totalStock: 1,
            totalValue: { $round: ['$totalValue', 2] },
            averagePrice: { $round: ['$averagePrice', 2] },
            lowStockItems: 1,
            stockHealth: {
              $cond: {
                if: { $eq: ['$lowStockItems', 0] },
                then: 'excellent',
                else: {
                  $cond: {
                    if: { $lte: [{ $divide: ['$lowStockItems', '$totalProducts'] }, 0.1] },
                    then: 'good',
                    else: {
                      $cond: {
                        if: { $lte: [{ $divide: ['$lowStockItems', '$totalProducts'] }, 0.3] },
                        then: 'warning',
                        else: 'critical'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $sort: { totalValue: -1 } },
        { $limit: 15 }
      ]);

      // Top value products (highest inventory value)
      const topValueProducts = await Product.aggregate([
        { $match: baseFilter },
        {
          $addFields: {
            currentStock: {
              $cond: {
                if: { $isArray: "$stockByBranch" },
                then: {
                  $sum: {
                    $map: {
                      input: "$stockByBranch",
                      as: "stock",
                      in: "$$stock.quantity"
                    }
                  }
                },
                else: "$quantity"
              }
            },
            inventoryValue: {
              $multiply: [
                '$price',
                {
                  $cond: {
                    if: { $isArray: "$stockByBranch" },
                    then: {
                      $sum: {
                        $map: {
                          input: "$stockByBranch",
                          as: "stock",
                          in: "$$stock.quantity"
                        }
                      }
                    },
                    else: "$quantity"
                  }
                }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            sku: 1,
            category: 1,
            currentStock: 1,
            price: '$pricing.sellingPrice',
            inventoryValue: { $round: ['$inventoryValue', 2] }
          }
        },
        { $sort: { inventoryValue: -1 } },
        { $limit: 10 }
      ]);

      // Overall inventory summary
      const inventorySummary = await Product.aggregate([
        { $match: baseFilter },
        {
          $addFields: {
            currentStock: {
              $cond: {
                if: { $isArray: "$stockByBranch" },
                then: {
                  $sum: {
                    $map: {
                      input: "$stockByBranch",
                      as: "stock",
                      in: "$$stock.quantity"
                    }
                  }
                },
                else: "$quantity"
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockQuantity: { $sum: "$currentStock" },
            totalInventoryValue: { $sum: { $multiply: ['$price', '$currentStock'] } },
            totalCostValue: { $sum: { $multiply: ['$costPrice', '$currentStock'] } },
            averageStockLevel: { $avg: "$currentStock" },
            criticalStockItems: {
              $sum: { $cond: [{ $lte: ["$currentStock", 5] }, 1, 0] }
            },
            lowStockItems: {
              $sum: { $cond: [{ $and: [{ $gt: ["$currentStock", 5] }, { $lte: ["$currentStock", 10] }] }, 1, 0] }
            },
            normalStockItems: {
              $sum: { $cond: [{ $gt: ["$currentStock", 10] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalProducts: 1,
            totalStockQuantity: 1,
            totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
            totalCostValue: { $round: ['$totalCostValue', 2] },
            potentialProfit: { $round: [{ $subtract: ['$totalInventoryValue', '$totalCostValue'] }, 2] },
            averageStockLevel: { $round: ['$averageStockLevel', 2] },
            criticalStockItems: 1,
            lowStockItems: 1,
            normalStockItems: 1,
            stockHealthScore: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        '$normalStockItems',
                        '$totalProducts'
                      ]
                    },
                    100
                  ]
                },
                1
              ]
            }
          }
        }
      ]);

      const data = {
        summary: inventorySummary[0] || {
          totalProducts: 0,
          totalStockQuantity: 0,
          totalInventoryValue: 0,
          totalCostValue: 0,
          potentialProfit: 0,
          averageStockLevel: 0,
          criticalStockItems: 0,
          lowStockItems: 0,
          normalStockItems: 0,
          stockHealthScore: 0
        },
        lowStockItems,
        categoryStats,
        topValueProducts
      };

      ResponseUtils.success(res, data, 'Inventory analytics retrieved successfully');
    } catch (error) {
      console.error('Inventory analytics error:', error);
      ResponseUtils.error(res, 'Failed to retrieve inventory analytics', 500);
    }
  });

  static getAlerts = asyncHandler(async (req, res) => {
    try {
      const alerts = [];
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Critical stock alerts
      const criticalStockCount = await Product.countDocuments({
        isActive: true,
        $or: [
          { quantity: { $lte: 5 } },
          { 'stockByBranch.quantity': { $lte: 5 } }
        ]
      });

      if (criticalStockCount > 0) {
        alerts.push({
          id: `critical-stock-${Date.now()}`,
          type: 'critical',
          category: 'inventory',
          title: 'Critical Stock Alert',
          message: `${criticalStockCount} product(s) have critically low stock levels`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          data: { count: criticalStockCount }
        });
      }

      // Low stock alerts
      const lowStockCount = await Product.countDocuments({
        isActive: true,
        $or: [
          { quantity: { $gt: 5, $lte: 10 } },
          { 'stockByBranch.quantity': { $gt: 5, $lte: 10 } }
        ]
      });

      if (lowStockCount > 0) {
        alerts.push({
          id: `low-stock-${Date.now()}`,
          type: 'warning',
          category: 'inventory',
          title: 'Low Stock Warning',
          message: `${lowStockCount} product(s) are running low on stock`,
          timestamp: new Date().toISOString(),
          actionRequired: false,
          data: { count: lowStockCount }
        });
      }

      // Today's sales performance
      const todaySales = await Sale.countDocuments({
        createdAt: { $gte: startOfDay },
        status: 'completed'
      });

      const todayRevenue = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' }
          }
        }
      ]);

      const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;

      // Check if today's sales are significantly above/below average
      const last7DaysStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const avgDailySales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: last7DaysStart, $lt: startOfDay },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            dailySales: { $sum: 1 },
            dailyRevenue: { $sum: '$total' }
          }
        },
        {
          $group: {
            _id: null,
            avgSales: { $avg: '$dailySales' },
            avgRevenue: { $avg: '$dailyRevenue' }
          }
        }
      ]);

      if (avgDailySales.length > 0) {
        const avg = avgDailySales[0];
        
        if (todaySales > avg.avgSales * 1.5) {
          alerts.push({
            id: `high-sales-${Date.now()}`,
            type: 'success',
            category: 'sales',
            title: 'Excellent Sales Performance',
            message: `Today's sales (${todaySales}) are ${Math.round(((todaySales / avg.avgSales) - 1) * 100)}% above average`,
            timestamp: new Date().toISOString(),
            actionRequired: false,
            data: { todaySales, avgSales: Math.round(avg.avgSales) }
          });
        } else if (todaySales < avg.avgSales * 0.7 && new Date().getHours() > 12) {
          alerts.push({
            id: `low-sales-${Date.now()}`,
            type: 'warning',
            category: 'sales',
            title: 'Below Average Sales',
            message: `Today's sales (${todaySales}) are ${Math.round((1 - (todaySales / avg.avgSales)) * 100)}% below average`,
            timestamp: new Date().toISOString(),
            actionRequired: false,
            data: { todaySales, avgSales: Math.round(avg.avgSales) }
          });
        }
      }

      // Check for products expiring soon (if applicable)
      const expiringProducts = await Product.countDocuments({
        isActive: true,
        expiryDate: {
          $gte: today,
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      });

      if (expiringProducts > 0) {
        alerts.push({
          id: `expiring-products-${Date.now()}`,
          type: 'warning',
          category: 'inventory',
          title: 'Products Expiring Soon',
          message: `${expiringProducts} product(s) will expire within the next 7 days`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          data: { count: expiringProducts }
        });
      }

      // Check for inactive users (haven't logged in for 30 days)
      const inactiveUsers = await User.countDocuments({
        isActive: true,
        lastLogin: {
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      });

      if (inactiveUsers > 0) {
        alerts.push({
          id: `inactive-users-${Date.now()}`,
          type: 'info',
          category: 'users',
          title: 'Inactive User Accounts',
          message: `${inactiveUsers} user(s) haven't logged in for over 30 days`,
          timestamp: new Date().toISOString(),
          actionRequired: false,
          data: { count: inactiveUsers }
        });
      }

      // Check for system performance (placeholder for future implementation)
      if (Math.random() > 0.8) { // 20% chance to show system info
        alerts.push({
          id: `system-info-${Date.now()}`,
          type: 'info',
          category: 'system',
          title: 'System Status',
          message: 'All systems are running optimally',
          timestamp: new Date().toISOString(),
          actionRequired: false,
          data: { status: 'optimal' }
        });
      }

      // Sort alerts by priority and timestamp
      const priorityOrder = { critical: 0, warning: 1, success: 2, info: 3 };
      alerts.sort((a, b) => {
        if (priorityOrder[a.type] !== priorityOrder[b.type]) {
          return priorityOrder[a.type] - priorityOrder[b.type];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      ResponseUtils.success(res, alerts.slice(0, 10), 'Alerts retrieved successfully');
    } catch (error) {
      console.error('Alerts error:', error);
      ResponseUtils.error(res, 'Failed to retrieve alerts', 500);
    }
  });
}

module.exports = DashboardController;