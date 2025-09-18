/**
 * Shared validation schemas using Joi
 * Used for both frontend and backend validation
 */

const Joi = require('joi');

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
const skuPattern = /^[A-Z0-9]{3,20}$/;

// Base schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().max(50),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().max(100).allow('')
});

// User validation schemas
const userRoles = ['admin', 'manager', 'cashier'];

const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().pattern(emailPattern).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(...userRoles).required()
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  email: Joi.string().pattern(emailPattern),
  role: Joi.string().valid(...userRoles),
  isActive: Joi.boolean()
}).min(1);

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailPattern).required(),
  password: Joi.string().min(8).max(128).required()
});

// Product validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow(''),
  sku: Joi.string().pattern(skuPattern).required(),
  barcode: Joi.string().max(50).allow(''),
  categoryId: Joi.string().pattern(objectIdPattern).required(),
  price: Joi.number().min(0).max(999999.99).precision(2).required(),
  costPrice: Joi.number().min(0).max(999999.99).precision(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  reorderLevel: Joi.number().integer().min(0).required(),
  maxStockLevel: Joi.number().integer().min(0).required(),
  supplier: Joi.string().min(2).max(100).required(),
  expiryDate: Joi.date().iso().allow(null),
  gstRate: Joi.number().min(0).max(100).precision(2).default(18)
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow(''),
  sku: Joi.string().pattern(skuPattern),
  barcode: Joi.string().max(50).allow(''),
  categoryId: Joi.string().pattern(objectIdPattern),
  price: Joi.number().min(0).max(999999.99).precision(2),
  costPrice: Joi.number().min(0).max(999999.99).precision(2),
  quantity: Joi.number().integer().min(0),
  reorderLevel: Joi.number().integer().min(0),
  maxStockLevel: Joi.number().integer().min(0),
  supplier: Joi.string().min(2).max(100),
  expiryDate: Joi.date().iso().allow(null),
  gstRate: Joi.number().min(0).max(100).precision(2),
  isActive: Joi.boolean()
}).min(1);

const productFiltersSchema = paginationSchema.keys({
  categoryId: Joi.string().pattern(objectIdPattern),
  supplier: Joi.string().max(100),
  lowStock: Joi.boolean(),
  outOfStock: Joi.boolean(),
  nearExpiry: Joi.boolean(),
  priceMin: Joi.number().min(0).max(999999.99),
  priceMax: Joi.number().min(0).max(999999.99)
});

// Category validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).allow(''),
  parentId: Joi.string().pattern(objectIdPattern).allow(null),
  image: Joi.string().uri().allow('')
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().max(200).allow(''),
  parentId: Joi.string().pattern(objectIdPattern).allow(null),
  image: Joi.string().uri().allow(''),
  isActive: Joi.boolean()
}).min(1);

// Sale validation schemas
const paymentMethods = ['cash', 'card', 'upi', 'netbanking', 'wallet'];
const saleStatuses = ['completed', 'cancelled', 'refunded', 'partial_refund'];

const saleItemSchema = Joi.object({
  productId: Joi.string().pattern(objectIdPattern).required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
  price: Joi.number().min(0).max(999999.99).precision(2).required(),
  discountAmount: Joi.number().min(0).max(999999.99).precision(2).default(0)
});

const customerSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().pattern(emailPattern).allow(''),
  phone: Joi.string().pattern(phonePattern).allow(''),
  address: Joi.string().max(200).allow('')
});

const paymentInfoSchema = Joi.object({
  method: Joi.string().valid(...paymentMethods).required(),
  amount: Joi.number().min(0).max(999999.99).precision(2).required(),
  reference: Joi.string().max(100).allow(''),
  cardLast4: Joi.string().length(4).pattern(/^\d{4}$/).when('method', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  changeGiven: Joi.number().min(0).max(999999.99).precision(2).when('method', {
    is: 'cash',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});

const createSaleSchema = Joi.object({
  items: Joi.array().items(saleItemSchema).min(1).max(50).required(),
  customer: customerSchema,
  payment: paymentInfoSchema.required(),
  notes: Joi.string().max(500).allow('')
});

const saleFiltersSchema = paginationSchema.keys({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  cashierId: Joi.string().pattern(objectIdPattern),
  status: Joi.string().valid(...saleStatuses),
  paymentMethod: Joi.string().valid(...paymentMethods),
  minAmount: Joi.number().min(0).max(999999.99),
  maxAmount: Joi.number().min(0).max(999999.99).min(Joi.ref('minAmount'))
});

// Alert validation schemas
const alertTypes = ['low_stock', 'out_of_stock', 'expiry_warning', 'system', 'security'];
const alertPriorities = ['low', 'medium', 'high', 'critical'];

const createAlertSchema = Joi.object({
  type: Joi.string().valid(...alertTypes).required(),
  message: Joi.string().min(10).max(500).required(),
  productId: Joi.string().pattern(objectIdPattern),
  userId: Joi.string().pattern(objectIdPattern).required(),
  priority: Joi.string().valid(...alertPriorities).required()
});

// Report validation schemas
const reportTypes = ['sales', 'inventory', 'financial', 'tax', 'custom'];
const reportFormats = ['json', 'pdf', 'excel', 'csv'];
const reportPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];

const reportPeriodSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  period: Joi.string().valid(...reportPeriods)
});

const reportFiltersSchema = Joi.object({
  categoryId: Joi.string().pattern(objectIdPattern),
  cashierId: Joi.string().pattern(objectIdPattern),
  paymentMethod: Joi.string().valid(...paymentMethods),
  productIds: Joi.array().items(Joi.string().pattern(objectIdPattern)),
  includeRefunds: Joi.boolean().default(false)
});

const generateReportSchema = Joi.object({
  type: Joi.string().valid(...reportTypes).required(),
  period: reportPeriodSchema.required(),
  filters: reportFiltersSchema,
  format: Joi.string().valid(...reportFormats).default('json')
});

// Export validation schemas
module.exports = {
  // Common
  pagination: paginationSchema,
  objectId: Joi.string().pattern(objectIdPattern),
  
  // User schemas
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  login: loginSchema,
  
  // Product schemas
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  productFilters: productFiltersSchema,
  
  // Category schemas
  createCategory: createCategorySchema,
  updateCategory: updateCategorySchema,
  
  // Sale schemas
  createSale: createSaleSchema,
  saleFilters: saleFiltersSchema,
  saleItem: saleItemSchema,
  customer: customerSchema,
  paymentInfo: paymentInfoSchema,
  
  // Alert schemas
  createAlert: createAlertSchema,
  
  // Report schemas
  generateReport: generateReportSchema,
  reportPeriod: reportPeriodSchema,
  reportFilters: reportFiltersSchema,
  
  // Constants for reuse
  constants: {
    userRoles,
    paymentMethods,
    saleStatuses,
    alertTypes,
    alertPriorities,
    reportTypes,
    reportFormats,
    reportPeriods
  }
};