const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const ResponseUtils = require('../utils/responseUtils');

class DashboardController {
  static getDashboardOverview = asyncHandler(async (req, res) => {
    try {
      const totalProducts = await Product.countDocuments();
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todaySales = await Sale.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const todaySalesAmount = todaySales.reduce((sum, sale) => sum + (sale.totals?.grandTotal || 0), 0);

      const allSales = await Sale.find({});
      const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.totals?.grandTotal || 0), 0);
      const totalSales = allSales.length;

      const lowStockItems = await Product.find({
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      }).limit(10);

      const topCategories = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      const dashboardData = {
        totalProducts,
        totalSales,
        todaySales: todaySalesAmount,
        totalRevenue,
        lowStockItems,
        topCategories
      };

      return ResponseUtils.success(res, dashboardData, 'Dashboard data retrieved successfully');

    } catch (error) {
      console.error('Dashboard overview error:', error);
      return ResponseUtils.error(res, 'Failed to fetch dashboard data');
    }
  });

  static getSalesChartData = asyncHandler(async (req, res) => {
    try {
      const { period = '7days' } = req.query;
      let startDate = new Date();
      
      switch (period) {
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const salesData = await Sale.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$totals.grandTotal' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      return ResponseUtils.success(res, salesData, 'Sales chart data retrieved successfully');
    } catch (error) {
      console.error('Sales chart data error:', error);
      return ResponseUtils.error(res, 'Failed to fetch sales chart data');
    }
  });

  static getInventoryAnalytics = asyncHandler(async (req, res) => {
    try {
      const inventorySummary = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
          }
        }
      ]);

      return ResponseUtils.success(res, inventorySummary[0] || {}, 'Inventory analytics retrieved successfully');
    } catch (error) {
      console.error('Inventory analytics error:', error);
      return ResponseUtils.error(res, 'Failed to fetch inventory analytics');
    }
  });

  static getUserPerformance = asyncHandler(async (req, res) => {
    try {
      const userPerformance = await Sale.aggregate([
        {
          $group: {
            _id: '$cashierId',
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$totals.grandTotal' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return ResponseUtils.success(res, userPerformance, 'User performance data retrieved successfully');
    } catch (error) {
      console.error('User performance error:', error);
      return ResponseUtils.error(res, 'Failed to fetch user performance data');
    }
  });

  static getAlerts = asyncHandler(async (req, res) => {
    try {
      const alerts = [];
      
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      }).limit(5);

      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockProducts.length} products are running low on stock`,
          data: lowStockProducts.map(p => ({ name: p.name, quantity: p.quantity }))
        });
      }

      return ResponseUtils.success(res, alerts, 'Alerts retrieved successfully');
    } catch (error) {
      console.error('Alerts error:', error);
      return ResponseUtils.error(res, 'Failed to fetch alerts');
    }
  });
}

module.exports = DashboardController;