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
      return ResponseUtils.error(res, 'Product with this SKU already exists', 409);
    }

    // Validate required references
    const [category, unit] = await Promise.all([
      Category.findById(categoryId),
      Unit.findById(unitId)
    ]);

    if (!category) {
      return ResponseUtils.error(res, 'Invalid category', 400);
    }

    if (!unit) {
      return ResponseUtils.error(res, 'Invalid unit', 400);
    }

    // Validate optional references
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return ResponseUtils.error(res, 'Invalid brand', 400);
      }
    }

    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return ResponseUtils.error(res, 'Invalid supplier', 400);
      }
    }

    const product = new Product({
      name,
      sku: sku.toUpperCase(),
      description,
      category: categoryId,
      brand: brandId,
      unit: unitId,
      supplier: supplierId,
      pricing: {
        costPrice: pricing?.costPrice || 0,
        sellingPrice: pricing?.sellingPrice || 0,
        mrp: pricing?.mrp || pricing?.sellingPrice || 0,
        taxRate: pricing?.taxRate || 18
      },
      stockByBranch: branchStocks.map(stock => ({
        branch: stock.branchId,
        quantity: stock.quantity || 0,
        reorderLevel: stock.reorderLevel || 10,
        maxStockLevel: stock.maxStockLevel || 1000,
        location: stock.location
      })),
      isActive,
      createdBy: req.user.id
    });

    await product.save();

    // Create audit log
    await AuditLog.create({
      action: 'product_create',
      resourceType: 'product',
      resourceId: product._id.toString(),
      resourceName: product.name,
      description: `Created product: ${product.name} (SKU: ${product.sku})`,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      status: 'success',
      newValues: {
        name: product.name,
        sku: product.sku,
        category: categoryId
      }
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name code')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('supplier', 'name')
      .populate('stockByBranch.branch', 'name code');

    ResponseUtils.success(res, populatedProduct, 'Product created successfully', 201);
  });

  static createProductsBulk = asyncHandler(async (req, res) => {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return ResponseUtils.error(res, 'Products array is required', 400);
    }

    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    // Only use transactions in non-test environments
    const session = process.env.NODE_ENV !== 'test' ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        
        try {
          // Check if SKU already exists
          const existingProduct = session 
            ? await Product.findOne({ sku: productData.sku }).session(session)
            : await Product.findOne({ sku: productData.sku });
          if (existingProduct) {
            results.failed++;
            results.errors.push(`Product ${i + 1}: SKU '${productData.sku}' already exists`);
            continue;
          }

          // Validate required references
          const [category, unit] = await Promise.all([
            session 
              ? Category.findById(productData.category).session(session)
              : Category.findById(productData.category),
            session 
              ? Unit.findById(productData.unit).session(session)
              : Unit.findById(productData.unit)
          ]);

          if (!category) {
            results.failed++;
            results.errors.push(`Product ${i + 1}: Invalid category`);
            continue;
          }

          if (!unit) {
            results.failed++;
            results.errors.push(`Product ${i + 1}: Invalid unit`);
            continue;
          }

          const product = new Product({
            name: productData.name,
            sku: productData.sku.toUpperCase(),
            barcode: productData.barcode,
            description: productData.description,
            category: productData.category,
            brand: productData.brand,
            unit: productData.unit,
            supplier: productData.supplier,
            pricing: {
              costPrice: productData.pricing?.costPrice || 0,
              sellingPrice: productData.pricing?.sellingPrice || 0,
              mrp: productData.pricing?.mrp || productData.pricing?.sellingPrice || 0,
              taxRate: productData.pricing?.taxRate || 18
            },
            stockByBranch: productData.branchStocks?.map(stock => ({
              branch: stock.branchId,
              quantity: stock.quantity || 0,
              reorderLevel: stock.reorderLevel || 10,
              maxStockLevel: stock.maxStockLevel || 1000,
              location: stock.location
            })) || [],
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            createdBy: req.user.id
          });

          if (session) {
            await product.save({ session });
          } else {
            await product.save();
          }

          // Create audit log
          const auditData = {
            action: 'product_create',
            resourceType: 'product',
            resourceId: product._id.toString(),
            resourceName: product.name,
            description: `Bulk created product: ${product.name} (SKU: ${product.sku})`,
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent'),
            status: 'success',
            newValues: {
              name: product.name,
              sku: product.sku,
              category: productData.category
            }
          };

          if (session) {
            await AuditLog.create([auditData], { session });
          } else {
            await AuditLog.create(auditData);
          }

          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Product ${i + 1}: ${error.message}`);
        }
      }

      if (session) {
        await session.commitTransaction();
      }

      const statusCode = results.created > 0 ? (results.failed > 0 ? 200 : 201) : 400;
      
      return ResponseUtils.success(res, results, 'Bulk product creation completed', statusCode);

    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      return ResponseUtils.error(res, 'Bulk product creation failed', 500);
    } finally {
      if (session) {
        session.endSession();
      }
    }
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
      stock, // Add stock filter parameter
      minPrice,
      maxPrice,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Default filter to exclude soft-deleted products
    const filter = { 
      isActive: isActive !== undefined ? (isActive === 'true') : true,
      deletedAt: { $exists: false }
    };

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      try {
        filter.category = new mongoose.Types.ObjectId(category);
      } catch (e) {
        // Invalid ObjectId, skip filter
        console.warn('Invalid category ObjectId:', category);
      }
    }

    // Brand filter
    if (brand) {
      try {
        filter.brand = new mongoose.Types.ObjectId(brand);
      } catch (e) {
        // Invalid ObjectId, skip filter
        console.warn('Invalid brand ObjectId:', brand);
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter['pricing.sellingPrice'] = {};
      if (minPrice) filter['pricing.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
    }

    // Branch access filter for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      filter['stockByBranch.branch'] = req.user.branch;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Product Filter:', JSON.stringify(filter, null, 2));
      console.log('Query params:', { page, limit, search, category, brand, stock, minPrice, maxPrice });
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter }
    ];

    // Stock filter - handle multiple stock states
    if (stock || lowStock === 'true') {
      if (stock === 'low-stock' || lowStock === 'true') {
        // Low stock: total quantity across all branches <= total reorder level
        // This ensures only products that are genuinely low in stock appear
        pipeline.push({
          $match: {
            $expr: {
              $let: {
                vars: {
                  totalStock: { $sum: "$stockByBranch.quantity" },
                  totalReorderLevel: { $sum: "$stockByBranch.reorderLevel" }
                },
                in: {
                  $and: [
                    { $gt: ["$$totalStock", 0] }, // Has some stock (not out of stock)
                    { $lte: ["$$totalStock", "$$totalReorderLevel"] } // Total stock <= total reorder level
                  ]
                }
              }
            }
          }
        });
      } else if (stock === 'out-of-stock') {
        // Out of stock: total quantity = 0
        pipeline.push({
          $match: {
            $expr: {
              $eq: [
                { $sum: "$stockByBranch.quantity" },
                0
              ]
            }
          }
        });
      } else if (stock === 'in-stock') {
        // In stock: total quantity > 0
        pipeline.push({
          $match: {
            $expr: {
              $gt: [
                { $sum: "$stockByBranch.quantity" },
                0
              ]
            }
          }
        });
      }
    }

    // Branch-specific stock filter
    if (branch) {
      pipeline.push({
        $match: {
          'stockByBranch.branch': new mongoose.Types.ObjectId(branch)
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
          localField: 'stockByBranch.branch',
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

    // Add computed fields for frontend compatibility
    pipeline.push({
      $addFields: {
        // Flatten pricing
        price: '$pricing.sellingPrice',
        costPrice: '$pricing.costPrice',
        mrp: '$pricing.mrp',
        
        // Calculate total stock across branches
        stock: {
          $sum: {
            $map: {
              input: '$stockByBranch',
              as: 'branchStock',
              in: '$$branchStock.quantity'
            }
          }
        },
        
        // Calculate minimum stock level
        minStockLevel: {
          $sum: {
            $map: {
              input: '$stockByBranch',
              as: 'branchStock', 
              in: '$$branchStock.reorderLevel'
            }
          }
        },
        
        // Get primary image
        image: {
          $let: {
            vars: {
              primaryImage: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$images',
                      as: 'img',
                      cond: { $eq: ['$$img.isPrimary', true] }
                    }
                  },
                  0
                ]
              }
            },
            in: {
              $cond: {
                if: { $ne: ['$$primaryImage', null] },
                then: '$$primaryImage.url',
                else: {
                  $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] },
                    then: { $arrayElemAt: ['$images.url', 0] },
                    else: null
                  }
                }
              }
            }
          }
        }
      }
    });

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
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id)
      .populate('category', 'name code')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('supplier', 'name contact')
      .populate('stockByBranch.branch', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!product) {
      return ResponseUtils.error(res, 'Product not found', 404);
    }

    // Add computed fields for frontend compatibility
    const productWithComputedFields = {
      ...product.toObject(),
      price: product.pricing?.sellingPrice || 0,
      costPrice: product.pricing?.costPrice || 0,
      mrp: product.pricing?.mrp || 0,
      stock: product.stockByBranch?.reduce((total, stock) => total + stock.quantity, 0) || 0,
      minStockLevel: product.stockByBranch?.reduce((total, stock) => total + stock.reorderLevel, 0) || 0,
      image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || null
    };

    return ResponseUtils.success(res, productWithComputedFields, 'Product retrieved successfully');
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return ResponseUtils.error(res, 'Product not found', 404);
    }

    // Check if SKU is being changed and if it already exists
    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const skuExists = await Product.findOne({ sku: req.body.sku, _id: { $ne: id } });
      if (skuExists) {
        return ResponseUtils.error(res, 'Product with this SKU already exists', 409);
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
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
     .populate('stockByBranch.branch', 'name code');

    // Create audit log
    await AuditLog.create({
      action: 'product_update',
      resourceType: 'product',
      resourceId: product._id.toString(),
      resourceName: product.name,
      description: `Updated product: ${product.name} (SKU: ${product.sku})`,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      status: 'success',
      newValues: {
        name: product.name,
        sku: product.sku,
        changes: Object.keys(req.body)
      }
    });

    return ResponseUtils.success(res, product, 'Product updated successfully');
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseUtils.error(res, 'Product not found', 404);
    }

    // Soft delete instead of hard delete
    await Product.findByIdAndUpdate(id, { 
      isActive: false,
      deletedAt: new Date(),
      deletedBy: req.user.userId
    });

    // Create audit log
    await AuditLog.create({
      action: 'product_delete',
      resourceType: 'product',
      resourceId: product._id.toString(),
      resourceName: product.name,
      description: `Deleted product: ${product.name} (SKU: ${product.sku})`,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      status: 'success',
      oldValues: {
        name: product.name,
        sku: product.sku
      }
    });

    ResponseUtils.success(res, null, 'Product deleted successfully');
  });

  // CSV Export functionality
  static exportProducts = asyncHandler(async (req, res) => {
    try {
      const { branch, category, format = 'csv', search, stock, minPrice, maxPrice } = req.query;
      const filter = { isActive: true };

      // Apply filters
      if (branch) {
        filter['stockByBranch.branch'] = branch;
      }
      if (category) {
        filter.category = category;
      }

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ];
      }

      // Price range filter
      if (minPrice || maxPrice) {
        filter['pricing.sellingPrice'] = {};
        if (minPrice) filter['pricing.sellingPrice'].$gte = parseFloat(minPrice);
        if (maxPrice) filter['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
      }

      // Branch access filter for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        filter['stockByBranch.branch'] = req.user.branch;
      }

      let products = await Product.find(filter)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('unit', 'name symbol')
        .populate('supplier', 'name')
        .populate('stockByBranch.branch', 'name code')
        .lean();

      // Apply stock filter after fetching (since stockByBranch is an array)
      if (stock && stock !== 'all') {
        products = products.filter(product => {
          if (!product.stockByBranch || product.stockByBranch.length === 0) {
            return stock === 'out-of-stock';
          }
          
          const totalStock = product.stockByBranch.reduce((sum, s) => sum + (s.quantity || 0), 0);
          const minReorderLevel = Math.min(...product.stockByBranch.map(s => s.reorderLevel || 10));
          
          if (stock === 'in-stock') {
            return totalStock > 0;
          } else if (stock === 'low-stock') {
            return totalStock > 0 && totalStock <= minReorderLevel;
          } else if (stock === 'out-of-stock') {
            return totalStock <= 0;
          }
          return true;
        });
      }

      if (format === 'csv') {
        // Generate CSV
        const csvData = products.map(product => {
          // Handle products with or without branch stock
          let branchStock = null;
          if (product.stockByBranch && Array.isArray(product.stockByBranch) && product.stockByBranch.length > 0) {
            branchStock = product.stockByBranch.find(
              stock => !branch || (stock.branch && stock.branch._id && stock.branch._id.toString() === branch)
            );
            // If no specific branch found, use the first one
            if (!branchStock) {
              branchStock = product.stockByBranch[0];
            }
          }

          return {
            name: product.name || '',
            sku: product.sku || '',
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
            gstRate: product.taxSettings?.gstRate || product.pricing?.taxRate || 0,
            isActive: product.isActive ? 'Yes' : 'No'
          };
        });

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const csvFilePath = path.join(uploadsDir, `products_export_${Date.now()}.csv`);
        
        try {
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
        } catch (csvError) {
          console.error('CSV Writer Error:', csvError);
          throw new Error(`CSV generation failed: ${csvError.message}`);
        }

        // Create audit log
        await AuditLog.create({
          action: 'data_export',
          resourceType: 'product',
          resourceId: 'bulk',
          resourceName: 'Product Export',
          description: `Exported ${products.length} products to CSV`,
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent'),
          status: 'success',
          newValues: {
            format: 'csv',
            count: products.length,
            filters: { branch, category, search, stock, minPrice, maxPrice }
          }
        });

        res.download(csvFilePath, `products_${new Date().toISOString().split('T')[0]}.csv`, (err) => {
          if (!err) {
            // Clean up file after download
            fs.unlink(csvFilePath, () => {});
          }
        });
      } else {
        // Return JSON for other formats
        ResponseUtils.success(res, {
          products: products,
          count: products.length,
          exportedAt: new Date().toISOString()
        }, 'Products exported successfully');
      }

    } catch (error) {
      console.error('Export products error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      ResponseUtils.error(res, error.message || 'Failed to export products', 500);
    }
  });

  // CSV Import functionality
  static importProducts = [
    upload.single('csvFile'),
    asyncHandler(async (req, res) => {
      try {
        if (!req.file) {
          return ResponseUtils.error(res, 'CSV file is required', 400);
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
            return ResponseUtils.error(res, 'Invalid branch ID', 400);
          }
        } else if (req.user.branch) {
          targetBranch = await Branch.findById(req.user.branch);
        } else {
          // For admin users without a branch, use the first available branch or create a default one
          targetBranch = await Branch.findOne({ isActive: true });
          
          if (!targetBranch) {
            // Create a default branch if none exists
            targetBranch = await Branch.create({
              name: 'Main Branch',
              code: 'MAIN',
              address: {
                street: 'Main Street',
                city: 'City',
                state: 'State',
                country: 'India',
                postalCode: '000000'
              },
              isActive: true
            });
          }
        }

        if (!targetBranch) {
          return ResponseUtils.error(res, 'Branch is required', 400);
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
            .on('data', (data) => {
              // Normalize column names (handle both formats)
              const normalizedData = {
                name: data['Product Name'] || data['name'] || data['Name'],
                sku: data['SKU'] || data['sku'],
                barcode: data['Barcode'] || data['barcode'],
                category: data['Category'] || data['category'],
                brand: data['Brand'] || data['brand'],
                unit: data['Unit'] || data['unit'],
                supplier: data['Supplier'] || data['supplier'],
                costPrice: data['Cost Price'] || data['costPrice'],
                sellingPrice: data['Selling Price'] || data['sellingPrice'],
                mrp: data['MRP'] || data['mrp'],
                quantity: data['Stock Quantity'] || data['quantity'] || data['Quantity'],
                reorderLevel: data['Reorder Level'] || data['reorderLevel'],
                maxStockLevel: data['Max Stock Level'] || data['maxStockLevel'],
                gstRate: (data['GST Rate'] || data['gstRate'] || '18').toString().replace('%', ''),
                location: data['Location'] || data['location'],
                description: data['Description'] || data['description'],
                isActive: (data['Status'] || data['isActive'] || 'Active').toLowerCase() === 'active'
              };
              csvData.push(normalizedData);
            })
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
              const stockIndex = existingProduct.stockByBranch.findIndex(
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
              productData.stockByBranch = [branchStock];
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
          action: 'product_import',
          resourceType: 'product',
          resourceId: 'bulk',
          resourceName: 'Product Import',
          description: `Imported products from CSV: ${req.file.originalname} (${results.summary.created} created, ${results.summary.updated} updated, ${results.summary.errors} errors)`,
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent'),
          status: 'success',
          newValues: {
            filename: req.file.originalname,
            summary: results.summary,
            branch: targetBranch._id
          }
        });

        ResponseUtils.success(res, results, 'CSV import completed');

      } catch (error) {
        console.error('Import products error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        
        // Clean up uploaded file
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }

        ResponseUtils.error(res, error.message || 'Failed to import products', 500);
      }
    })
  ];

  // Additional methods as per API documentation
  static searchProduct = asyncHandler(async (req, res) => {
    const { query } = req.params;
    const { limit = 20, category, brand, branch } = req.query;

    if (!query || query.length < 2) {
      return ResponseUtils.error(res, 'Search query must be at least 2 characters', 400);
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
    if (branch) filter['stockByBranch.branch'] = branch;

    // Branch access filter for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      filter['stockByBranch.branch'] = req.user.branch;
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('stockByBranch.branch', 'name code')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    ResponseUtils.success(res, {
      products,
      query,
      count: products.length
    }, 'Product search completed');
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
      filter['stockByBranch.branch'] = branch;
    } else if (req.user.role !== 'admin' && req.user.branch) {
      filter['stockByBranch.branch'] = req.user.branch;
    }

    // Find products where any branch stock is at or below reorder level
    const lowStockProducts = await Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          lowStockBranches: {
            $filter: {
              input: '$stockByBranch',
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

    ResponseUtils.success(res, {
      products: lowStockProducts,
      count: lowStockProducts.length
    }, 'Low stock products retrieved successfully');
  });

  static updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { branchId, quantity, operation = 'set' } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseUtils.error(res, 'Product not found', 404);
    }

    // Validate branch
    const targetBranchId = branchId || req.user.branch;
    const branch = await Branch.findById(targetBranchId);
    if (!branch) {
      return ResponseUtils.error(res, 'Invalid branch', 400);
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (req.user.branch.toString() !== targetBranchId.toString()) {
        return ResponseUtils.error(res, 'Access denied - Can only update stock for your assigned branch', 403);
      }
    }

    // Find or create branch stock
    const branchStockIndex = product.stockByBranch.findIndex(
      stock => stock.branch.toString() === targetBranchId.toString()
    );

    let newQuantity;
    const currentQuantity = branchStockIndex >= 0 ? product.stockByBranch[branchStockIndex].quantity : 0;

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
          { _id: id, 'stockByBranch.branch': targetBranchId },
          { $set: { 'stockByBranch.$.quantity': newQuantity } },
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
        action: 'product_stock_update',
        resourceType: 'product',
        resourceId: product._id.toString(),
        resourceName: product.name,
        description: `Updated stock for ${product.name}: ${operation} ${quantity} (${currentQuantity} → ${newQuantity})`,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        status: 'success',
        oldValues: {
          quantity: currentQuantity
        },
        newValues: {
          productName: product.name,
          sku: product.sku,
          branch: targetBranchId,
          operation,
          newQuantity,
          quantityChange: quantity
        }
      }], { session });

      await session.commitTransaction();

      // Get updated product
      const updatedProduct = await Product.findById(id)
        .populate('stockByBranch.branch', 'name code');

      ResponseUtils.success(res, {
        product: updatedProduct,
        stockUpdate: {
          branch: targetBranchId,
          operation,
          previousQuantity: currentQuantity,
          newQuantity,
          quantityChange: quantity
        }
      }, 'Stock updated successfully');

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });
}

module.exports = ProductController;
