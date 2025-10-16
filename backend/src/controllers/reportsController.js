const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ResponseUtils = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class ReportsController {
  static getDailyReport = asyncHandler(async (req, res) => {
    const { date, branchId, format = 'json' } = req.query;

    if (!date) {
      return res.status(400).json(
        ResponseUtils.error('Date parameter is required (YYYY-MM-DD format)', 400)
      );
    }

    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json(
        ResponseUtils.error('Invalid date format. Use YYYY-MM-DD', 400)
      );
    }

    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    const filter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (branchId) {
      filter.branch = branchId;
    }

    // Access control
    if (req.user.role === 'Cashier' || req.user.role === 'Viewer') {
      filter.createdBy = req.user._id;
    }

    const sales = await Sale.find(filter)
      .populate('branch', 'name address')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku category');

    // Calculate metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxAmount, 0);
    const grossProfit = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => 
        itemSum + ((item.sellingPrice - item.costPrice) * item.quantity), 0), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Payment method breakdown
    const paymentMethods = {};
    sales.forEach(sale => {
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
    });

    // Hourly sales distribution
    const hourlySales = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      revenue: 0
    }));

    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hourlySales[hour].sales++;
      hourlySales[hour].revenue += sale.total;
    });

    // Top selling products
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.product._id]) {
          productSales[item.product._id] = {
            product: item.product,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.product._id].quantity += item.quantity;
        productSales[item.product._id].revenue += item.sellingPrice * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const reportData = {
      date: date,
      summary: {
        totalSales,
        totalRevenue,
        totalDiscount,
        totalTax,
        grossProfit,
        averageOrderValue,
        profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      },
      paymentMethods,
      hourlySales,
      topProducts,
      sales: sales.slice(0, format === 'json' ? 10 : sales.length)
    };

    // Log report generation
    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: `Daily report generated for ${date}`,
      details: {
        type: 'daily',
        date,
        branchId,
        recordCount: totalSales
      },
      ipAddress: req.ip
    });

    if (format === 'excel') {
      return this.generateExcelReport(res, 'Daily Report', reportData);
    } else if (format === 'pdf') {
      return this.generatePDFReport(res, 'Daily Report', reportData);
    }

    return ResponseUtils.success(res, reportData, 'Daily report generated successfully');
  });

  static getSalesReport = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate, 
      branchId,
      categoryId,
      paymentMethod, 
      cashierId,
      format = 'json',
      groupBy = 'day',
      page = 1,
      limit = 50
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        ResponseUtils.error('Start date and end date are required', 400)
      );
    }

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Apply branch filter from middleware (for Store Manager, Inventory Manager, Cashier)
    if (req.branchFilter) {
      filter.branch = req.branchFilter.branch;
    } else if (branchId) {
      filter.branch = branchId;
    }
    
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (cashierId) filter.createdBy = cashierId;

    // Access control
    if (req.user.role === 'Cashier' || req.user.role === 'Viewer') {
      filter.createdBy = req.user._id;
    }

    const sales = await Sale.find(filter)
      .populate('branch', 'name address')
      .populate('createdBy', 'name email')
      .populate({
        path: 'items.product',
        select: 'name sku category brand',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    // Filter by category if specified (post-query filtering since category is in populated product)
    let filteredSales = sales;
    if (categoryId) {
      filteredSales = sales.filter(sale => 
        sale.items.some(item => 
          item.product && 
          item.product.category && 
          item.product.category._id.toString() === categoryId
        )
      );
    }

    // Calculate comprehensive metrics using filtered sales
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = filteredSales.reduce((sum, sale) => sum + sale.discountAmount, 0);
    const totalTax = filteredSales.reduce((sum, sale) => sum + sale.taxAmount, 0);
    const totalCost = filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => 
        itemSum + (item.costPrice * item.quantity), 0), 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalDiscount;

    // Payment method analysis
    const paymentMethodAnalysis = {};
    filteredSales.forEach(sale => {
      if (!paymentMethodAnalysis[sale.paymentMethod]) {
        paymentMethodAnalysis[sale.paymentMethod] = {
          count: 0,
          amount: 0,
          percentage: 0
        };
      }
      paymentMethodAnalysis[sale.paymentMethod].count++;
      paymentMethodAnalysis[sale.paymentMethod].amount += sale.total;
    });

    Object.keys(paymentMethodAnalysis).forEach(method => {
      paymentMethodAnalysis[method].percentage = 
        (paymentMethodAnalysis[method].amount / totalRevenue) * 100;
    });

    // Cashier performance (with null checks)
    const cashierPerformance = {};
    filteredSales.forEach(sale => {
      // Skip sales with no createdBy (orphaned data)
      if (!sale.createdBy || !sale.createdBy._id) return;
      
      const cashierId = sale.createdBy._id.toString();
      if (!cashierPerformance[cashierId]) {
        cashierPerformance[cashierId] = {
          cashier: sale.createdBy,
          salesCount: 0,
          totalAmount: 0,
          avgOrderValue: 0
        };
      }
      cashierPerformance[cashierId].salesCount++;
      cashierPerformance[cashierId].totalAmount += sale.total;
    });

    Object.keys(cashierPerformance).forEach(cashierId => {
      const perf = cashierPerformance[cashierId];
      perf.avgOrderValue = perf.totalAmount / perf.salesCount;
    });

    // Time-based grouping (use filtered sales)
    let timeGroupedData = [];
    if (groupBy === 'hour') {
      timeGroupedData = this.groupSalesByHour(filteredSales);
    } else if (groupBy === 'day') {
      timeGroupedData = this.groupSalesByDay(filteredSales);
    } else if (groupBy === 'week') {
      timeGroupedData = this.groupSalesByWeek(filteredSales);
    } else if (groupBy === 'month') {
      timeGroupedData = this.groupSalesByMonth(filteredSales);
    }

    // Product category analysis
    const categoryAnalysis = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        // Handle both populated and non-populated category
        const categoryName = item.product?.category?.name || 
                           (typeof item.product?.category === 'string' ? item.product.category : 'Uncategorized');
        if (!categoryAnalysis[categoryName]) {
          categoryAnalysis[categoryName] = {
            itemsSold: 0,
            revenue: 0
          };
        }
        categoryAnalysis[categoryName].itemsSold += item.quantity;
        categoryAnalysis[categoryName].revenue += item.sellingPrice * item.quantity;
      });
    });

    // Pagination for sales list
    const skip = (page - 1) * limit;
    const paginatedSales = sales.slice(skip, skip + parseInt(limit)).map(sale => ({
      _id: sale._id,
      invoiceNumber: sale.invoiceNumber,
      branch: sale.branch,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      createdBy: sale.createdBy,
      createdAt: sale.createdAt
    }));

    const reportData = {
      period: { startDate, endDate },
      filters: { branchId, paymentMethod, cashierId },
      summary: {
        totalSales,
        totalRevenue,
        totalDiscount,
        totalTax,
        totalCost,
        grossProfit,
        netProfit,
        profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      },
      paymentMethodAnalysis,
      cashierPerformance: Object.values(cashierPerformance),
      timeGroupedData,
      categoryAnalysis,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSales,
        pages: Math.ceil(totalSales / limit)
      },
      sales: paginatedSales
    };

    // Log report generation
    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: 'Sales report generated',
      details: {
        type: 'sales',
        filters: { startDate, endDate, branchId, paymentMethod, cashierId, groupBy },
        recordCount: totalSales,
        summary: reportData.summary
      },
      ipAddress: req.ip
    });

    if (format === 'excel') {
      return this.generateExcelReport(res, 'Sales Report', reportData);
    } else if (format === 'pdf') {
      return this.generatePDFReport(res, 'Sales Report', reportData);
    }

    return ResponseUtils.success(res, reportData, 'Sales report generated successfully');
  });

  static getProductReport = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate, 
      branchId, 
      categoryId,
      brandId,
      sortBy = 'revenue',
      format = 'json',
      limit = 50
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        ResponseUtils.error('Start date and end date are required', 400)
      );
    }

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Apply branch filter from middleware (for Store Manager, Inventory Manager, Cashier)
    if (req.branchFilter) {
      filter.branch = req.branchFilter.branch;
    } else if (branchId) {
      filter.branch = branchId;
    }

    const sales = await Sale.find(filter)
      .populate('items.product', 'name sku category brand costPrice');

    // Aggregate product performance
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            salesCount: 0,
            averageSellingPrice: 0,
            profit: 0,
            profitMargin: 0
          };
        }

        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += item.sellingPrice * item.quantity;
        productSales[productId].totalCost += item.costPrice * item.quantity;
        productSales[productId].salesCount++;
      });
    });

    // Calculate derived metrics
    Object.keys(productSales).forEach(productId => {
      const product = productSales[productId];
      product.averageSellingPrice = product.totalRevenue / product.totalQuantity;
      product.profit = product.totalRevenue - product.totalCost;
      product.profitMargin = product.totalRevenue > 0 ? 
        (product.profit / product.totalRevenue) * 100 : 0;
    });

    // Filter by category/brand if specified
    let filteredProducts = Object.values(productSales);
    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => 
        p.product.category && p.product.category.toString() === categoryId);
    }
    if (brandId) {
      filteredProducts = filteredProducts.filter(p => 
        p.product.brand && p.product.brand.toString() === brandId);
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'profit':
          return b.profit - a.profit;
        case 'profitMargin':
          return b.profitMargin - a.profitMargin;
        default:
          return b.totalRevenue - a.totalRevenue;
      }
    });

    // Limit results
    const limitedProducts = filteredProducts.slice(0, parseInt(limit));

    // Calculate summary
    const summary = {
      totalProductsSold: filteredProducts.length,
      totalQuantitySold: filteredProducts.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalRevenue: filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalProfit: filteredProducts.reduce((sum, p) => sum + p.profit, 0),
      averageProfitMargin: filteredProducts.length > 0 ? 
        filteredProducts.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProducts.length : 0
    };

    // Category performance analysis
    const categoryPerformance = {};
    filteredProducts.forEach(product => {
      const categoryName = product.product.category?.name || 'Uncategorized';
      if (!categoryPerformance[categoryName]) {
        categoryPerformance[categoryName] = {
          productCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      categoryPerformance[categoryName].productCount++;
      categoryPerformance[categoryName].totalQuantity += product.totalQuantity;
      categoryPerformance[categoryName].totalRevenue += product.totalRevenue;
      categoryPerformance[categoryName].totalProfit += product.profit;
    });

    // Brand performance analysis
    const brandPerformance = {};
    filteredProducts.forEach(product => {
      const brandName = product.product.brand?.name || 'Unbranded';
      if (!brandPerformance[brandName]) {
        brandPerformance[brandName] = {
          productCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      brandPerformance[brandName].productCount++;
      brandPerformance[brandName].totalQuantity += product.totalQuantity;
      brandPerformance[brandName].totalRevenue += product.totalRevenue;
      brandPerformance[brandName].totalProfit += product.profit;
    });

    const reportData = {
      period: { startDate, endDate },
      filters: { branchId, categoryId, brandId },
      sortBy,
      summary,
      categoryPerformance,
      brandPerformance,
      products: limitedProducts
    };

    // Log report generation
    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: `Product report generated for period ${startDate} to ${endDate}`,
      details: {
        type: 'product',
        period: { startDate, endDate },
        filters: { branchId, categoryId, brandId },
        recordCount: limitedProducts.length
      },
      ipAddress: req.ip
    });

    if (format === 'excel') {
      return this.generateExcelReport(res, 'Product Performance Report', reportData);
    } else if (format === 'pdf') {
      return this.generatePDFReport(res, 'Product Performance Report', reportData);
    }

    return ResponseUtils.success(res, reportData, 'Product report generated successfully');
  });

  static getInventoryReport = asyncHandler(async (req, res) => {
    const { 
      branchId, 
      categoryId, 
      brandId,
      stockStatus = 'all', // all, low, out, normal
      format = 'json',
      sortBy = 'name',
      page = 1,
      limit = 50
    } = req.query;

    const filter = { isActive: true };
    
    if (categoryId) filter.category = categoryId;
    if (brandId) filter.brand = brandId;

    // Apply branch filter for inventory report
    let filterBranchId = null;
    if (req.branchFilter && req.branchFilter.branch) {
      filterBranchId = req.branchFilter.branch;
    } else if (branchId) {
      filterBranchId = branchId;
    }

    // If branch is specified, filter products by that branch's stock
    if (filterBranchId) {
      filter['stockByBranch.branch'] = filterBranchId;
    }

    let products = await Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('stockByBranch.branch', 'name address');

    // Filter by branch and calculate stock
    const inventoryReport = products.map(product => {
      let totalStock = 0;
      let branchStock = [];

      if (product.stockByBranch && product.stockByBranch.length > 0) {
        if (branchId) {
          const branch = product.stockByBranch.find(s => 
            s.branch._id.toString() === branchId);
          totalStock = branch ? branch.quantity : 0;
          branchStock = branch ? [branch] : [];
        } else {
          totalStock = product.stockByBranch.reduce((sum, stock) => 
            sum + stock.quantity, 0);
          branchStock = product.stockByBranch;
        }
      }

      const costPrice = product.pricing?.costPrice || 0;
      const sellingPrice = product.pricing?.sellingPrice || 0;
      const stockValue = totalStock * costPrice;
      const sellingValue = totalStock * sellingPrice;
      const potentialProfit = sellingValue - stockValue;
      
      const isLowStock = totalStock <= (product.minStockLevel || 0);
      const isOutOfStock = totalStock === 0;

      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        brand: product.brand?.name || 'Unbranded',
        totalStock,
        minStockLevel: product.minStockLevel || 0,
        maxStockLevel: product.maxStockLevel || 0,
        reorderPoint: product.reorderPoint || 0,
        costPrice,
        sellingPrice,
        stockValue,
        sellingValue,
        potentialProfit,
        profitMargin: stockValue > 0 ? (potentialProfit / stockValue) * 100 : 0,
        isLowStock,
        isOutOfStock,
        stockStatus: isOutOfStock ? 'Out of Stock' : 
                    isLowStock ? 'Low Stock' : 'Normal',
        branchStock,
        lastUpdated: product.updatedAt
      };
    });

    // Filter by stock status
    if (stockStatus !== 'all') {
      inventoryReport = inventoryReport.filter(item => {
        switch (stockStatus) {
          case 'low':
            return item.isLowStock && !item.isOutOfStock;
          case 'out':
            return item.isOutOfStock;
          case 'normal':
            return !item.isLowStock && !item.isOutOfStock;
          default:
            return true;
        }
      });
    }

    // Sort inventory
    inventoryReport.sort((a, b) => {
      switch (sortBy) {
        case 'stock':
          return b.totalStock - a.totalStock;
        case 'value':
          return b.stockValue - a.stockValue;
        case 'profit':
          return b.potentialProfit - a.potentialProfit;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Calculate summary
    const summary = {
      totalProducts: inventoryReport.length,
      lowStockProducts: inventoryReport.filter(p => p.isLowStock).length,
      outOfStockProducts: inventoryReport.filter(p => p.isOutOfStock).length,
      normalStockProducts: inventoryReport.filter(p => !p.isLowStock && !p.isOutOfStock).length,
      totalStockValue: inventoryReport.reduce((sum, p) => sum + p.stockValue, 0),
      totalSellingValue: inventoryReport.reduce((sum, p) => sum + p.sellingValue, 0),
      totalPotentialProfit: inventoryReport.reduce((sum, p) => sum + p.potentialProfit, 0)
    };

    // Category-wise summary
    const categoryWise = {};
    inventoryReport.forEach(item => {
      if (!categoryWise[item.category]) {
        categoryWise[item.category] = {
          productCount: 0,
          totalStock: 0,
          stockValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        };
      }
      categoryWise[item.category].productCount++;
      categoryWise[item.category].totalStock += item.totalStock;
      categoryWise[item.category].stockValue += item.stockValue;
      if (item.isLowStock) categoryWise[item.category].lowStockCount++;
      if (item.isOutOfStock) categoryWise[item.category].outOfStockCount++;
    });

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedItems = inventoryReport.slice(skip, skip + parseInt(limit));

    const reportData = {
      filters: { branchId, categoryId, brandId, stockStatus },
      summary,
      categoryWise,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: inventoryReport.length,
        pages: Math.ceil(inventoryReport.length / limit)
      },
      products: paginatedItems
    };

    // Log report generation
    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: 'Inventory report generated',
      details: {
        type: 'inventory',
        filters: { branchId, categoryId, brandId, stockStatus },
        recordCount: inventoryReport.length
      },
      ipAddress: req.ip
    });

    if (format === 'excel') {
      return this.generateExcelReport(res, 'Inventory Report', reportData);
    } else if (format === 'pdf') {
      return this.generatePDFReport(res, 'Inventory Report', reportData);
    }

    return ResponseUtils.success(res, reportData, 'Inventory report generated successfully');
  });

  // Advanced Analytics Reports
  static getProfitAnalysis = asyncHandler(async (req, res) => {
    const { startDate, endDate, branchId, categoryId, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        ResponseUtils.error('Start date and end date are required', 400)
      );
    }

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Apply branch filter from middleware (for Store Manager, Inventory Manager, Cashier)
    if (req.branchFilter) {
      filter.branch = req.branchFilter.branch;
    } else if (branchId) {
      filter.branch = branchId;
    }

    const sales = await Sale.find(filter)
      .populate({
        path: 'items.product',
        select: 'costPrice category',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate('branch', 'name');

    // Filter by category if specified
    let filteredSales = sales;
    if (categoryId) {
      filteredSales = sales.filter(sale => 
        sale.items.some(item => 
          item.product && 
          item.product.category && 
          item.product.category._id.toString() === categoryId
        )
      );
    }

    // Calculate profit for each sale
    const profitAnalysis = filteredSales.map(sale => {
      const itemsProfitDetails = sale.items.map(item => {
        const itemProfit = (item.sellingPrice - item.costPrice) * item.quantity;
        return {
          productName: item.productName,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice,
          profit: itemProfit,
          margin: item.sellingPrice > 0 ? (itemProfit / (item.sellingPrice * item.quantity)) * 100 : 0
        };
      });

      const totalProfit = itemsProfitDetails.reduce((sum, item) => sum + item.profit, 0);
      const netProfit = totalProfit - sale.discountAmount;

      return {
        saleId: sale._id,
        date: sale.createdAt,
        branch: sale.branch?.name,
        totalRevenue: sale.total,
        totalCost: sale.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
        grossProfit: totalProfit,
        discountAmount: sale.discountAmount,
        netProfit,
        profitMargin: sale.total > 0 ? (netProfit / sale.total) * 100 : 0,
        itemsProfit: itemsProfitDetails
      };
    });

    // Group by time period
    const groupedData = this.groupProfitByPeriod(profitAnalysis, groupBy);

    // Calculate summary
    const summary = {
      totalRevenue: profitAnalysis.reduce((sum, sale) => sum + sale.totalRevenue, 0),
      totalCost: profitAnalysis.reduce((sum, sale) => sum + sale.totalCost, 0),
      grossProfit: profitAnalysis.reduce((sum, sale) => sum + sale.grossProfit, 0),
      netProfit: profitAnalysis.reduce((sum, sale) => sum + sale.netProfit, 0),
      averageMargin: profitAnalysis.length > 0 ? 
        profitAnalysis.reduce((sum, sale) => sum + sale.profitMargin, 0) / profitAnalysis.length : 0
    };

    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: `Profit analysis generated for period ${startDate} to ${endDate}`,
      details: {
        type: 'profit_analysis',
        period: { startDate, endDate },
        recordCount: profitAnalysis.length
      },
      ipAddress: req.ip
    });

    return ResponseUtils.success(res, {
      period: { startDate, endDate },
      summary,
      groupedData,
      details: profitAnalysis
    }, 'Profit analysis generated successfully');
  });

  static getCustomerAnalysis = asyncHandler(async (req, res) => {
    const { startDate, endDate, branchId, categoryId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        ResponseUtils.error('Start date and end date are required', 400)
      );
    }

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Apply branch filter from middleware (for Store Manager, Inventory Manager, Cashier)
    if (req.branchFilter) {
      filter.branch = req.branchFilter.branch;
    } else if (branchId) {
      filter.branch = branchId;
    }

    const sales = await Sale.find(filter)
      .populate('customer', 'name email phone')
      .populate({
        path: 'items.product',
        select: 'category',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate('branch', 'name');

    // Filter by category if specified
    let filteredSales = sales;
    if (categoryId) {
      filteredSales = sales.filter(sale => 
        sale.items.some(item => 
          item.product && 
          item.product.category && 
          item.product.category._id.toString() === categoryId
        )
      );
    }

    // Handle no sales found
    if (!filteredSales || filteredSales.length === 0) {
      return ResponseUtils.success(res, {
        period: { startDate, endDate },
        summary: {
          totalCustomers: 0,
          walkInCustomers: 0,
          registeredCustomers: 0,
          averageOrderValue: 0,
          totalRevenue: 0,
          segmentation: {
            vip: 0,
            loyal: 0,
            regular: 0,
            occasional: 0
          }
        },
        segments: {
          vip: [],
          loyal: [],
          regular: [],
          occasional: []
        },
        topCustomers: []
      }, 'No customer data found for the selected period');
    }

    // Customer behavior analysis
    const customerAnalysis = {};
    filteredSales.forEach(sale => {
      const customerId = sale.customer?._id?.toString() || 'walk-in';
      const customerName = sale.customer?.name || 'Walk-in Customer';

      if (!customerAnalysis[customerId]) {
        customerAnalysis[customerId] = {
          customer: sale.customer || { name: customerName },
          totalPurchases: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstPurchase: sale.createdAt,
          lastPurchase: sale.createdAt,
          preferredPaymentMethod: {},
          purchaseFrequency: 0
        };
      }

      const analysis = customerAnalysis[customerId];
      analysis.totalPurchases++;
      analysis.totalSpent += sale.total;
      
      if (sale.createdAt < analysis.firstPurchase) {
        analysis.firstPurchase = sale.createdAt;
      }
      if (sale.createdAt > analysis.lastPurchase) {
        analysis.lastPurchase = sale.createdAt;
      }

      // Payment method preference
      if (!analysis.preferredPaymentMethod[sale.paymentMethod]) {
        analysis.preferredPaymentMethod[sale.paymentMethod] = 0;
      }
      analysis.preferredPaymentMethod[sale.paymentMethod]++;
    });

    // Calculate derived metrics
    Object.keys(customerAnalysis).forEach(customerId => {
      const analysis = customerAnalysis[customerId];
      analysis.averageOrderValue = analysis.totalSpent / analysis.totalPurchases;
      
      // Calculate purchase frequency (purchases per month)
      const daysDiff = (analysis.lastPurchase - analysis.firstPurchase) / (1000 * 60 * 60 * 24);
      analysis.purchaseFrequency = daysDiff > 0 ? 
        (analysis.totalPurchases / (daysDiff / 30)) : 0;

      // Find most preferred payment method
      const paymentMethods = Object.keys(analysis.preferredPaymentMethod);
      if (paymentMethods.length > 0) {
        analysis.mostPreferredPayment = paymentMethods
          .reduce((a, b) => analysis.preferredPaymentMethod[a] > analysis.preferredPaymentMethod[b] ? a : b);
      } else {
        analysis.mostPreferredPayment = 'N/A';
      }
    });

    // Sort customers by total spent
    const sortedCustomers = Object.values(customerAnalysis)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Customer segmentation
    const segments = {
      vip: sortedCustomers.filter(c => c.totalSpent > 10000),
      loyal: sortedCustomers.filter(c => c.totalPurchases >= 10 && c.totalSpent <= 10000),
      regular: sortedCustomers.filter(c => c.totalPurchases >= 3 && c.totalPurchases < 10),
      occasional: sortedCustomers.filter(c => c.totalPurchases < 3)
    };

    const summary = {
      totalCustomers: sortedCustomers.length,
      walkInCustomers: customerAnalysis['walk-in'] ? 1 : 0,
      registeredCustomers: sortedCustomers.length - (customerAnalysis['walk-in'] ? 1 : 0),
      averageOrderValue: sortedCustomers.length > 0 ? 
        sortedCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / sortedCustomers.length : 0,
      totalRevenue: sortedCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
      segmentation: {
        vip: segments.vip.length,
        loyal: segments.loyal.length,
        regular: segments.regular.length,
        occasional: segments.occasional.length
      }
    };

    await AuditLog.create({
      userId: req.user.id || req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'financial_report_generate',
      resourceType: 'report',
      description: `Customer analysis generated for period ${startDate} to ${endDate}`,
      details: {
        type: 'customer_analysis',
        period: { startDate, endDate },
        customerCount: sortedCustomers.length
      },
      ipAddress: req.ip
    });

    return ResponseUtils.success(res, {
      period: { startDate, endDate },
      summary,
      segments,
      topCustomers: sortedCustomers.slice(0, 20)
    }, 'Customer analysis generated successfully');
  });

  // Utility methods for time-based grouping
  static groupSalesByHour = (sales) => {
    const grouped = Array.from({ length: 24 }, (_, i) => ({
      period: `${i}:00`,
      sales: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    }));

    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      grouped[hour].sales++;
      grouped[hour].revenue += sale.total;
      
      // Calculate cost for this sale
      const saleCost = sale.items.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0);
      grouped[hour].cost += saleCost;
      grouped[hour].profit += (sale.total - saleCost);
    });

    return grouped;
  };

  static groupSalesByDay = (sales) => {
    const grouped = {};
    sales.forEach(sale => {
      const day = sale.createdAt.toISOString().split('T')[0];
      if (!grouped[day]) {
        grouped[day] = { period: day, sales: 0, revenue: 0, cost: 0, profit: 0 };
      }
      grouped[day].sales++;
      grouped[day].revenue += sale.total;
      
      // Calculate cost for this sale
      const saleCost = sale.items.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0);
      grouped[day].cost += saleCost;
      grouped[day].profit += (sale.total - saleCost);
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  };

  static groupSalesByWeek = (sales) => {
    const grouped = {};
    sales.forEach(sale => {
      const weekStart = new Date(sale.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = { period: `Week of ${weekKey}`, sales: 0, revenue: 0, cost: 0, profit: 0 };
      }
      grouped[weekKey].sales++;
      grouped[weekKey].revenue += sale.total;
      
      // Calculate cost for this sale
      const saleCost = sale.items.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0);
      grouped[weekKey].cost += saleCost;
      grouped[weekKey].profit += (sale.total - saleCost);
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  };

  static groupSalesByMonth = (sales) => {
    const grouped = {};
    sales.forEach(sale => {
      const month = sale.createdAt.toISOString().substring(0, 7);
      if (!grouped[month]) {
        grouped[month] = { period: month, sales: 0, revenue: 0, cost: 0, profit: 0 };
      }
      grouped[month].sales++;
      grouped[month].revenue += sale.total;
      
      // Calculate cost for this sale
      const saleCost = sale.items.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0);
      grouped[month].cost += saleCost;
      grouped[month].profit += (sale.total - saleCost);
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  };

  static groupProfitByPeriod = (profitData, groupBy) => {
    const grouped = {};
    
    profitData.forEach(item => {
      let period;
      if (groupBy === 'day') {
        period = item.date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(item.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        period = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        period = item.date.toISOString().substring(0, 7);
      }

      if (!grouped[period]) {
        grouped[period] = {
          period,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          netProfit: 0,
          salesCount: 0
        };
      }

      grouped[period].revenue += item.totalRevenue;
      grouped[period].cost += item.totalCost;
      grouped[period].grossProfit += item.grossProfit;
      grouped[period].netProfit += item.netProfit;
      grouped[period].salesCount++;
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  };

  // Export utilities
  static generateExcelReport = async (res, reportTitle, data) => {
    try {
      console.log('Generating Excel report:', reportTitle);
      console.log('Data structure:', {
        hasSummary: !!data.summary,
        hasTimeGroupedData: !!data.timeGroupedData,
        hasCategoryPerformance: !!data.categoryPerformance,
        hasTopProducts: !!data.topProducts
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(reportTitle);

      // Style for headers
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };

      // Style for title
      const titleStyle = {
        font: { bold: true, size: 16 },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };

      // Add title
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = reportTitle;
      titleCell.style = titleStyle;

      // Add metadata
      worksheet.getCell('A2').value = `Generated: ${new Date().toLocaleString('en-IN')}`;
      worksheet.mergeCells('A2:F2');

      let currentRow = 4;

      // Add summary section
      if (data.summary) {
        worksheet.getCell(`A${currentRow}`).value = 'Summary';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        Object.entries(data.summary).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          worksheet.getCell(`A${currentRow}`).value = label;
          worksheet.getCell(`B${currentRow}`).value = typeof value === 'number' 
            ? (key.includes('Revenue') || key.includes('Profit') || key.includes('Value') 
              ? `₹${value.toFixed(2)}` 
              : value)
            : value;
          currentRow++;
        });
        currentRow += 2;
      }

      // Add detailed data based on report type
      if (data.timeGroupedData && data.timeGroupedData.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'Daily Breakdown';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Headers
        const headers = ['Date', 'Sales', 'Revenue (₹)', 'Cost (₹)', 'Profit (₹)', 'Margin (%)'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.style = headerStyle;
        });
        currentRow++;

        // Data rows
        data.timeGroupedData.forEach(item => {
          const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100) : 0;
          worksheet.addRow([
            item.period || item.date || 'N/A',
            item.sales || 0,
            (item.revenue || 0).toFixed(2),
            (item.cost || 0).toFixed(2),
            (item.profit || 0).toFixed(2),
            margin.toFixed(2)
          ]);
          currentRow++;
        });
      } else if (data.categoryPerformance && data.categoryPerformance.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'Category Performance';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Headers
        const headers = ['Category', 'Products', 'Total Sales', 'Revenue (₹)', 'Avg Price (₹)', 'Stock Level'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.style = headerStyle;
        });
        currentRow++;

        // Data rows
        data.categoryPerformance.forEach(item => {
          worksheet.addRow([
            item.categoryName || item.category || 'N/A',
            item.productCount || 0,
            item.totalSales || 0,
            (item.revenue || 0).toFixed(2),
            (item.averagePrice || 0).toFixed(2),
            item.totalStock || 0
          ]);
          currentRow++;
        });
      } else if (data.topProducts && data.topProducts.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'Top Products';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Headers
        const headers = ['Product', 'SKU', 'Category', 'Sales', 'Revenue (₹)', 'Stock'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.style = headerStyle;
        });
        currentRow++;

        // Data rows
        data.topProducts.forEach(item => {
          worksheet.addRow([
            item.name || 'N/A',
            item.sku || 'N/A',
            item.category?.name || 'N/A',
            item.totalSales || 0,
            (item.revenue || 0).toFixed(2),
            item.stock || 0
          ]);
          currentRow++;
        });
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.xlsx"`);

      console.log('Writing Excel workbook to response...');
      await workbook.xlsx.write(res);
      console.log('Excel workbook written successfully');
      res.end();
    } catch (error) {
      console.error('Excel generation error:', error);
      console.error('Error stack:', error.stack);
      if (!res.headersSent) {
        throw error;
      }
    }
  };

  static generatePDFReport = async (res, reportTitle, data) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true // Enable page buffering for footer
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf"`);

      doc.pipe(res);

      // Title
      doc.fontSize(20)
         .fillColor('#4F46E5')
         .text(reportTitle, { align: 'center' })
         .moveDown(0.5);

      // Generated date
      doc.fontSize(10)
         .fillColor('#64748B')
         .text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' })
         .moveDown(1);

      // Summary section
      if (data.summary && Object.keys(data.summary).length > 0) {
        doc.fontSize(14)
           .fillColor('#1E293B')
           .text('Summary', { underline: true })
           .moveDown(0.5);

        doc.fontSize(11)
           .fillColor('#334155');

        Object.entries(data.summary).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          let displayValue = value;
          
          if (typeof value === 'number') {
            if (key.includes('Revenue') || key.includes('Profit') || key.includes('Value') || key.includes('Cost')) {
              displayValue = `₹${value.toFixed(2)}`;
            } else if (key.includes('Margin') || key.includes('Percentage')) {
              displayValue = `${value.toFixed(2)}%`;
            }
          }
          
          doc.text(`${label}: ${displayValue}`);
        });
        
        doc.moveDown(1.5);
      } else {
        // No summary data
        doc.fontSize(11)
           .fillColor('#64748B')
           .text('No summary data available for the selected period.', { align: 'center' })
           .moveDown(1);
      }

      // Detailed data section
      if (data.timeGroupedData && data.timeGroupedData.length > 0) {
        doc.fontSize(14)
           .fillColor('#1E293B')
           .text('Daily Breakdown', { underline: true })
           .moveDown(0.5);

        doc.fontSize(10)
           .fillColor('#334155');

        // Table headers
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 150;
        const col3X = 240;
        const col4X = 330;
        const col5X = 420;

        doc.font('Helvetica-Bold');
        doc.text('Date', col1X, tableTop);
        doc.text('Sales', col2X, tableTop);
        doc.text('Revenue', col3X, tableTop);
        doc.text('Cost', col4X, tableTop);
        doc.text('Profit', col5X, tableTop);

        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        doc.font('Helvetica');
        let rowY = tableTop + 25;

        data.timeGroupedData.slice(0, 25).forEach(item => {
          if (rowY > 700) {
            doc.addPage();
            rowY = 50;
          }

          doc.text(item.period || item.date || 'N/A', col1X, rowY, { width: 90 });
          doc.text(String(item.sales || 0), col2X, rowY);
          doc.text(`₹${(item.revenue || 0).toFixed(2)}`, col3X, rowY);
          doc.text(`₹${(item.cost || 0).toFixed(2)}`, col4X, rowY);
          doc.text(`₹${(item.profit || 0).toFixed(2)}`, col5X, rowY);
          
          rowY += 20;
        });

        if (data.timeGroupedData.length > 25) {
          doc.moveDown(1)
             .fontSize(9)
             .fillColor('#64748B')
             .text(`... and ${data.timeGroupedData.length - 25} more entries`, { align: 'center' });
        }
      } else if (data.categoryPerformance && data.categoryPerformance.length > 0) {
        doc.fontSize(14)
           .fillColor('#1E293B')
           .text('Category Performance', { underline: true })
           .moveDown(0.5);

        doc.fontSize(10)
           .fillColor('#334155');

        data.categoryPerformance.forEach(item => {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(item.categoryName || item.category || 'N/A')
             .font('Helvetica')
             .fontSize(10)
             .text(`  Products: ${item.productCount || 0}`)
             .text(`  Total Sales: ${item.totalSales || 0}`)
             .text(`  Revenue: ₹${(item.revenue || 0).toFixed(2)}`)
             .text(`  Average Price: ₹${(item.averagePrice || 0).toFixed(2)}`)
             .moveDown(0.5);
        });
      } else if (data.topProducts && data.topProducts.length > 0) {
        doc.fontSize(14)
           .fillColor('#1E293B')
           .text('Top Products', { underline: true })
           .moveDown(0.5);

        doc.fontSize(10)
           .fillColor('#334155');

        data.topProducts.slice(0, 20).forEach(item => {
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .text(item.name || 'N/A')
             .font('Helvetica')
             .fontSize(9)
             .text(`  SKU: ${item.sku || 'N/A'} | Category: ${item.category?.name || 'N/A'}`)
             .text(`  Sales: ${item.totalSales || 0} | Revenue: ₹${(item.revenue || 0).toFixed(2)} | Stock: ${item.stock || 0}`)
             .moveDown(0.3);
        });
      }

      // End document before adding footers
      doc.end();

      // Note: We've removed the footer loop because it was causing issues
      // PDFKit's bufferedPageRange() doesn't work reliably until after doc.end()
      // For page numbers, we would need a different approach or a post-processing step
      
    } catch (error) {
      console.error('PDF generation error:', error);
      console.error('Data received:', JSON.stringify(data, null, 2).substring(0, 500));
      // Don't throw after headers are sent
      if (!res.headersSent) {
        throw error;
      }
    }
  };
}

module.exports = ReportsController;
