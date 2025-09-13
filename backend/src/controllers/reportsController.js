/**
 * Reports Controller
 * Handles report generation and data export
 */
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class ReportsController {
  /**
   * Get daily sales report
   */
  static getDailyReport = asyncHandler(async (req, res) => {
    const { date } = req.query;

    // Validate date parameter
    if (!date) {
      return ResponseUtils.error(res, 'Date parameter is required (YYYY-MM-DD format)', 400);
    }

    // Parse and validate date
    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      return ResponseUtils.error(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Set date range for the entire day
    const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59);

    try {
      // Get all sales for the day
      const sales = await Sale.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('items.productId', 'name sku category price')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

      // Calculate summary statistics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
      const totalItemsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );

      // Calculate payment method breakdown
      const paymentMethods = {};
      sales.forEach(sale => {
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.grandTotal;
      });

      // Calculate category-wise sales
      const categorySales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const category = item.productId?.category || 'Unknown';
          if (!categorySales[category]) {
            categorySales[category] = {
              totalRevenue: 0,
              totalQuantity: 0,
              salesCount: 0
            };
          }
          categorySales[category].totalRevenue += item.totalPrice;
          categorySales[category].totalQuantity += item.quantity;
          categorySales[category].salesCount += 1;
        });
      });

      // Calculate hourly sales distribution
      const hourlySales = Array(24).fill(0);
      sales.forEach(sale => {
        const hour = sale.createdAt.getHours();
        hourlySales[hour] += sale.grandTotal;
      });

      // Get top selling products
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productId = item.productId?._id?.toString();
          const productName = item.productId?.name || 'Unknown Product';
          
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              productName,
              sku: item.productId?.sku,
              totalQuantity: 0,
              totalRevenue: 0,
              salesCount: 0
            };
          }
          
          productSales[productId].totalQuantity += item.quantity;
          productSales[productId].totalRevenue += item.totalPrice;
          productSales[productId].salesCount += 1;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      const reportData = {
        date: date,
        summary: {
          totalSales,
          totalRevenue,
          totalItemsSold,
          averageSaleValue: totalSales > 0 ? (totalRevenue / totalSales) : 0
        },
        paymentMethods,
        categorySales,
        hourlySales,
        topProducts,
        sales: sales.map(sale => ({
          _id: sale._id,
          saleNumber: sale.saleNumber,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          items: sale.items.map(item => ({
            productName: item.productId?.name || 'Unknown',
            sku: item.productId?.sku,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice
          })),
          subtotal: sale.subtotal,
          discountAmount: sale.discountAmount,
          taxAmount: sale.taxAmount,
          grandTotal: sale.grandTotal,
          paymentMethod: sale.paymentMethod,
          createdAt: sale.createdAt,
          createdBy: sale.createdBy ? {
            name: `${sale.createdBy.firstName} ${sale.createdBy.lastName}`
          } : null
        }))
      };

      return ResponseUtils.success(
        res, 
        reportData,
        `Daily report for ${date} generated successfully`
      );

    } catch (error) {
      console.error('Error generating daily report:', error);
      return ResponseUtils.error(res, 'Failed to generate daily report');
    }
  });

  /**
   * Get sales report for date range
   */
  static getDateRangeReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseUtils.error(res, 'Start date and end date are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ResponseUtils.error(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    if (start > end) {
      return ResponseUtils.error(res, 'Start date cannot be after end date', 400);
    }

    try {
      const sales = await Sale.find({
        createdAt: {
          $gte: start,
          $lte: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)
        }
      })
      .populate('items.productId', 'name sku category')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

      // Calculate daily breakdown
      const dailyBreakdown = {};
      sales.forEach(sale => {
        const day = sale.createdAt.toISOString().split('T')[0];
        if (!dailyBreakdown[day]) {
          dailyBreakdown[day] = {
            date: day,
            salesCount: 0,
            totalRevenue: 0,
            totalItems: 0
          };
        }
        dailyBreakdown[day].salesCount += 1;
        dailyBreakdown[day].totalRevenue += sale.grandTotal;
        dailyBreakdown[day].totalItems += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      });

      // Calculate payment method breakdown
      const paymentMethods = {};
      sales.forEach(sale => {
        const method = sale.paymentMethod || 'Unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = {
            count: 0,
            total: 0
          };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].total += sale.grandTotal;
      });
      
      const summary = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
        totalItemsSold: sales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        ),
        averageSaleValue: sales.length > 0 ? 
          sales.reduce((sum, sale) => sum + sale.grandTotal, 0) / sales.length : 0
      };

      // Calculate top products for the date range
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productId = item.productId?._id?.toString();
          const productName = item.productId?.name || 'Unknown Product';
          
          if (!productSales[productId]) {
            productSales[productId] = {
              _id: productId,
              name: productName,
              sku: item.productId?.sku,
              category: item.productId?.category,
              totalSold: 0,
              revenue: 0,
              salesCount: 0
            };
          }
          
          productSales[productId].totalSold += item.quantity;
          productSales[productId].revenue += item.totalPrice;
          productSales[productId].salesCount += 1;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return ResponseUtils.success(res, {
        startDate,
        endDate,
        summary,
        paymentMethods, // Include payment methods data
        dailySales: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)).map(day => ({
          date: day.date,
          sales: day.salesCount,
          revenue: day.totalRevenue,
          items: day.totalItems
        })),
        topProducts,
        sales: sales.slice(0, 100) // Limit to first 100 sales for performance
      }, `Sales report for ${startDate} to ${endDate} generated successfully`);

    } catch (error) {
      console.error('Error generating date range report:', error);
      return ResponseUtils.error(res, 'Failed to generate sales report');
    }
  });

  /**
   * Get product performance report
   */
  static getProductReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, category, limit = 50 } = req.query;

    try {
      let matchConditions = {};
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        matchConditions.createdAt = {
          $gte: start,
          $lte: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)
        };
      }

      // Aggregate product sales data
      const productStats = await Sale.aggregate([
        { $match: matchConditions },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        ...(category ? [{ $match: { 'product.category': category } }] : []),
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$product.name' },
            sku: { $first: '$product.sku' },
            category: { $first: '$product.category' },
            totalQuantitySold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalPrice' },
            salesCount: { $sum: 1 },
            averagePrice: { $avg: '$items.price' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: parseInt(limit) }
      ]);

      return ResponseUtils.success(res, {
        filters: { startDate, endDate, category },
        totalProducts: productStats.length,
        products: productStats
      }, 'Product performance report generated successfully');

    } catch (error) {
      console.error('Error generating product report:', error);
      return ResponseUtils.error(res, 'Failed to generate product report');
    }
  });
}

module.exports = ReportsController;