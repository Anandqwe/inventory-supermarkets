const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Supplier = require('../models/Supplier');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

class ProductController {
  static createProduct = asyncHandler(async (req, res) => {
    const { 
      name, 
      sku, 
      barcode,
      description,
      category: categoryId,
      brand: brandId,
      unit: unitId,
      supplier: supplierId,
      pricing,
      branchStocks = [],
      taxSettings,
      isActive = true 
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(409).json(
        ResponseUtils.error('Product with this SKU already exists', 409)
      );
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(409).json(
          ResponseUtils.error('Product with this barcode already exists', 409)
        );
      }
    }

    // Validate required references
    const [category, unit] = await Promise.all([
      Category.findById(categoryId),
      Unit.findById(unitId)
    ]);

    if (!category) {
      return res.status(400).json(
        ResponseUtils.error('Invalid category', 400)
      );
    }

    if (!unit) {
      return res.status(400).json(
        ResponseUtils.error('Invalid unit', 400)
      );
    }

    // Validate optional references
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(400).json(
          ResponseUtils.error('Invalid brand', 400)
        );
      }
    }

    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(400).json(
          ResponseUtils.error('Invalid supplier', 400)
        );
      }
    }

    const product = new Product({
      name,
      sku: sku.toUpperCase(),
      barcode,
      description,
      category: categoryId,
      brand: brandId,
      unit: unitId,
      supplier: supplierId,
      pricing: {
        costPrice: pricing?.costPrice || 0,
        sellingPrice: pricing?.sellingPrice || 0,
        mrp: pricing?.mrp || pricing?.sellingPrice || 0,
        margin: pricing?.margin || 0
      },
      branchStocks: branchStocks.map(stock => ({
        branch: stock.branchId,
        quantity: stock.quantity || 0,
        reorderLevel: stock.reorderLevel || 10,
        maxStockLevel: stock.maxStockLevel || 1000,
        location: stock.location
      })),
      taxSettings: {
        taxCategory: taxSettings?.taxCategory || 'standard',
        gstRate: taxSettings?.gstRate || 18,
        isExempt: taxSettings?.isExempt || false
      },
      isActive,
      createdBy: req.user.userId
    });

    await product.save();

    // Create audit log
    await AuditLog.create({
      action: 'CREATE_PRODUCT',
      resource: 'Product',
      resourceId: product._id,
      details: {
        name: product.name,
        sku: product.sku,
        category: categoryId
      },
      userId: req.user.userId,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name code')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('supplier', 'name')
      .populate('branchStocks.branch', 'name code');

    res.status(201).json(
      ResponseUtils.success('Product created successfully', populatedProduct, 201)
    );
  });

  static getAllProducts = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      search,
      category,
      brand,
      branch,
      lowStock,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Brand filter
    if (brand) {
      filter.brand = brand;
    }

    // Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Branch access filter for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      filter['branchStocks.branch'] = req.user.branch;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter }
    ];

    // Low stock filter
    if (lowStock === 'true') {
      pipeline.push({
        $match: {
          $expr: {
            $anyElementTrue: {
              $map: {
                input: "$branchStocks",
                as: "stock",
                in: { $lte: ["$$stock.quantity", "$$stock.reorderLevel"] }
              }
            }
          }
        }
      });
    }

    // Branch-specific stock filter
    if (branch) {
      pipeline.push({
        $match: {
          'branchStocks.branch': mongoose.Types.ObjectId(branch)
        }
      });
    }

    // Add lookups for populated fields
    pipeline.push(
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $lookup: {
          from: 'units',
          localField: 'unit',
          foreignField: '_id',
          as: 'unit'
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branchStocks.branch',
          foreignField: '_id',
          as: 'branchData'
        }
      }
    );

    // Unwind arrays from lookups
    pipeline.push(
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } }
    );

    // Add sorting
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({
      $sort: { [sortBy]: sortDirection }
    });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limitNum }
    );

    const products = await Product.aggregate(pipeline);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    };

    ResponseUtils.success(res, {
      products,
      pagination
    }, 'Products retrieved successfully');
  });

  static getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid product ID', 400)
      );
    }

    const product = await Product.findById(id)
      .populate('category', 'name code')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('supplier', 'name contact')
      .populate('branchStocks.branch', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!product) {
      return res.status(404).json(
        ResponseUtils.error('Product not found', 404)
      );
    }

    res.json(
      ResponseUtils.success('Product retrieved successfully', product)
    );
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid product ID', 400)
      );
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json(
        ResponseUtils.error('Product not found', 404)
      );
    }

    // Check if SKU is being changed and if it already exists
    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const skuExists = await Product.findOne({ sku: req.body.sku, _id: { $ne: id } });
      if (skuExists) {
        return res.status(409).json(
          ResponseUtils.error('Product with this SKU already exists', 409)
        );
      }
    }

    // Check if barcode is being changed and if it already exists
    if (req.body.barcode && req.body.barcode !== existingProduct.barcode) {
      const barcodeExists = await Product.findOne({ barcode: req.body.barcode, _id: { $ne: id } });
      if (barcodeExists) {
        return res.status(409).json(
          ResponseUtils.error('Product with this barcode already exists', 409)
        );
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };

    if (updateData.sku) {
      updateData.sku = updateData.sku.toUpperCase();
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name code')
     .populate('brand', 'name')
     .populate('unit', 'name symbol')
     .populate('supplier', 'name')
     .populate('branchStocks.branch', 'name code');

    // Create audit log
    await AuditLog.create({
      action: 'UPDATE_PRODUCT',
      resource: 'Product',
      resourceId: product._id,
      details: {
        name: product.name,
        sku: product.sku,
        changes: Object.keys(req.body)
      },
      userId: req.user.userId,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(
      ResponseUtils.success('Product updated successfully', product)
    );
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid product ID', 400)
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json(
        ResponseUtils.error('Product not found', 404)
      );
    }

    // Soft delete instead of hard delete
    await Product.findByIdAndUpdate(id, { 
      isActive: false,
      deletedAt: new Date(),
      deletedBy: req.user.userId
    });

    // Create audit log
    await AuditLog.create({
      action: 'DELETE_PRODUCT',
      resource: 'Product',
      resourceId: product._id,
      details: {
        name: product.name,
        sku: product.sku
      },
      userId: req.user.userId,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(
      ResponseUtils.success('Product deleted successfully')
    );
  });

  // CSV Export functionality
  static exportProducts = asyncHandler(async (req, res) => {
    try {
      const { branch, category, format = 'csv' } = req.query;
      const filter = { isActive: true };

      // Apply filters
      if (branch) {
        filter['branchStocks.branch'] = branch;
      }
      if (category) {
        filter.category = category;
      }

      // Branch access filter for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        filter['branchStocks.branch'] = req.user.branch;
      }

      const products = await Product.find(filter)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('unit', 'name symbol')
        .populate('supplier', 'name')
        .populate('branchStocks.branch', 'name code')
        .lean();

      if (format === 'csv') {
        // Generate CSV
        const csvData = products.map(product => {
          const branchStock = product.branchStocks.find(
            stock => !branch || stock.branch._id.toString() === branch
          );

          return {
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            description: product.description || '',
            category: product.category?.name || '',
            brand: product.brand?.name || '',
            unit: product.unit?.name || '',
            supplier: product.supplier?.name || '',
            costPrice: product.pricing?.costPrice || 0,
            sellingPrice: product.pricing?.sellingPrice || 0,
            mrp: product.pricing?.mrp || 0,
            quantity: branchStock?.quantity || 0,
            reorderLevel: branchStock?.reorderLevel || 0,
            maxStockLevel: branchStock?.maxStockLevel || 0,
            location: branchStock?.location || '',
            gstRate: product.taxSettings?.gstRate || 0,
            isActive: product.isActive
          };
        });

        const csvFilePath = path.join(__dirname, `../../uploads/products_export_${Date.now()}.csv`);
        
        const csvWriter = createCsvWriter({
          path: csvFilePath,
          header: [
            { id: 'name', title: 'Name' },
            { id: 'sku', title: 'SKU' },
            { id: 'barcode', title: 'Barcode' },
            { id: 'description', title: 'Description' },
            { id: 'category', title: 'Category' },
            { id: 'brand', title: 'Brand' },
            { id: 'unit', title: 'Unit' },
            { id: 'supplier', title: 'Supplier' },
            { id: 'costPrice', title: 'Cost Price' },
            { id: 'sellingPrice', title: 'Selling Price' },
            { id: 'mrp', title: 'MRP' },
            { id: 'quantity', title: 'Quantity' },
            { id: 'reorderLevel', title: 'Reorder Level' },
            { id: 'maxStockLevel', title: 'Max Stock Level' },
            { id: 'location', title: 'Location' },
            { id: 'gstRate', title: 'GST Rate' },
            { id: 'isActive', title: 'Active' }
          ]
        });

        await csvWriter.writeRecords(csvData);

        // Create audit log
        await AuditLog.create({
          action: 'EXPORT_PRODUCTS',
          resource: 'Product',
          details: {
            format: 'csv',
            count: products.length,
            filters: { branch, category }
          },
          userId: req.user.userId,
          userEmail: req.user.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.download(csvFilePath, `products_${new Date().toISOString().split('T')[0]}.csv`, (err) => {
          if (!err) {
            // Clean up file after download
            fs.unlink(csvFilePath, () => {});
          }
        });
      } else {
        // Return JSON for other formats
        res.json(
          ResponseUtils.success('Products exported successfully', {
            products: products,
            count: products.length,
            exportedAt: new Date().toISOString()
          })
        );
      }

    } catch (error) {
      console.error('Export products error:', error);
      res.status(500).json(
        ResponseUtils.error('Failed to export products', 500)
      );
    }
  });

  // CSV Import functionality
  static importProducts = [
    upload.single('csvFile'),
    asyncHandler(async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json(
            ResponseUtils.error('CSV file is required', 400)
          );
        }

        const { branchId, updateExisting = false } = req.body;
        const results = {
          success: [],
          errors: [],
          skipped: [],
          summary: {
            total: 0,
            created: 0,
            updated: 0,
            errors: 0,
            skipped: 0
          }
        };

        // Validate branch
        let targetBranch = null;
        if (branchId) {
          targetBranch = await Branch.findById(branchId);
          if (!targetBranch) {
            return res.status(400).json(
              ResponseUtils.error('Invalid branch ID', 400)
            );
          }
        } else if (req.user.branch) {
          targetBranch = await Branch.findById(req.user.branch);
        }

        if (!targetBranch) {
          return res.status(400).json(
            ResponseUtils.error('Branch is required', 400)
          );
        }

        // Get lookup data for validation
        const [categories, brands, units, suppliers] = await Promise.all([
          Category.find({ isActive: true }).lean(),
          Brand.find({ isActive: true }).lean(),
          Unit.find({ isActive: true }).lean(),
          Supplier.find({ isActive: true }).lean()
        ]);

        const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));
        const brandMap = new Map(brands.map(brand => [brand.name.toLowerCase(), brand._id]));
        const unitMap = new Map(units.map(unit => [unit.name.toLowerCase(), unit._id]));
        const supplierMap = new Map(suppliers.map(supplier => [supplier.name.toLowerCase(), supplier._id]));

        // Parse CSV
        const csvData = [];
        const csvFilePath = req.file.path;

        await new Promise((resolve, reject) => {
          fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => csvData.push(data))
            .on('end', resolve)
            .on('error', reject);
        });

        results.summary.total = csvData.length;

        // Process each row
        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          const rowNum = i + 2; // Add 2 for header and 0-based index

          try {
            // Validate required fields
            if (!row.name || !row.sku) {
              results.errors.push({
                row: rowNum,
                error: 'Name and SKU are required',
                data: row
              });
              results.summary.errors++;
              continue;
            }

            // Normalize and validate references
            const categoryId = row.category ? categoryMap.get(row.category.toLowerCase()) : null;
            const brandId = row.brand ? brandMap.get(row.brand.toLowerCase()) : null;
            const unitId = row.unit ? unitMap.get(row.unit.toLowerCase()) : null;
            const supplierId = row.supplier ? supplierMap.get(row.supplier.toLowerCase()) : null;

            if (!categoryId) {
              results.errors.push({
                row: rowNum,
                error: `Category '${row.category}' not found`,
                data: row
              });
              results.summary.errors++;
              continue;
            }

            if (!unitId) {
              results.errors.push({
                row: rowNum,
                error: `Unit '${row.unit}' not found`,
                data: row
              });
              results.summary.errors++;
              continue;
            }

            // Check if product exists
            const existingProduct = await Product.findOne({ sku: row.sku.toUpperCase() });

            if (existingProduct && !updateExisting) {
              results.skipped.push({
                row: rowNum,
                reason: 'Product already exists',
                sku: row.sku,
                data: row
              });
              results.summary.skipped++;
              continue;
            }

            // Prepare product data
            const productData = {
              name: row.name.trim(),
              sku: row.sku.toUpperCase().trim(),
              barcode: row.barcode?.trim() || undefined,
              description: row.description?.trim() || '',
              category: categoryId,
              brand: brandId,
              unit: unitId,
              supplier: supplierId,
              pricing: {
                costPrice: parseFloat(row.costPrice) || 0,
                sellingPrice: parseFloat(row.sellingPrice) || 0,
                mrp: parseFloat(row.mrp) || parseFloat(row.sellingPrice) || 0
              },
              taxSettings: {
                gstRate: parseFloat(row.gstRate) || 18,
                taxCategory: 'standard'
              },
              isActive: row.isActive !== 'false',
              createdBy: req.user.userId
            };

            // Handle branch stock
            const branchStock = {
              branch: targetBranch._id,
              quantity: parseFloat(row.quantity) || 0,
              reorderLevel: parseFloat(row.reorderLevel) || 10,
              maxStockLevel: parseFloat(row.maxStockLevel) || 1000,
              location: row.location?.trim() || ''
            };

            if (existingProduct && updateExisting) {
              // Update existing product
              const updateData = { ...productData, updatedBy: req.user.userId };
              
              // Update branch stock if exists, otherwise add
              const stockIndex = existingProduct.branchStocks.findIndex(
                stock => stock.branch.toString() === targetBranch._id.toString()
              );

              if (stockIndex >= 0) {
                updateData[`branchStocks.${stockIndex}`] = branchStock;
              } else {
                updateData.$push = { branchStocks: branchStock };
              }

              await Product.findByIdAndUpdate(existingProduct._id, updateData);

              results.success.push({
                row: rowNum,
                action: 'updated',
                sku: row.sku,
                name: row.name
              });
              results.summary.updated++;

            } else {
              // Create new product
              productData.branchStocks = [branchStock];
              const product = new Product(productData);
              await product.save();

              results.success.push({
                row: rowNum,
                action: 'created',
                sku: row.sku,
                name: row.name,
                id: product._id
              });
              results.summary.created++;
            }

          } catch (error) {
            results.errors.push({
              row: rowNum,
              error: error.message,
              data: row
            });
            results.summary.errors++;
          }
        }

        // Clean up uploaded file
        fs.unlink(csvFilePath, () => {});

        // Create audit log
        await AuditLog.create({
          action: 'IMPORT_PRODUCTS',
          resource: 'Product',
          details: {
            filename: req.file.originalname,
            summary: results.summary,
            branch: targetBranch._id
          },
          userId: req.user.userId,
          userEmail: req.user.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json(
          ResponseUtils.success('CSV import completed', results)
        );

      } catch (error) {
        console.error('Import products error:', error);
        
        // Clean up uploaded file
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }

        res.status(500).json(
          ResponseUtils.error('Failed to import products', 500)
        );
      }
    })
  ];

  // Additional methods as per API documentation
  static searchProduct = asyncHandler(async (req, res) => {
    const { query } = req.params;
    const { limit = 20, category, brand, branch } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json(
        ResponseUtils.error('Search query must be at least 2 characters', 400)
      );
    }

    const filter = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // Additional filters
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (branch) filter['branchStocks.branch'] = branch;

    // Branch access filter for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      filter['branchStocks.branch'] = req.user.branch;
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('branchStocks.branch', 'name code')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json(
      ResponseUtils.success('Product search completed', {
        products,
        query,
        count: products.length
      })
    );
  });

  static getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    ResponseUtils.success(res, categories, 'Categories retrieved successfully');
  });

  static getSubcategories = asyncHandler(async (req, res) => {
    const { category } = req.params;

    const subcategories = await Category.find({ 
      parentCategory: category,
      isActive: true 
    }).sort({ name: 1 });

    res.json(
      ResponseUtils.success('Subcategories retrieved successfully', subcategories)
    );
  });

  static getLowStockProducts = asyncHandler(async (req, res) => {
    const { branch, limit = 50 } = req.query;

    const filter = { isActive: true };

    // Branch filter
    if (branch) {
      filter['branchStocks.branch'] = branch;
    } else if (req.user.role !== 'admin' && req.user.branch) {
      filter['branchStocks.branch'] = req.user.branch;
    }

    // Find products where any branch stock is at or below reorder level
    const lowStockProducts = await Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          lowStockBranches: {
            $filter: {
              input: '$branchStocks',
              cond: { $lte: ['$$this.quantity', '$$this.reorderLevel'] }
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
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'lowStockBranches.branch',
          foreignField: '_id',
          as: 'branchDetails'
        }
      },
      { $limit: parseInt(limit) },
      { $sort: { name: 1 } }
    ]);

    res.json(
      ResponseUtils.success('Low stock products retrieved successfully', {
        products: lowStockProducts,
        count: lowStockProducts.length
      })
    );
  });

  static updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { branchId, quantity, operation = 'set' } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid product ID', 400)
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json(
        ResponseUtils.error('Product not found', 404)
      );
    }

    // Validate branch
    const targetBranchId = branchId || req.user.branch;
    const branch = await Branch.findById(targetBranchId);
    if (!branch) {
      return res.status(400).json(
        ResponseUtils.error('Invalid branch', 400)
      );
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (req.user.branch.toString() !== targetBranchId.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Can only update stock for your assigned branch', 403)
        );
      }
    }

    // Find or create branch stock
    const branchStockIndex = product.branchStocks.findIndex(
      stock => stock.branch.toString() === targetBranchId.toString()
    );

    let newQuantity;
    const currentQuantity = branchStockIndex >= 0 ? product.branchStocks[branchStockIndex].quantity : 0;

    switch (operation) {
      case 'add':
        newQuantity = currentQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, currentQuantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json(
          ResponseUtils.error('Invalid operation. Use: add, subtract, or set', 400)
        );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (branchStockIndex >= 0) {
        // Update existing branch stock
        await Product.updateOne(
          { _id: id, 'branchStocks.branch': targetBranchId },
          { $set: { 'branchStocks.$.quantity': newQuantity } },
          { session }
        );
      } else {
        // Add new branch stock
        await Product.updateOne(
          { _id: id },
          { 
            $push: { 
              branchStocks: {
                branch: targetBranchId,
                quantity: newQuantity,
                reorderLevel: 10,
                maxStockLevel: 1000
              }
            }
          },
          { session }
        );
      }

      // Create audit log
      await AuditLog.create([{
        action: 'UPDATE_STOCK',
        resource: 'Product',
        resourceId: product._id,
        details: {
          productName: product.name,
          sku: product.sku,
          branch: targetBranchId,
          operation,
          previousQuantity: currentQuantity,
          newQuantity,
          quantityChange: quantity
        },
        userId: req.user.userId,
        userEmail: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      await session.commitTransaction();

      // Get updated product
      const updatedProduct = await Product.findById(id)
        .populate('branchStocks.branch', 'name code');

      res.json(
        ResponseUtils.success('Stock updated successfully', {
          product: updatedProduct,
          stockUpdate: {
            branch: targetBranchId,
            operation,
            previousQuantity: currentQuantity,
            newQuantity,
            quantityChange: quantity
          }
        })
      );

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });
}

module.exports = ProductController;
