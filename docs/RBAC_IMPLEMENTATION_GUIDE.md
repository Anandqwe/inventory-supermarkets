# RBAC Implementation Guide
## Supermarket Inventory & Sales Management System

> **Last Updated**: October 12, 2025  
> **Version**: 2.0  
> **Status**: Production Standard

---

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Role Definitions](#role-definitions)
4. [Permission System](#permission-system)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Branch-Scoped Access](#branch-scoped-access)
8. [Security Best Practices](#security-best-practices)
9. [Testing RBAC](#testing-rbac)
10. [Common Patterns](#common-patterns)

---

## Overview

### What is RBAC?
**Role-Based Access Control (RBAC)** is a security paradigm that restricts system access based on user roles. In this system, access rights are grouped by role, and users are assigned to appropriate roles.

### Why RBAC Matters
- **Security**: Prevent unauthorized access to sensitive operations
- **Compliance**: Maintain audit trails and separation of duties
- **Scalability**: Easily manage permissions for hundreds of users
- **Clarity**: Clear understanding of "who can do what"

### Architecture Overview
```
User → Assigned Role → Granted Permissions → Access Resources
                    ↓
              Branch Scope (if applicable)
```

---

## Core Concepts

### 1. Users
- Individual accounts with email, password, and profile
- Each user has **ONE role** and **ONE branch** assignment
- Users can be active/inactive, locked/unlocked

### 2. Roles
- Named collections of permissions (e.g., "Admin", "Cashier")
- Define job functions and responsibilities
- Hierarchical in nature (Admin > Manager > Staff)

### 3. Permissions
- Granular access rights to specific operations
- Format: `resource.action` (e.g., `products.create`, `sales.read`)
- Stored as array of strings in user document

### 4. Branch Scope
- Most roles are scoped to a single branch
- Admin and Regional Manager have cross-branch access
- Data filtering happens at query level

---

## Role Definitions

### 6 Core Roles

#### 1. **Admin** (System Administrator)
**Purpose**: Full system control and configuration

**Characteristics**:
- ✅ Access to ALL branches
- ✅ ALL permissions granted automatically
- ✅ User and role management
- ✅ System configuration
- ✅ Security and audit logs

**Use Cases**:
- System setup and maintenance
- Creating branches and users
- Resolving critical issues
- Viewing cross-branch analytics

**Permission Count**: 56 (all permissions)

---

#### 2. **Regional Manager**
**Purpose**: Multi-branch oversight and coordination

**Characteristics**:
- ✅ Access to ALL branches
- 🟢 Full product and inventory control
- 🟢 Sales and reports access
- 🔵 Limited user management (cannot create Admins)
- 🔵 View-only for financial data

**Use Cases**:
- Regional performance monitoring
- Cross-branch inventory transfers
- Staff coordination
- Regional sales analysis

**Permission Count**: 42

**Key Permissions**:
```javascript
products.*        // All product operations
sales.create, sales.read, sales.update, sales.refund
inventory.*       // All inventory operations
purchases.*       // All purchase operations
reports.read, reports.export, reports.analytics
users.read, users.update  // Limited user management
```

---

#### 3. **Store Manager**
**Purpose**: Single branch operations management

**Characteristics**:
- 🟡 Access to ASSIGNED BRANCH ONLY
- 🟢 Full operational control of branch
- 🟢 Staff management within branch
- 🟢 Financial operations for branch
- 🔴 Cannot delete critical records

**Use Cases**:
- Daily store operations
- Local staff supervision
- Branch inventory management
- Customer service oversight

**Permission Count**: 35

**Key Permissions**:
```javascript
products.create, products.read, products.update
sales.*           // All sales operations
inventory.*       // All inventory operations
purchases.*       // All purchase operations
invoices.*        // All invoice operations
users.read, users.update  // Branch users only
```

---

#### 4. **Inventory Manager**
**Purpose**: Inventory and stock control specialist

**Characteristics**:
- 🟡 Access to ASSIGNED BRANCH ONLY
- 🟢 Full inventory control
- 🟢 Product management
- 🟢 Purchase order management
- 🔴 Cannot make sales
- 🔴 No financial access

**Use Cases**:
- Stock level monitoring
- Reorder management
- Inventory audits
- Product catalog maintenance

**Permission Count**: 28

**Key Permissions**:
```javascript
products.*        // All product operations
inventory.*       // All inventory operations
purchases.create, purchases.read, purchases.receive
reports.read      // Inventory reports only
```

---

#### 5. **Cashier**
**Purpose**: Point-of-sale operations

**Characteristics**:
- 🟡 Access to ASSIGNED BRANCH ONLY
- 🟢 Sales transaction processing
- 🟡 View products for sales
- 🟡 View own sales only
- 🔴 Cannot modify inventory
- 🔴 Cannot access reports

**Use Cases**:
- Processing customer purchases
- Handling payments
- Printing receipts
- Daily shift operations

**Permission Count**: 12

**Key Permissions**:
```javascript
sales.create, sales.read  // Create and view own sales
products.read             // View products for sales
dashboard.read            // View own metrics
profile.read, profile.update
```

---

#### 6. **Viewer** (Auditor/Observer)
**Purpose**: Read-only access for auditing and monitoring

**Characteristics**:
- ✅ Access to ALL branches (read-only)
- 🟡 View all data across system
- 🟡 Export reports
- 🔴 CANNOT create, update, or delete anything
- 🔴 CANNOT access sensitive financial data

**Use Cases**:
- External audits
- Compliance monitoring
- Report generation
- Data analysis

**Permission Count**: 20 (all read-only)

**Key Permissions**:
```javascript
products.read, products.export
sales.read
inventory.read
reports.read, reports.export
dashboard.read
```

---

## Permission System

### Permission Format
**Standard Format**: `resource.action`

```javascript
// Examples
"products.create"   // Create new products
"sales.read"        // View sales records
"inventory.adjust"  // Adjust stock levels
"users.delete"      // Delete user accounts
```

### Permission Categories

#### 1. **Product Management**
```javascript
products.create    // Create new products
products.read      // View products
products.update    // Edit product details
products.delete    // Remove products
products.import    // Bulk import
products.export    // Export to CSV/Excel
```

#### 2. **Sales Operations**
```javascript
sales.create       // Process new sales
sales.read         // View sales records
sales.update       // Modify sales (limited)
sales.delete       // Delete sales (Admin only)
sales.refund       // Process refunds
```

#### 3. **Inventory Management**
```javascript
inventory.create   // Create inventory records
inventory.read     // View inventory levels
inventory.update   // Update stock info
inventory.delete   // Delete inventory records
inventory.adjust   // Make stock adjustments
inventory.transfer // Transfer stock between branches
```

#### 4. **Purchase Orders**
```javascript
purchases.create   // Create purchase orders
purchases.read     // View purchase orders
purchases.update   // Modify orders
purchases.delete   // Delete orders (Admin only)
purchases.approve  // Approve orders
purchases.receive  // Receive goods
```

#### 5. **Financial Management**
```javascript
invoices.create    // Create invoices
invoices.read      // View invoices
invoices.update    // Modify invoices
invoices.delete    // Delete invoices
invoices.void      // Void invoices
invoices.send      // Send invoices to customers

payments.create    // Record payments
payments.read      // View payments
payments.update    // Update payment records
payments.void      // Void payments

financial.reports  // View financial reports
financial.dashboard // Access financial dashboard
```

#### 6. **Reports & Analytics**
```javascript
reports.read       // View reports
reports.export     // Export reports
reports.analytics  // Advanced analytics
```

#### 7. **User Management**
```javascript
users.create       // Create new users
users.read         // View user list
users.update       // Edit user details
users.delete       // Delete users
```

#### 8. **Master Data**
```javascript
categories.create, categories.read, categories.update, categories.delete
brands.create, brands.read, brands.update, brands.delete
units.create, units.read, units.update, units.delete
suppliers.create, suppliers.read, suppliers.update, suppliers.delete
branches.create, branches.read, branches.update, branches.delete
```

#### 9. **Security & Audit**
```javascript
audit.read         // View audit logs
security.dashboard // Security dashboard
security.sessions  // Manage sessions
```

#### 10. **Dashboard & Profile**
```javascript
dashboard.read     // View dashboard
dashboard.analytics // Advanced dashboard analytics
profile.read       // View own profile
profile.update     // Edit own profile
```

---

## Backend Implementation

### 1. Database Schema (MongoDB)

#### User Model
```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  
  // RBAC Fields
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Regional Manager', 'Store Manager', 
           'Inventory Manager', 'Cashier', 'Viewer'],
    default: 'Cashier'
  },
  
  permissions: {
    type: [String],
    default: []
    // Format: ['products.create', 'sales.read', ...]
  },
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: function() {
      // Required for branch-scoped roles
      return ['Store Manager', 'Inventory Manager', 'Cashier'].includes(this.role);
    }
  },
  
  // Security Fields
  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lastLogin: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, branch: 1 });
userSchema.index({ isActive: 1 });
```

### 2. Permissions Configuration (Shared)

**File**: `shared/permissions.js`

```javascript
// Centralized permission constants
const PERMISSIONS = {
  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    IMPORT: 'products.import',
    EXPORT: 'products.export',
  },
  
  SALES: {
    CREATE: 'sales.create',
    READ: 'sales.read',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    REFUND: 'sales.refund',
  },
  
  // ... more categories
};

// Role-to-Permissions mapping
const ROLE_PERMISSIONS = {
  'Admin': [
    // ALL permissions - 56 total
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    // ... all other permissions
  ],
  
  'Regional Manager': [
    // 42 permissions
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    // ... specific permissions
  ],
  
  'Store Manager': [
    // 35 permissions
  ],
  
  'Inventory Manager': [
    // 28 permissions
  ],
  
  'Cashier': [
    // 12 permissions
    PERMISSIONS.SALES.CREATE,
    PERMISSIONS.SALES.READ,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
  ],
  
  'Viewer': [
    // 20 read-only permissions
  ]
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getAllPermissions: () => Object.values(PERMISSIONS).flatMap(cat => Object.values(cat))
};
```

### 3. Authentication Middleware

**File**: `backend/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user with branch info
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('branch', 'name code');
      
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      branch: user.branch,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid access token'
    });
  }
};

/**
 * Check if user has required permission
 * @param {string} permission - Permission string (e.g., 'products.create')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'Admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    
    // Check exact match
    if (userPermissions.includes(permission)) {
      return next();
    }
    
    // Check wildcard (e.g., 'products.*' grants all product permissions)
    const [resource] = permission.split('.');
    if (userPermissions.includes(`${resource}.*`)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
      required: permission,
      userPermissions: userPermissions
    });
  };
};

/**
 * Check if user has specific role
 * @param {string|string[]} allowedRoles - Role(s) that can access
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions - role not authorized',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user has Admin role
 */
const requireAdmin = requireRole('Admin');

/**
 * Check if user has Manager role (any type)
 */
const requireManager = requireRole([
  'Admin', 
  'Regional Manager', 
  'Store Manager', 
  'Inventory Manager'
]);

/**
 * Check if user has ANY of the specified permissions
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'Admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAny = permissions.some(p => userPermissions.includes(p));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permissions
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireAdmin,
  requireManager,
  requireAnyPermission
};
```

### 4. Route Protection Examples

```javascript
const express = require('express');
const router = express.Router();
const { 
  authenticateToken, 
  requirePermission, 
  requireAdmin 
} = require('../middleware/auth');
const { PERMISSIONS } = require('../../../shared/permissions');
const ProductController = require('../controllers/productController');

// All routes require authentication
router.use(authenticateToken);

// Public read (all authenticated users)
router.get('/', 
  requirePermission(PERMISSIONS.PRODUCTS.READ), 
  ProductController.getAll
);

// Create requires permission
router.post('/', 
  requirePermission(PERMISSIONS.PRODUCTS.CREATE), 
  ProductController.create
);

// Update requires permission
router.put('/:id', 
  requirePermission(PERMISSIONS.PRODUCTS.UPDATE), 
  ProductController.update
);

// Delete - Admin only
router.delete('/:id', 
  requireAdmin, 
  ProductController.delete
);

// Import requires permission
router.post('/import', 
  requirePermission(PERMISSIONS.PRODUCTS.IMPORT), 
  ProductController.bulkImport
);

module.exports = router;
```

### 5. User Creation with Permissions

```javascript
// When creating a user, auto-assign permissions based on role
const createUser = async (userData) => {
  const { role } = userData;
  
  // Get default permissions for role
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  const user = new User({
    ...userData,
    permissions, // Auto-assigned
    password: await bcrypt.hash(userData.password, 10)
  });
  
  await user.save();
  return user;
};

// Updating user role should update permissions
const updateUserRole = async (userId, newRole) => {
  const permissions = ROLE_PERMISSIONS[newRole] || [];
  
  await User.findByIdAndUpdate(userId, {
    role: newRole,
    permissions, // Update permissions when role changes
    updatedAt: new Date()
  });
};
```

---

## Frontend Implementation

### 1. Auth Context

**File**: `frontend/src/contexts/AuthContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: accessToken, user: userData } = response.data.data;
      
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Permission Hook

**File**: `frontend/src/hooks/usePermission.js`

```javascript
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../../../shared/permissions';

export const usePermission = () => {
  const { user } = useAuth();

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    
    // Admin has all permissions
    if (user.role === 'Admin') return true;
    
    // Check exact match
    if (user.permissions.includes(permission)) return true;
    
    // Check wildcard
    const [resource] = permission.split('.');
    if (user.permissions.includes(`${resource}.*`)) return true;
    
    return false;
  };

  /**
   * Check if user has ANY of the permissions
   */
  const hasAnyPermission = (permissions) => {
    return permissions.some(p => hasPermission(p));
  };

  /**
   * Check if user has ALL permissions
   */
  const hasAllPermissions = (permissions) => {
    return permissions.every(p => hasPermission(p));
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (roles) => {
    if (!user?.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  /**
   * Role shortcuts
   */
  const isAdmin = () => user?.role === 'Admin';
  const isManager = () => hasRole(['Admin', 'Regional Manager', 'Store Manager', 'Inventory Manager']);
  const isCashier = () => user?.role === 'Cashier';
  const isViewer = () => user?.role === 'Viewer';

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isManager,
    isCashier,
    isViewer,
    PERMISSIONS
  };
};
```

### 3. UI Component Protection

```jsx
import { usePermission } from '../hooks/usePermission';
import { PERMISSIONS } from '../../../shared/permissions';

function ProductsPage() {
  const { hasPermission } = usePermission();

  return (
    <div>
      <h1>Products</h1>
      
      {/* Conditionally render based on permission */}
      {hasPermission(PERMISSIONS.PRODUCTS.CREATE) && (
        <Button onClick={handleCreate}>
          Add Product
        </Button>
      )}
      
      <ProductTable>
        {products.map(product => (
          <ProductRow key={product.id} product={product}>
            {/* Edit button */}
            {hasPermission(PERMISSIONS.PRODUCTS.UPDATE) && (
              <Button onClick={() => handleEdit(product)}>
                Edit
              </Button>
            )}
            
            {/* Delete button - Admin only */}
            {hasPermission(PERMISSIONS.PRODUCTS.DELETE) && (
              <Button onClick={() => handleDelete(product)}>
                Delete
              </Button>
            )}
          </ProductRow>
        ))}
      </ProductTable>
    </div>
  );
}
```

### 4. Route Protection

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';

// Protect entire routes
function ProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission, hasRole } = usePermission();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Usage in routes
<Route 
  path="/products" 
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.PRODUCTS.READ}>
      <ProductsPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/users" 
  element={
    <ProtectedRoute requiredRole="Admin">
      <UsersPage />
    </ProtectedRoute>
  } 
/>
```

---

## Branch-Scoped Access

### Concept
Most roles can only access data from their assigned branch. Admin and Regional Manager have cross-branch access.

### Backend Implementation

#### 1. Add Branch Filter to Queries
```javascript
// ProductController.js
const getAll = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  // Build query with branch scope
  let query = {};
  
  // Branch scoping
  if (req.user.role === 'Admin' || req.user.role === 'Regional Manager') {
    // Can see all branches - no filter
  } else {
    // Scoped to their branch
    query['stocks.branch'] = req.user.branch;
  }
  
  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  
  const products = await Product.find(query)
    .populate('category brand')
    .limit(limit)
    .skip((page - 1) * limit);
  
  return ResponseUtils.paginated(res, products, page, limit, total);
};
```

#### 2. Middleware for Branch Filtering
```javascript
// middleware/branchScope.js

/**
 * Add branch scope to query for non-Admin users
 */
const applyBranchScope = (field = 'branch') => {
  return (req, res, next) => {
    // Skip for Admin and Regional Manager
    if (['Admin', 'Regional Manager'].includes(req.user?.role)) {
      return next();
    }
    
    // Apply branch filter
    if (req.user?.branch) {
      req.branchFilter = { [field]: req.user.branch };
    }
    
    next();
  };
};

// Usage
router.get('/sales', 
  authenticateToken, 
  applyBranchScope('branch'),
  SalesController.getAll
);
```

#### 3. Validate Branch on Create/Update
```javascript
// Before creating/updating records
const createSale = async (req, res) => {
  const { branch } = req.body;
  
  // Validate branch access
  if (!['Admin', 'Regional Manager'].includes(req.user.role)) {
    // Must be their assigned branch
    if (branch.toString() !== req.user.branch.toString()) {
      return ResponseUtils.forbidden(res, 'Cannot create sales for other branches');
    }
  }
  
  // Create sale
  const sale = new Sale({
    ...req.body,
    createdBy: req.user.id
  });
  
  await sale.save();
  return ResponseUtils.success(res, sale, 'Sale created successfully');
};
```

### Frontend Implementation

#### 1. Branch Context/State
```javascript
// For branch-scoped users, use their assigned branch
const userBranch = user.branch?._id;

// For Admin/Regional Manager, allow branch selection
const [selectedBranch, setSelectedBranch] = useState(null);

const effectiveBranch = ['Admin', 'Regional Manager'].includes(user.role)
  ? selectedBranch
  : userBranch;
```

#### 2. Branch Filter in Queries
```javascript
// API call with branch filter
const fetchProducts = async () => {
  const params = {
    page,
    limit,
    search,
    branch: effectiveBranch // Include branch in query
  };
  
  const response = await productsAPI.getAll(params);
  return response.data;
};
```

#### 3. Branch Selector for Admins
```jsx
function BranchSelector() {
  const { user } = useAuth();
  const { isAdmin, hasRole } = usePermission();
  
  // Only show for Admin and Regional Manager
  if (!hasRole(['Admin', 'Regional Manager'])) {
    return null;
  }
  
  return (
    <Select 
      value={selectedBranch}
      onChange={setSelectedBranch}
      placeholder="Select Branch"
    >
      <option value="">All Branches</option>
      {branches.map(branch => (
        <option key={branch._id} value={branch._id}>
          {branch.name}
        </option>
      ))}
    </Select>
  );
}
```

---

## Security Best Practices

### 1. Password Security
```javascript
// Use bcrypt with appropriate rounds
const hashedPassword = await bcrypt.hash(password, 10);

// Enforce strong passwords
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

### 2. JWT Token Security
```javascript
// Short expiration time
const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' } // Short-lived tokens
);

// Use strong secret (32+ characters)
JWT_SECRET=your-very-long-and-random-secret-key-minimum-32-characters
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// Auth endpoints - stricter limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// General API - more lenient
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per 15 minutes
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
```

### 4. Account Lockout
```javascript
// After failed login attempts
user.failedLoginAttempts += 1;

if (user.failedLoginAttempts >= 5) {
  user.isLocked = true;
  user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}

await user.save();
```

### 5. Input Sanitization
```javascript
// Sanitize all user inputs
const sanitizeString = (str) => {
  return str.trim().replace(/[<>]/g, '');
};

// Validate on backend, not just frontend
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### 6. CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL, // Specific origin only
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 7. Audit Logging
```javascript
// Log all sensitive operations
const auditLog = async (action, user, resource, details) => {
  await AuditLog.create({
    action,
    user: user.id,
    userRole: user.role,
    resource,
    details,
    ipAddress: req.ip,
    timestamp: new Date()
  });
};

// Usage
await auditLog('DELETE_PRODUCT', req.user, 'Product', { productId: id });
```

---

## Testing RBAC

### 1. Test User Accounts
After running `npm run seed`, use these accounts:

```
Admin:
Email: admin@supermarket.com
Password: Admin@123456
Branch: All

Regional Manager:
Email: regionalmanager@supermarket.com
Password: Manager@123456
Branch: All

Store Manager:
Email: storemanager@supermarket.com
Password: Manager@123456
Branch: Delhi Central

Inventory Manager:
Email: inventorymanager@supermarket.com
Password: Inventory@123456
Branch: Delhi Central

Cashier:
Email: cashier1@supermarket.com
Password: Cashier@123456
Branch: Delhi Central

Viewer:
Email: viewer@supermarket.com
Password: Viewer@123456
Branch: All (read-only)
```

### 2. Test Scenarios

#### Scenario 1: Cashier Limitations
1. Login as Cashier
2. ✅ Can create sales
3. ✅ Can view products
4. ❌ Cannot access Products page (no edit)
5. ❌ Cannot access Reports page
6. ❌ Cannot access Users page
7. ✅ Can only see own sales
8. ✅ Can only see own branch data

#### Scenario 2: Store Manager Capabilities
1. Login as Store Manager
2. ✅ Can manage products in own branch
3. ✅ Can process sales
4. ✅ Can manage inventory
5. ✅ Can view reports for own branch
6. ✅ Can manage users in own branch
7. ❌ Cannot see other branches
8. ❌ Cannot delete critical records

#### Scenario 3: Admin Full Access
1. Login as Admin
2. ✅ Can access all pages
3. ✅ Can see all branches
4. ✅ Can create/edit/delete anything
5. ✅ Can manage all users
6. ✅ Can view security logs

### 3. Automated Tests

```javascript
// tests/auth.test.js
describe('RBAC Tests', () => {
  test('Cashier cannot access admin routes', async () => {
    const cashierToken = await getToken('cashier1@supermarket.com');
    
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${cashierToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
  
  test('Admin can access all routes', async () => {
    const adminToken = await getToken('admin@supermarket.com');
    
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('Store Manager limited to own branch', async () => {
    const managerToken = await getToken('storemanager@supermarket.com');
    
    const response = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${managerToken}`);
    
    expect(response.status).toBe(200);
    // Should only see products from their branch
    const products = response.body.data;
    products.forEach(product => {
      expect(product.branch).toBe(manager.branch);
    });
  });
});
```

---

## Common Patterns

### Pattern 1: Checking Multiple Permissions
```javascript
// Backend
const requireAnyPermission(['products.read', 'products.create'])

// Frontend
{hasAnyPermission([PERMISSIONS.PRODUCTS.READ, PERMISSIONS.PRODUCTS.CREATE]) && (
  <ProductList />
)}
```

### Pattern 2: Role-Based UI
```jsx
function Dashboard() {
  const { user, isAdmin, isCashier } = usePermission();
  
  return (
    <div>
      {isAdmin() && <AdminDashboard />}
      {isCashier() && <CashierDashboard />}
      {!isAdmin() && !isCashier() && <ManagerDashboard />}
    </div>
  );
}
```

### Pattern 3: Progressive Enhancement
```jsx
// Show basic info to everyone, detailed info to authorized
function ProductCard({ product }) {
  const { hasPermission } = usePermission();
  
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>Price: ₹{product.price}</p>
      
      {hasPermission(PERMISSIONS.PRODUCTS.UPDATE) && (
        <div className="admin-info">
          <p>Cost: ₹{product.cost}</p>
          <p>Profit: ₹{product.price - product.cost}</p>
          <Button>Edit</Button>
        </div>
      )}
    </Card>
  );
}
```

### Pattern 4: API Error Handling
```javascript
// Frontend API interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
      // Optionally redirect
      navigate('/unauthorized');
    }
    return Promise.reject(error);
  }
);
```

### Pattern 5: Dynamic Navigation
```jsx
function Navigation() {
  const { hasPermission } = usePermission();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', show: true },
    { 
      path: '/products', 
      label: 'Products', 
      show: hasPermission(PERMISSIONS.PRODUCTS.READ) 
    },
    { 
      path: '/sales', 
      label: 'Sales', 
      show: hasPermission(PERMISSIONS.SALES.READ) 
    },
    { 
      path: '/users', 
      label: 'Users', 
      show: hasPermission(PERMISSIONS.USERS.READ) 
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      show: hasPermission(PERMISSIONS.REPORTS.READ) 
    },
  ];
  
  return (
    <nav>
      {navItems.filter(item => item.show).map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## Quick Reference

### Permission Check Cheatsheet

| Need | Backend | Frontend |
|------|---------|----------|
| Require permission | `requirePermission('products.create')` | `hasPermission(PERMISSIONS.PRODUCTS.CREATE)` |
| Require role | `requireRole('Admin')` | `hasRole('Admin')` |
| Require any permission | `requireAnyPermission([...])` | `hasAnyPermission([...])` |
| Admin only | `requireAdmin` | `isAdmin()` |
| Manager only | `requireManager` | `isManager()` |

### Common Mistakes to Avoid

❌ **Don't**: Check role instead of permission
```javascript
if (user.role === 'Manager') { // BAD
```

✅ **Do**: Check permission
```javascript
if (hasPermission(PERMISSIONS.PRODUCTS.CREATE)) { // GOOD
```

❌ **Don't**: Store permissions in frontend only
```javascript
// Frontend-only check is not secure!
```

✅ **Do**: Always validate on backend
```javascript
// Backend validates, frontend hides UI
```

❌ **Don't**: Use hardcoded permission strings
```javascript
hasPermission('products.create') // BAD
```

✅ **Do**: Use constants
```javascript
hasPermission(PERMISSIONS.PRODUCTS.CREATE) // GOOD
```

---

## Troubleshooting

### Issue: User can't access expected features
1. Check if user is active: `user.isActive === true`
2. Check if account is locked: `user.isLocked === false`
3. Verify permissions array: `console.log(user.permissions)`
4. Check role assignment: `console.log(user.role)`
5. Verify branch assignment: `console.log(user.branch)`

### Issue: 403 Forbidden errors
1. Check permission spelling (exact match required)
2. Verify user has been assigned permissions
3. Check if role was updated but permissions weren't
4. Look at backend logs for permission mismatch details

### Issue: Branch data not filtered
1. Verify branch scope middleware is applied
2. Check if user role is correctly identified
3. Ensure branch ID is correctly populated
4. Verify query includes branch filter

### Issue: Token expired constantly
1. Check JWT_EXPIRES_IN setting (should be '24h')
2. Verify system clocks are synchronized
3. Check if JWT_SECRET is consistent across restarts

---

## Summary

### Key Principles
1. **Defense in Depth**: Check permissions on both frontend AND backend
2. **Least Privilege**: Grant minimum permissions needed for role
3. **Centralized Definitions**: Use shared permission constants
4. **Consistent Checking**: Use utility functions, not ad-hoc checks
5. **Branch Scoping**: Always consider multi-branch architecture
6. **Audit Everything**: Log sensitive operations

### Implementation Checklist
- ✅ User model includes role, permissions, and branch
- ✅ Shared permissions.js defines all permissions
- ✅ Backend middleware validates permissions
- ✅ Frontend hook checks permissions before rendering
- ✅ Routes are protected with middleware
- ✅ Branch scoping filters data correctly
- ✅ JWT tokens are secure and short-lived
- ✅ Audit logs track sensitive operations
- ✅ Tests validate RBAC behavior

### Next Steps
1. Review existing implementation against this guide
2. Update permission constants if needed
3. Test all roles with provided test accounts
4. Document any custom permissions added
5. Train staff on role capabilities

---

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Maintained By**: Development Team  
**Questions**: Refer to `/docs/` for additional documentation
