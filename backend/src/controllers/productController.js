/**
 * Product Controller
 * Handles product inventory management operations
 */
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class ProductController {
  /**
   * Create new product
   */
  static createProduct = asyncHandler(async (req, res) => {
    const {
      name,
      description,
      category,
      subcategory,
      brand,
      sku,
      barcode,
      price,
      costPrice,
      quantity,
      unit,
      minStockLevel,
      maxStockLevel,
      supplier,
      expiryDate,
      gstRate
    } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, [
      'name', 'category', 'price', 'quantity', 'unit'
    ]);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Validate price
    const priceValidation = ValidationUtils.validatePrice(price);
    if (!priceValidation.isValid) {
      return ResponseUtils.validationError(res, priceValidation.errors.map(err => ({ message: err })));
    }

    // Validate quantity
    const quantityValidation = ValidationUtils.validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      return ResponseUtils.validationError(res, quantityValidation.errors.map(err => ({ message: err })));
    }

    // Validate cost price if provided
    if (costPrice !== undefined) {
      const costValidation = ValidationUtils.validatePrice(costPrice);
      if (!costValidation.isValid) {
        return ResponseUtils.validationError(res, costValidation.errors.map(err => ({ message: err })));
      }
    }

    // Check if SKU already exists
    if (sku) {
      const existingSKU = await Product.findOne({ sku });
      if (existingSKU) {
        return ResponseUtils.conflict(res, 'Product with this SKU already exists');
      }
    }

    // Check if barcode already exists
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return ResponseUtils.conflict(res, 'Product with this barcode already exists');
      }
    }

    // Validate expiry date if provided
    if (expiryDate) {
      const dateValidation = ValidationUtils.validateDate(expiryDate);
      if (!dateValidation.isValid) {
        return ResponseUtils.validationError(res, dateValidation.errors.map(err => ({ message: err })));
      }
      
      // Check if expiry date is in the future
      if (dateValidation.date <= new Date()) {
        return ResponseUtils.error(res, 'Expiry date must be in the future', 400);
      }
    }

    // Create product
    const product = new Product({
      name: ValidationUtils.sanitizeString(name),
      description: description ? ValidationUtils.sanitizeString(description) : undefined,
      category,
      subcategory,
      brand: brand ? ValidationUtils.sanitizeString(brand) : undefined,
      sku,
      barcode,
      price,
      costPrice,
      quantity,
      unit,
      minStockLevel: minStockLevel || 10,
      maxStockLevel,
      supplier: supplier ? ValidationUtils.sanitizeString(supplier) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      gstRate: gstRate || 18,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await product.save();

    ResponseUtils.success(res, product, 'Product created successfully', 201);
  });

  /**
   * Get all products with filtering and pagination
   */
  static getAllProducts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      subcategory,
      brand,
      lowStock,
      outOfStock,
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice,
      maxPrice
    } = req.query;

    // Validate pagination
    const pagination = ValidationUtils.validatePagination({ page, limit });

    // Validate sorting
    const allowedSortFields = ['name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'];
    const sort = ValidationUtils.validateSort(sortBy, sortOrder, allowedSortFields);

    // Build filter
    const filter = {};

    if (search) {
      const searchQuery = ValidationUtils.cleanSearchQuery(search);
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { brand: { $regex: searchQuery, $options: 'i' } },
        { sku: { $regex: searchQuery, $options: 'i' } },
        { barcode: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (brand) {
      filter.brand = { $regex: ValidationUtils.cleanSearchQuery(brand), $options: 'i' };
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minStockLevel'] };
    }

    if (outOfStock === 'true') {
      filter.quantity = 0;
    }

    if (minPrice !== undefined) {
      filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    }

    if (maxPrice !== undefined) {
      filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    }

    // Get products with pagination
    const skip = (pagination.page - 1) * pagination.limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort.sortObj)
        .skip(skip)
        .limit(pagination.limit)
        .populate('createdBy', 'fullName')
        .populate('updatedBy', 'fullName'),
      Product.countDocuments(filter)
    ]);

    ResponseUtils.paginated(res, products, { ...pagination, total }, 'Products retrieved successfully');
  });

  /**
   * Get product by ID
   */
  static getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!product) {
      return ResponseUtils.notFound(res, 'Product not found');
    }

    ResponseUtils.success(res, product, 'Product retrieved successfully');
  });

  /**
   * Update product
   */
  static updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseUtils.notFound(res, 'Product not found');
    }

    // Validate price if provided
    if (updates.price !== undefined) {
      const priceValidation = ValidationUtils.validatePrice(updates.price);
      if (!priceValidation.isValid) {
        return ResponseUtils.validationError(res, priceValidation.errors.map(err => ({ message: err })));
      }
    }

    // Validate cost price if provided
    if (updates.costPrice !== undefined) {
      const costValidation = ValidationUtils.validatePrice(updates.costPrice);
      if (!costValidation.isValid) {
        return ResponseUtils.validationError(res, costValidation.errors.map(err => ({ message: err })));
      }
    }

    // Validate quantity if provided
    if (updates.quantity !== undefined) {
      const quantityValidation = ValidationUtils.validateQuantity(updates.quantity);
      if (!quantityValidation.isValid) {
        return ResponseUtils.validationError(res, quantityValidation.errors.map(err => ({ message: err })));
      }
    }

    // Check SKU uniqueness if updating
    if (updates.sku && updates.sku !== product.sku) {
      const existingSKU = await Product.findOne({ sku: updates.sku, _id: { $ne: id } });
      if (existingSKU) {
        return ResponseUtils.conflict(res, 'Product with this SKU already exists');
      }
    }

    // Check barcode uniqueness if updating
    if (updates.barcode && updates.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode: updates.barcode, _id: { $ne: id } });
      if (existingBarcode) {
        return ResponseUtils.conflict(res, 'Product with this barcode already exists');
      }
    }

    // Validate expiry date if provided
    if (updates.expiryDate) {
      const dateValidation = ValidationUtils.validateDate(updates.expiryDate);
      if (!dateValidation.isValid) {
        return ResponseUtils.validationError(res, dateValidation.errors.map(err => ({ message: err })));
      }
      updates.expiryDate = dateValidation.date;
    }

    // Sanitize string fields
    if (updates.name) updates.name = ValidationUtils.sanitizeString(updates.name);
    if (updates.description) updates.description = ValidationUtils.sanitizeString(updates.description);
    if (updates.brand) updates.brand = ValidationUtils.sanitizeString(updates.brand);
    if (updates.supplier) updates.supplier = ValidationUtils.sanitizeString(updates.supplier);

    // Add updatedBy field
    updates.updatedBy = req.user.id;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('updatedBy', 'fullName');

    ResponseUtils.success(res, updatedProduct, 'Product updated successfully');
  });

  /**
   * Delete product
   */
  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseUtils.notFound(res, 'Product not found');
    }

    await Product.findByIdAndDelete(id);

    ResponseUtils.success(res, { id }, 'Product deleted successfully');
  });

  /**
   * Get low stock products
   */
  static getLowStockProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    
    const pagination = ValidationUtils.validatePagination({ page, limit });
    const skip = (pagination.page - 1) * pagination.limit;

    const [products, total] = await Promise.all([
      Product.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] } })
        .sort({ quantity: 1 })
        .skip(skip)
        .limit(pagination.limit),
      Product.countDocuments({ $expr: { $lte: ['$quantity', '$minStockLevel'] } })
    ]);

    ResponseUtils.paginated(res, products, { ...pagination, total }, 'Low stock products retrieved successfully');
  });

  /**
   * Get product categories
   */
  static getCategories = asyncHandler(async (req, res) => {
    const categories = await Product.distinct('category');
    ResponseUtils.success(res, categories, 'Categories retrieved successfully');
  });

  /**
   * Get subcategories by category
   */
  static getSubcategories = asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    const subcategories = await Product.distinct('subcategory', { category });
    ResponseUtils.success(res, subcategories, 'Subcategories retrieved successfully');
  });

  /**
   * Update product stock
   */
  static updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid product ID', 400);
    }

    const quantityValidation = ValidationUtils.validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      return ResponseUtils.validationError(res, quantityValidation.errors.map(err => ({ message: err })));
    }

    const product = await Product.findById(id);
    if (!product) {
      return ResponseUtils.notFound(res, 'Product not found');
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.quantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        $set: { 
          quantity: newQuantity,
          updatedBy: req.user.id
        }
      },
      { new: true, runValidators: true }
    );

    ResponseUtils.success(res, updatedProduct, 'Stock updated successfully');
  });

  /**
   * Search products by barcode or SKU
   */
  static searchProduct = asyncHandler(async (req, res) => {
    const { query } = req.params;

    if (!query) {
      return ResponseUtils.error(res, 'Search query is required', 400);
    }

    const cleanQuery = ValidationUtils.sanitizeString(query);

    const product = await Product.findOne({
      $or: [
        { barcode: cleanQuery },
        { sku: cleanQuery }
      ]
    });

    if (!product) {
      return ResponseUtils.notFound(res, 'Product not found');
    }

    ResponseUtils.success(res, product, 'Product found successfully');
  });
}

module.exports = ProductController;
