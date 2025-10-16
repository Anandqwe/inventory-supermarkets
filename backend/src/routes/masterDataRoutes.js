const express = require('express');
const router = express.Router();

// Controllers
const MasterDataController = require('../controllers/masterDataController');

// Middleware
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Validations
const {
  categoryValidation,
  brandValidation,
  unitValidation,
  supplierValidation,
  branchValidation
} = require('../utils/masterDataValidation');

/**
 * Master Data Routes
 * Provides CRUD operations for categories, brands, units, suppliers, and branches
 */

// ============ CATEGORY ROUTES ============

/**
 * @route   POST /api/master-data/categories
 * @desc    Create a new category
 * @access  Private (requires 'categories.create' permission)
 */
router.post('/categories',
  authenticateToken,
  requirePermission('categories.create'),
  categoryValidation.create,
  MasterDataController.createCategory
);

/**
 * @route   GET /api/master-data/categories
 * @desc    Get all categories with optional filtering and pagination
 * @access  Private (requires 'categories.read' permission)
 * @query   page, limit, search, isActive, parentCategory, includeHierarchy
 */
router.get('/categories',
  authenticateToken,
  requirePermission('categories.read'),
  MasterDataController.getCategories
);

/**
 * @route   PUT /api/master-data/categories/:id
 * @desc    Update a category
 * @access  Private (requires 'categories.update' permission)
 */
router.put('/categories/:id',
  authenticateToken,
  requirePermission('categories.update'),
  categoryValidation.update,
  MasterDataController.updateCategory
);

/**
 * @route   DELETE /api/master-data/categories/:id
 * @desc    Soft delete a category
 * @access  Private (requires 'categories.delete' permission)
 */
router.delete('/categories/:id',
  authenticateToken,
  requirePermission('categories.delete'),
  MasterDataController.deleteCategory
);

// ============ BRAND ROUTES ============

/**
 * @route   POST /api/master-data/brands
 * @desc    Create a new brand
 * @access  Private (requires 'brands.create' permission)
 */
router.post('/brands',
  authenticateToken,
  requirePermission('brands.create'),
  brandValidation.create,
  MasterDataController.createBrand
);

/**
 * @route   GET /api/master-data/brands
 * @desc    Get all brands with optional filtering and pagination
 * @access  Private (requires 'brands.read' permission)
 * @query   page, limit, search, isActive, sortBy, sortOrder
 */
router.get('/brands',
  authenticateToken,
  requirePermission('brands.read'),
  MasterDataController.getBrands
);

/**
 * @route   PUT /api/master-data/brands/:id
 * @desc    Update a brand
 * @access  Private (requires 'brands.update' permission)
 */
router.put('/brands/:id',
  authenticateToken,
  requirePermission('brands.update'),
  brandValidation.update,
  MasterDataController.updateBrand
);

/**
 * @route   DELETE /api/master-data/brands/:id
 * @desc    Soft delete a brand
 * @access  Private (requires 'brands.delete' permission)
 */
router.delete('/brands/:id',
  authenticateToken,
  requirePermission('brands.delete'),
  MasterDataController.deleteBrand
);

// ============ UNIT ROUTES ============

/**
 * @route   POST /api/master-data/units
 * @desc    Create a new unit
 * @access  Private (requires 'units.create' permission)
 */
router.post('/units',
  authenticateToken,
  requirePermission('units.create'),
  unitValidation.create,
  MasterDataController.createUnit
);

/**
 * @route   GET /api/master-data/units
 * @desc    Get all units with optional filtering and pagination
 * @access  Private (requires 'units.read' permission)
 * @query   page, limit, search, isActive, unitType, sortBy, sortOrder
 */
router.get('/units',
  authenticateToken,
  requirePermission('units.read'),
  MasterDataController.getUnits
);

/**
 * @route   PUT /api/master-data/units/:id
 * @desc    Update a unit
 * @access  Private (requires 'units.update' permission)
 */
router.put('/units/:id',
  authenticateToken,
  requirePermission('units.update'),
  unitValidation.update,
  MasterDataController.updateUnit
);

/**
 * @route   DELETE /api/master-data/units/:id
 * @desc    Soft delete a unit
 * @access  Private (requires 'units.delete' permission)
 */
router.delete('/units/:id',
  authenticateToken,
  requirePermission('units.delete'),
  MasterDataController.deleteUnit
);

// ============ SUPPLIER ROUTES ============

/**
 * @route   POST /api/master-data/suppliers
 * @desc    Create a new supplier
 * @access  Private (requires 'suppliers.create' permission)
 */
router.post('/suppliers',
  authenticateToken,
  requirePermission('suppliers.create'),
  supplierValidation.create,
  MasterDataController.createSupplier
);

/**
 * @route   GET /api/master-data/suppliers
 * @desc    Get all suppliers with optional filtering and pagination
 * @access  Private (requires 'suppliers.read' permission)
 * @query   page, limit, search, isActive, category, sortBy, sortOrder
 */
router.get('/suppliers',
  authenticateToken,
  requirePermission('suppliers.read'),
  MasterDataController.getSuppliers
);

/**
 * @route   PUT /api/master-data/suppliers/:id
 * @desc    Update a supplier
 * @access  Private (requires 'suppliers.update' permission)
 */
router.put('/suppliers/:id',
  authenticateToken,
  requirePermission('suppliers.update'),
  supplierValidation.update,
  MasterDataController.updateSupplier
);

/**
 * @route   DELETE /api/master-data/suppliers/:id
 * @desc    Soft delete a supplier
 * @access  Private (requires 'suppliers.delete' permission)
 */
router.delete('/suppliers/:id',
  authenticateToken,
  requirePermission('suppliers.delete'),
  MasterDataController.deleteSupplier
);

// ============ BRANCH ROUTES ============

/**
 * @route   POST /api/master-data/branches
 * @desc    Create a new branch (Admin only)
 * @access  Private (Admin only)
 */
router.post('/branches',
  authenticateToken,
  branchValidation.create,
  MasterDataController.createBranch
);

/**
 * @route   GET /api/master-data/branches
 * @desc    Get all branches with optional filtering and pagination
 * @access  Private (requires 'branches.read' permission)
 * @query   page, limit, search, isActive, sortBy, sortOrder
 */
router.get('/branches',
  authenticateToken,
  requirePermission('branches.read'),
  MasterDataController.getBranches
);

/**
 * @route   PUT /api/master-data/branches/:id
 * @desc    Update a branch (Admin only)
 * @access  Private (Admin only)
 */
router.put('/branches/:id',
  authenticateToken,
  branchValidation.update,
  MasterDataController.updateBranch
);

/**
 * @route   DELETE /api/master-data/branches/:id
 * @desc    Soft delete a branch (Admin only)
 * @access  Private (Admin only)
 */
router.delete('/branches/:id',
  authenticateToken,
  MasterDataController.deleteBranch
);

// ============ ADDITIONAL UTILITY ROUTES ============

/**
 * @route   GET /api/master-data/categories/tree
 * @desc    Get category hierarchy tree
 * @access  Private (requires 'categories.read' permission)
 */
router.get('/categories/tree',
  authenticateToken,
  requirePermission('categories.read'),
  (req, res, next) => {
    req.query.includeHierarchy = 'true';
    next();
  },
  MasterDataController.getCategories
);

/**
 * @route   GET /api/master-data/units/types
 * @desc    Get available unit types
 * @access  Private
 */
router.get('/units/types',
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Unit types retrieved successfully',
      data: [
        { value: 'weight', label: 'Weight' },
        { value: 'volume', label: 'Volume' },
        { value: 'length', label: 'Length' },
        { value: 'area', label: 'Area' },
        { value: 'count', label: 'Count' },
        { value: 'time', label: 'Time' },
        { value: 'other', label: 'Other' }
      ]
    });
  }
);

/**
 * @route   GET /api/master-data/payment-methods
 * @desc    Get available payment methods for suppliers
 * @access  Private
 */
router.get('/payment-methods',
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'online', label: 'Online Payment' }
      ]
    });
  }
);

/**
 * @route   GET /api/master-data/summary
 * @desc    Get master data summary/counts
 * @access  Private (requires appropriate permissions)
 */
router.get('/summary',
  authenticateToken,
  async (req, res) => {
    try {
      const Category = require('../models/Category');
      const Brand = require('../models/Brand');
      const Unit = require('../models/Unit');
      const Supplier = require('../models/Supplier');
      const Branch = require('../models/Branch');

      // Check permissions
      const hasPermissions = {
        categories: req.user.permissions.includes('categories.read'),
        brands: req.user.permissions.includes('brands.read'),
        units: req.user.permissions.includes('units.read'),
        suppliers: req.user.permissions.includes('suppliers.read'),
        branches: req.user.permissions.includes('branches.read')
      };

      const summary = {};

      // Get counts based on permissions
      if (hasPermissions.categories) {
        const [totalCategories, activeCategories] = await Promise.all([
          Category.countDocuments(),
          Category.countDocuments({ isActive: true })
        ]);
        summary.categories = { total: totalCategories, active: activeCategories };
      }

      if (hasPermissions.brands) {
        const [totalBrands, activeBrands] = await Promise.all([
          Brand.countDocuments(),
          Brand.countDocuments({ isActive: true })
        ]);
        summary.brands = { total: totalBrands, active: activeBrands };
      }

      if (hasPermissions.units) {
        const [totalUnits, activeUnits] = await Promise.all([
          Unit.countDocuments(),
          Unit.countDocuments({ isActive: true })
        ]);
        summary.units = { total: totalUnits, active: activeUnits };
      }

      if (hasPermissions.suppliers) {
        const [totalSuppliers, activeSuppliers] = await Promise.all([
          Supplier.countDocuments(),
          Supplier.countDocuments({ isActive: true })
        ]);
        summary.suppliers = { total: totalSuppliers, active: activeSuppliers };
      }

      if (hasPermissions.branches) {
        // Branch filter for RBAC
        const branchFilter = req.user.role !== 'admin' && req.user.branch
          ? { _id: req.user.branch._id }
          : {};

        const [totalBranches, activeBranches] = await Promise.all([
          Branch.countDocuments(branchFilter),
          Branch.countDocuments({ ...branchFilter, isActive: true })
        ]);
        summary.branches = { total: totalBranches, active: activeBranches };
      }

      res.json({
        success: true,
        message: 'Master data summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Get master data summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

module.exports = router;
