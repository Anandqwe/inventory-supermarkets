const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Supplier = require('../models/Supplier');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Master Data Management Controller
 * Handles CRUD operations for categories, brands, units, suppliers, and branches
 */
class MasterDataController {
  // ============ CATEGORY OPERATIONS ============

  /**
   * Create new category
   */
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        code,
        description,
        parentCategory,
        isActive = true,
        sortOrder = 0
      } = req.body;

      // Check if category code already exists
      const existingCategory = await Category.findOne({ code });
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this code already exists'
        });
      }

      // Validate parent category if provided
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent category'
          });
        }
      }

      const category = new Category({
        name,
        code,
        description,
        parentCategory,
        isActive,
        sortOrder,
        createdBy: req.user.userId
      });

      await category.save();

      const populatedCategory = await Category.findById(category._id)
        .populate('parentCategory', 'name code')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: populatedCategory
      });

    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all categories with hierarchy
   */
  static async getCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        parentCategory,
        includeHierarchy = false
      } = req.query;

      // Build filter
      const filter = {};

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (parentCategory) {
        filter.parentCategory = parentCategory === 'null' ? null : parentCategory;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      let categories;
      let total;

      if (includeHierarchy === 'true') {
        // Get hierarchical structure
        categories = await getHierarchicalCategories(filter);
        total = categories.length;
      } else {
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        [categories, total] = await Promise.all([
          Category.find(filter)
            .populate('parentCategory', 'name code')
            .populate('createdBy', 'firstName lastName')
            .sort({ sortOrder: 1, name: 1 })
            .skip(skip)
            .limit(parseInt(limit)),
          Category.countDocuments(filter)
        ]);
      }

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        pagination: includeHierarchy === 'true' ? undefined : {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check code uniqueness if changing
      if (updateData.code && updateData.code !== category.code) {
        const existingCategory = await Category.findOne({
          code: updateData.code,
          _id: { $ne: id }
        });

        if (existingCategory) {
          return res.status(409).json({
            success: false,
            message: 'Category with this code already exists'
          });
        }
      }

      // Validate parent category if changing
      if (updateData.parentCategory && updateData.parentCategory !== category.parentCategory?.toString()) {
        if (updateData.parentCategory === id) {
          return res.status(400).json({
            success: false,
            message: 'Category cannot be its own parent'
          });
        }

        const parent = await Category.findById(updateData.parentCategory);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent category'
          });
        }
      }

      updateData.updatedBy = req.user.userId;
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('parentCategory', 'name code')
        .populate('updatedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has child categories
      const childCategories = await Category.countDocuments({ parentCategory: id });
      if (childCategories > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with subcategories'
        });
      }

      // Soft delete
      category.isActive = false;
      category.deletedAt = new Date();
      category.deletedBy = req.user.userId;
      await category.save();

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ============ BRAND OPERATIONS ============

  /**
   * Create new brand
   */
  static async createBrand(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        code,
        description,
        website,
        logo,
        isActive = true
      } = req.body;

      // Check if brand code already exists
      const existingBrand = await Brand.findOne({ code });
      if (existingBrand) {
        return res.status(409).json({
          success: false,
          message: 'Brand with this code already exists'
        });
      }

      const brand = new Brand({
        name,
        code,
        description,
        website,
        logo,
        isActive,
        createdBy: req.user.userId
      });

      await brand.save();

      const populatedBrand = await Brand.findById(brand._id)
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Brand created successfully',
        data: populatedBrand
      });

    } catch (error) {
      console.error('Create brand error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all brands
   */
  static async getBrands(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter
      const filter = {};

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [brands, total] = await Promise.all([
        Brand.find(filter)
          .populate('createdBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Brand.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Brands retrieved successfully',
        data: brands,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get brands error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update brand
   */
  static async updateBrand(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const brand = await Brand.findById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      // Check code uniqueness if changing
      if (updateData.code && updateData.code !== brand.code) {
        const existingBrand = await Brand.findOne({
          code: updateData.code,
          _id: { $ne: id }
        });

        if (existingBrand) {
          return res.status(409).json({
            success: false,
            message: 'Brand with this code already exists'
          });
        }
      }

      updateData.updatedBy = req.user.userId;
      const updatedBrand = await Brand.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('updatedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Brand updated successfully',
        data: updatedBrand
      });

    } catch (error) {
      console.error('Update brand error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete brand
   */
  static async deleteBrand(req, res) {
    try {
      const { id } = req.params;

      const brand = await Brand.findById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      // Soft delete
      brand.isActive = false;
      brand.deletedAt = new Date();
      brand.deletedBy = req.user.userId;
      await brand.save();

      res.json({
        success: true,
        message: 'Brand deleted successfully'
      });

    } catch (error) {
      console.error('Delete brand error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ============ UNIT OPERATIONS ============

  /**
   * Create new unit
   */
  static async createUnit(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        symbol,
        description,
        unitType,
        conversionFactor = 1,
        baseUnit,
        isActive = true
      } = req.body;

      // Check if unit symbol already exists
      const existingUnit = await Unit.findOne({ symbol });
      if (existingUnit) {
        return res.status(409).json({
          success: false,
          message: 'Unit with this symbol already exists'
        });
      }

      // Validate base unit if provided
      if (baseUnit) {
        const base = await Unit.findById(baseUnit);
        if (!base) {
          return res.status(400).json({
            success: false,
            message: 'Invalid base unit'
          });
        }
      }

      const unit = new Unit({
        name,
        symbol,
        description,
        unitType,
        conversionFactor,
        baseUnit,
        isActive,
        createdBy: req.user.userId
      });

      await unit.save();

      const populatedUnit = await Unit.findById(unit._id)
        .populate('baseUnit', 'name symbol')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Unit created successfully',
        data: populatedUnit
      });

    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all units
   */
  static async getUnits(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        unitType,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter
      const filter = {};

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (unitType) {
        filter.unitType = unitType;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { symbol: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [units, total] = await Promise.all([
        Unit.find(filter)
          .populate('baseUnit', 'name symbol')
          .populate('createdBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Unit.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Units retrieved successfully',
        data: units,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update unit
   */
  static async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const unit = await Unit.findById(id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      // Check symbol uniqueness if changing
      if (updateData.symbol && updateData.symbol !== unit.symbol) {
        const existingUnit = await Unit.findOne({
          symbol: updateData.symbol,
          _id: { $ne: id }
        });

        if (existingUnit) {
          return res.status(409).json({
            success: false,
            message: 'Unit with this symbol already exists'
          });
        }
      }

      updateData.updatedBy = req.user.userId;
      const updatedUnit = await Unit.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('baseUnit', 'name symbol')
        .populate('updatedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Unit updated successfully',
        data: updatedUnit
      });

    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete unit
   */
  static async deleteUnit(req, res) {
    try {
      const { id } = req.params;

      const unit = await Unit.findById(id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      // Soft delete
      unit.isActive = false;
      unit.deletedAt = new Date();
      unit.deletedBy = req.user.userId;
      await unit.save();

      res.json({
        success: true,
        message: 'Unit deleted successfully'
      });

    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ============ SUPPLIER OPERATIONS ============

  /**
   * Create new supplier
   */
  static async createSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        code,
        contact,
        address,
        paymentTerms,
        taxInfo,
        bankDetails,
        categories = [],
        isActive = true
      } = req.body;

      // Check if supplier code already exists
      const existingSupplier = await Supplier.findOne({ code });
      if (existingSupplier) {
        return res.status(409).json({
          success: false,
          message: 'Supplier with this code already exists'
        });
      }

      const supplier = new Supplier({
        name,
        code,
        contact,
        address,
        paymentTerms,
        taxInfo,
        bankDetails,
        categories,
        isActive,
        createdBy: req.user.userId
      });

      await supplier.save();

      const populatedSupplier = await Supplier.findById(supplier._id)
        .populate('categories', 'name code')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: populatedSupplier
      });

    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all suppliers
   */
  static async getSuppliers(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        category,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter
      const filter = {};

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (category) {
        filter.categories = category;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { 'contact.email': { $regex: search, $options: 'i' } },
          { 'contact.phone': { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [suppliers, total] = await Promise.all([
        Supplier.find(filter)
          .populate('createdBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Supplier.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: suppliers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update supplier
   */
  static async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Check code uniqueness if changing
      if (updateData.code && updateData.code !== supplier.code) {
        const existingSupplier = await Supplier.findOne({
          code: updateData.code,
          _id: { $ne: id }
        });

        if (existingSupplier) {
          return res.status(409).json({
            success: false,
            message: 'Supplier with this code already exists'
          });
        }
      }

      updateData.updatedBy = req.user.userId;
      const updatedSupplier = await Supplier.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('categories', 'name code')
        .populate('updatedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: updatedSupplier
      });

    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Soft delete
      supplier.isActive = false;
      supplier.deletedAt = new Date();
      supplier.deletedBy = req.user.userId;
      await supplier.save();

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });

    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ============ BRANCH OPERATIONS ============

  /**
   * Create new branch (Admin only)
   */
  static async createBranch(req, res) {
    try {
      // Only admins can create branches
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin access required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        code,
        address,
        phone,
        email,
        manager,
        isActive = true
      } = req.body;

      // Check if branch code already exists
      const existingBranch = await Branch.findOne({ code });
      if (existingBranch) {
        return res.status(409).json({
          success: false,
          message: 'Branch with this code already exists'
        });
      }

      // Validate manager if provided
      if (manager) {
        const managerUser = await User.findById(manager);
        if (!managerUser) {
          return res.status(400).json({
            success: false,
            message: 'Invalid manager user'
          });
        }
      }

      const branch = new Branch({
        name,
        code,
        address,
        phone,
        email,
        manager,
        isActive,
        createdBy: req.user.userId
      });

      await branch.save();

      const populatedBranch = await Branch.findById(branch._id)
        .populate('manager', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: populatedBranch
      });

    } catch (error) {
      console.error('Create branch error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all branches
   */
  static async getBranches(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter
      const filter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        filter._id = req.user.branch._id;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [branches, total] = await Promise.all([
        Branch.find(filter)
          .populate('manager', 'firstName lastName email')
          .populate('createdBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Branch.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Branches retrieved successfully',
        data: branches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get branches error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update branch (Admin only)
   */
  static async updateBranch(req, res) {
    try {
      // Only admins can update branches
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin access required'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const branch = await Branch.findById(id);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      // Check code uniqueness if changing
      if (updateData.code && updateData.code !== branch.code) {
        const existingBranch = await Branch.findOne({
          code: updateData.code,
          _id: { $ne: id }
        });

        if (existingBranch) {
          return res.status(409).json({
            success: false,
            message: 'Branch with this code already exists'
          });
        }
      }

      // Validate manager if changing
      if (updateData.manager && updateData.manager !== branch.manager?.toString()) {
        const managerUser = await User.findById(updateData.manager);
        if (!managerUser) {
          return res.status(400).json({
            success: false,
            message: 'Invalid manager user'
          });
        }
      }

      updateData.updatedBy = req.user.userId;
      const updatedBranch = await Branch.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('manager', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Branch updated successfully',
        data: updatedBranch
      });

    } catch (error) {
      console.error('Update branch error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete branch (Admin only)
   */
  static async deleteBranch(req, res) {
    try {
      // Only admins can delete branches
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin access required'
        });
      }

      const { id } = req.params;

      const branch = await Branch.findById(id);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      // Soft delete
      branch.isActive = false;
      branch.deletedAt = new Date();
      branch.deletedBy = req.user.userId;
      await branch.save();

      res.json({
        success: true,
        message: 'Branch deleted successfully'
      });

    } catch (error) {
      console.error('Delete branch error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

/**
 * Helper function to get hierarchical categories
 */
async function getHierarchicalCategories(filter) {
  // Get all categories first
  const allCategories = await Category.find(filter)
    .populate('parentCategory', 'name code')
    .populate('createdBy', 'firstName lastName')
    .sort({ sortOrder: 1, name: 1 });

  // Build hierarchy
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map and identify root categories
  allCategories.forEach(category => {
    categoryMap.set(category._id.toString(), {
      ...category.toObject(),
      children: []
    });

    if (!category.parentCategory) {
      rootCategories.push(category._id.toString());
    }
  });

  // Second pass: build parent-child relationships
  allCategories.forEach(category => {
    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory._id.toString());
      if (parent) {
        parent.children.push(categoryMap.get(category._id.toString()));
      }
    }
  });

  // Return only root categories with their children
  return rootCategories.map(id => categoryMap.get(id));
}

module.exports = MasterDataController;
