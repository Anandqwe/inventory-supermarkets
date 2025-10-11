# Inventory Management System API Documentation

## Overview
A comprehensive supermarket inventory management system with advanced features including Redis Cloud caching, automated email notifications, multi-branch support, JWT authentication, RBAC, real-time inventory tracking, and advanced analytics.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-backend-url.render.com`

## Authentication
All API endpoints require JWT authentication except for login, health check, and public endpoints.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Branch-ID: <branch_id> (optional)
```

### Authentication Flow
1. Login to receive access token (24h) and refresh token (7d)
2. Include access token in Authorization header
3. Use refresh token endpoint when access token expires
4. Logout to invalidate tokens

## API Endpoints

### 🔐 Authentication & Authorization

#### POST /api/auth/login
Login user and obtain JWT tokens.

**Request Body:**
```json
{
  "email": "admin@inventory.com",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "676b123456789abcdef12345",
      "email": "admin@inventory.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "admin",
      "permissions": {
        "users": ["create", "read", "update", "delete"],
        "products": ["create", "read", "update", "delete"],
        "sales": ["create", "read", "update", "delete"],
        "reports": ["create", "read", "update", "delete"],
        "settings": ["create", "read", "update", "delete"]
      },
      "branchAccess": ["all"],
      "isActive": true,
      "lastLogin": "2024-12-24T10:00:00.000Z",
      "profile": {
        "avatar": "avatar_url",
        "phone": "+1234567890",
        "address": "123 Admin St"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### POST /api/auth/logout
Logout and invalidate tokens.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@inventory.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

#### POST /api/auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

#### POST /api/auth/change-password
Change user password (authenticated).

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### GET /api/auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676b123456789abcdef12345",
      "firstName": "John",
      "lastName": "Manager",
      "email": "manager@inventory.com",
      "role": "manager",
      "permissions": {...},
      "isActive": true,
      "lastLogin": "2024-12-24T10:00:00.000Z",
      "profile": {
        "avatar": "avatar_url",
        "phone": "+1234567890",
        "address": "456 Manager Ave"
      }
    }
  }
}
```

#### PUT /api/auth/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Manager",
  "profile": {
    "phone": "+1234567890",
    "address": "456 Manager Ave"
  }
}
```

---

### 👥 User Management

#### GET /api/users
Get all users with pagination and filtering.

**Permission Required:** `users:read`

**Query Parameters:**
```
?page=1&limit=20&role=manager&search=john&isActive=true&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "676b123456789abcdef12345",
        "firstName": "John",
        "lastName": "Manager",
        "email": "manager@inventory.com",
        "role": "manager",
        "isActive": true,
        "lastLogin": "2024-12-24T10:00:00.000Z",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "branchAccess": ["branch1", "branch2"]
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  }
}
```

#### GET /api/users/:id
Get user by ID.

**Permission Required:** `users:read`

#### POST /api/users
Create new user.

**Permission Required:** `users:create`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Cashier",
  "email": "cashier@inventory.com",
  "password": "TempPass123!",
  "role": "cashier",
  "branchAccess": ["branch1"],
  "profile": {
    "phone": "+1234567891",
    "address": "789 Cashier Ln"
  }
}
```

#### PUT /api/users/:id
Update user.

**Permission Required:** `users:update`

#### DELETE /api/users/:id
Delete user.

**Permission Required:** `users:delete`

#### POST /api/users/:id/toggle-status
Toggle user active status.

**Permission Required:** `users:update`

---

### 📦 Product Management

#### GET /api/products
Get all products with advanced filtering and pagination.

**Permission Required:** `products:read`

**Query Parameters:**
```
?page=1&limit=20&category=electronics&brand=samsung&search=laptop&inStock=true&lowStock=false&sortBy=name&sortOrder=asc&priceRange=100-500&expiryWarning=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "676b123456789abcdef12345",
        "name": "Premium Laptop",
        "description": "High-performance laptop for professionals",
        "sku": "LAP-001",
        "barcode": "1234567890123",
        "category": {
          "id": "cat123",
          "name": "Electronics",
          "slug": "electronics"
        },
        "brand": {
          "id": "brand123",
          "name": "TechCorp",
          "logo": "logo_url"
        },
        "pricing": {
          "costPrice": 800,
          "sellingPrice": 1200,
          "discountPrice": 1100,
          "margin": 400,
          "marginPercent": 50
        },
        "stock": {
          "quantity": 25,
          "reorderLevel": 5,
          "maxStockLevel": 50,
          "reserved": 2,
          "available": 23
        },
        "stockByBranch": {
          "branch1": 15,
          "branch2": 10
        },
        "supplier": "TechSupplier Inc",
        "isPerishable": false,
        "expiryDate": null,
        "tags": ["laptop", "electronics", "premium"],
        "images": ["image1.jpg", "image2.jpg"],
        "isActive": true,
        "createdBy": "user123",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "updatedAt": "2024-12-24T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    },
    "summary": {
      "totalProducts": 150,
      "lowStockItems": 5,
      "outOfStockItems": 2,
      "expiringItems": 1
    }
  }
}
```

#### GET /api/products/:id
Get product by ID with full details.

**Permission Required:** `products:read`

#### POST /api/products
Create new product.

**Permission Required:** `products:create`

**Request Body:**
```json
{
  "name": "Premium Laptop",
  "description": "High-performance laptop for professionals",
  "sku": "LAP-001",
  "barcode": "1234567890123",
  "categoryId": "676b123456789abcdef12345",
  "brandId": "676b123456789abcdef12346",
  "pricing": {
    "costPrice": 800,
    "sellingPrice": 1200,
    "discountPrice": 1100
  },
  "stock": {
    "quantity": 25,
    "reorderLevel": 5,
    "maxStockLevel": 50
  },
  "supplier": "TechSupplier Inc",
  "isPerishable": false,
  "tags": ["laptop", "electronics", "premium"],
  "images": ["image1.jpg", "image2.jpg"]
}
```

#### PUT /api/products/:id
Update product.

**Permission Required:** `products:update`

#### DELETE /api/products/:id
Delete product.

**Permission Required:** `products:delete`

#### POST /api/products/:id/adjust-stock
Adjust product stock with reason.

**Permission Required:** `products:update`

**Request Body:**
```json
{
  "adjustment": -5,
  "reason": "damaged",
  "notes": "Water damage during transport",
  "branchId": "branch1"
}
```

#### GET /api/products/low-stock
Get products with low stock.

**Permission Required:** `products:read`

#### GET /api/products/expiring
Get products expiring soon.

**Permission Required:** `products:read`

**Query Parameters:**
```
?days=30&branch=branch1
```

#### POST /api/products/bulk-update
Bulk update products.

**Permission Required:** `products:update`

**Request Body:**
```json
{
  "productIds": ["id1", "id2", "id3"],
  "updates": {
    "pricing.discountPrice": 99,
    "isActive": true
  }
}
```

---

### 🏷️ Category Management

#### GET /api/categories
Get all categories with hierarchy.

**Permission Required:** `products:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "676b123456789abcdef12345",
        "name": "Electronics",
        "description": "Electronic devices and accessories",
        "slug": "electronics",
        "image": "electronics.jpg",
        "sortOrder": 1,
        "isActive": true,
        "productCount": 45,
        "children": [
          {
            "id": "676b123456789abcdef12346",
            "name": "Laptops",
            "parentId": "676b123456789abcdef12345",
            "productCount": 12
          }
        ]
      }
    ]
  }
}
```

#### POST /api/categories
Create new category.

**Permission Required:** `products:create`

#### PUT /api/categories/:id
Update category.

**Permission Required:** `products:update`

#### DELETE /api/categories/:id
Delete category.

**Permission Required:** `products:delete`

---

### 🏭 Brand Management

#### GET /api/brands
Get all brands.

**Permission Required:** `products:read`

#### POST /api/brands
Create new brand.

**Permission Required:** `products:create`

#### PUT /api/brands/:id
Update brand.

**Permission Required:** `products:update`

#### DELETE /api/brands/:id
Delete brand.

**Permission Required:** `products:delete`

---

### 💰 Sales Management

#### GET /api/sales
Get all sales with filtering and pagination.

**Permission Required:** `sales:read`

**Query Parameters:**
```
?page=1&limit=20&startDate=2024-12-01&endDate=2024-12-31&cashier=user123&status=completed&minAmount=100&maxAmount=1000&branch=branch1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": [
      {
        "id": "676b123456789abcdef12345",
        "saleNumber": "SALE-2024-001",
        "items": [
          {
            "productId": "prod123",
            "productName": "Premium Laptop",
            "sku": "LAP-001",
            "quantity": 1,
            "unitPrice": 1200,
            "discount": 100,
            "tax": 108,
            "totalPrice": 1208
          }
        ],
        "customer": {
          "name": "John Customer",
          "phone": "+1234567890",
          "email": "customer@email.com"
        },
        "totals": {
          "subtotal": 1200,
          "discount": 100,
          "tax": 108,
          "total": 1208
        },
        "payment": {
          "method": "card",
          "reference": "TXN123456",
          "receivedAmount": 1208,
          "changeAmount": 0
        },
        "cashier": {
          "id": "user123",
          "name": "Jane Cashier"
        },
        "branch": {
          "id": "branch1",
          "name": "Main Store"
        },
        "status": "completed",
        "notes": "Regular customer",
        "createdAt": "2024-12-24T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 500,
      "page": 1,
      "limit": 20,
      "pages": 25
    },
    "summary": {
      "totalSales": 500,
      "totalAmount": 150000,
      "averageAmount": 300
    }
  }
}
```

#### GET /api/sales/:id
Get sale by ID with full details.

**Permission Required:** `sales:read`

#### POST /api/sales
Create new sale.

**Permission Required:** `sales:create`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "676b123456789abcdef12345",
      "quantity": 2,
      "unitPrice": 1200,
      "discount": 50
    }
  ],
  "customer": {
    "name": "John Customer",
    "phone": "+1234567890",
    "email": "customer@email.com"
  },
  "payment": {
    "method": "card",
    "reference": "TXN123456",
    "receivedAmount": 2350
  },
  "notes": "Bulk purchase discount applied"
}
```

#### PUT /api/sales/:id
Update sale (limited fields).

**Permission Required:** `sales:update`

#### DELETE /api/sales/:id
Void/cancel sale.

**Permission Required:** `sales:delete`

#### GET /api/sales/daily-summary
Get daily sales summary.

**Permission Required:** `sales:read`

#### GET /api/sales/top-products
Get top-selling products.

**Permission Required:** `sales:read`

---

### 📊 Dashboard & Analytics

#### GET /api/dashboard/overview
Get dashboard overview with key metrics.

**Permission Required:** `reports:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": {
      "today": 15000,
      "yesterday": 12000,
      "thisMonth": 450000,
      "lastMonth": 420000,
      "growth": 7.14
    },
    "products": {
      "total": 150,
      "lowStock": 5,
      "outOfStock": 2,
      "expiring": 1
    },
    "revenue": {
      "today": 15000,
      "thisWeek": 85000,
      "thisMonth": 450000,
      "thisYear": 5400000
    },
    "topProducts": [
      {
        "id": "prod123",
        "name": "Premium Laptop",
        "totalSold": 25,
        "revenue": 30000
      }
    ],
    "recentSales": [
      {
        "id": "sale123",
        "saleNumber": "SALE-2024-001",
        "total": 1208,
        "customer": "John Customer",
        "createdAt": "2024-12-24T10:00:00.000Z"
      }
    ],
    "alerts": [
      {
        "type": "low_stock",
        "message": "5 products are running low on stock",
        "priority": "medium"
      }
    ]
  }
}
```

#### GET /api/dashboard/sales-chart
Get sales chart data.

**Permission Required:** `reports:read`

**Query Parameters:**
```
?period=month&year=2024&branch=branch1
```

#### GET /api/dashboard/inventory-stats
Get inventory statistics.

**Permission Required:** `reports:read`

---

### 📈 Reports

#### GET /api/reports/sales
Generate sales report.

**Permission Required:** `reports:read`

**Query Parameters:**
```
?startDate=2024-12-01&endDate=2024-12-31&format=pdf&branch=branch1&groupBy=day&includeDetails=true
```

#### GET /api/reports/inventory
Generate inventory report.

**Permission Required:** `reports:read`

#### GET /api/reports/financial
Generate financial report.

**Permission Required:** `reports:read`

#### GET /api/reports/custom
Generate custom report.

**Permission Required:** `reports:read`

#### POST /api/reports/email
Email report to recipient.

**Permission Required:** `reports:create`

**Request Body:**
```json
{
  "reportType": "sales",
  "period": {
    "startDate": "2024-12-01",
    "endDate": "2024-12-31"
  },
  "recipients": ["manager@inventory.com"],
  "format": "pdf",
  "includeCharts": true
}
```

---

### 🔔 Notifications & Alerts

#### GET /api/alerts
Get user alerts.

**Permission Required:** `reports:read`

#### POST /api/alerts/mark-read
Mark alerts as read.

**Permission Required:** `reports:read`

#### GET /api/notifications/settings
Get notification settings.

**Permission Required:** `reports:read`

#### PUT /api/notifications/settings
Update notification settings.

**Permission Required:** `reports:update`

---

### 🏢 Branch Management

#### GET /api/branches
Get all branches.

**Permission Required:** `branches:read`

#### POST /api/branches
Create new branch.

**Permission Required:** `branches:create`

#### PUT /api/branches/:id
Update branch.

**Permission Required:** `branches:update`

#### GET /api/branches/:id/inventory
Get branch inventory.

**Permission Required:** `products:read`

#### POST /api/transfers
Create stock transfer between branches.

**Permission Required:** `transfers:create`

#### GET /api/transfers
Get all transfers.

**Permission Required:** `transfers:read`

---

### ⚙️ System & Settings

#### GET /api/system/health
Health check endpoint (public).

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-24T10:00:00.000Z",
    "services": {
      "database": "connected",
      "cache": "connected",
      "email": "connected"
    },
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

#### GET /api/system/stats
Get system statistics.

**Permission Required:** `system:read`

#### POST /api/system/cache/clear
Clear system cache.

**Permission Required:** `system:update`

#### GET /api/settings
Get system settings.

**Permission Required:** `settings:read`

#### PUT /api/settings
Update system settings.

**Permission Required:** `settings:update`

---

### 📧 Email System

#### POST /api/email/test
Send test email.

**Permission Required:** `email:send`

#### GET /api/email/templates
Get email templates.

**Permission Required:** `email:read`

#### PUT /api/email/templates/:id
Update email template.

**Permission Required:** `email:update`

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-12-24T10:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Invalid Token
- `403` - Forbidden / Insufficient Permissions
- `404` - Not Found
- `409` - Conflict / Duplicate Resource
- `422` - Unprocessable Entity
- `429` - Too Many Requests / Rate Limited
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Authentication token required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting
- 100 requests per 15 minutes per IP
- 500 requests per hour for authenticated users
- Higher limits for premium accounts

## Pagination
Standard pagination parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction: asc/desc (default: desc)

## Caching
- Product listings cached for 5 minutes
- Dashboard data cached for 2 minutes  
- User permissions cached for 30 minutes
- Report data cached for 15 minutes

## WebSocket Events (Future)
- `inventory_update` - Real-time inventory changes
- `sale_completed` - New sale notifications
- `alert_created` - System alerts
- `user_activity` - User activity updates

---

**API Documentation**

*Last updated: December 24, 2024*
*Version: 1.0.0*
*Contact: support@inventory.com*
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "15m"
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Logout user and invalidate refresh token.

#### POST /api/auth/register
Register new user (Admin only).

### Products

#### GET /api/products
Get all products with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name, SKU, or barcode
- `category` (string): Filter by category ID
- `brand` (string): Filter by brand ID
- `branch` (string): Filter by branch ID
- `lowStock` (boolean): Filter low stock items
- `isActive` (boolean): Filter active/inactive products
- `sortBy` (string): Sort field (default: 'name')
- `sortOrder` (string): Sort order 'asc' or 'desc' (default: 'asc')

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10
    }
  }
}
```

#### POST /api/products
Create new product.

**Request Body:**
```json
{
  "name": "Product Name",
  "sku": "PROD001",
  "barcode": "1234567890123",
  "description": "Product description",
  "category": "category_id",
  "brand": "brand_id",
  "unit": "unit_id",
  "supplier": "supplier_id",
  "pricing": {
    "costPrice": 100.00,
    "sellingPrice": 150.00,
    "mrp": 160.00,
    "margin": 50.00
  },
  "branchStocks": [
    {
      "branchId": "branch_id",
      "quantity": 100,
      "reorderLevel": 10,
      "maxStockLevel": 500,
      "location": "A1-B2"
    }
  ],
  "taxSettings": {
    "gstRate": 18,
    "taxCategory": "standard"
  }
}
```

#### GET /api/products/:id
Get product by ID with populated references.

#### PUT /api/products/:id
Update product by ID.

#### DELETE /api/products/:id
Soft delete product (sets isActive to false).

#### GET /api/products/export
Export products to CSV.

**Query Parameters:**
- `branch` (string): Filter by branch ID
- `category` (string): Filter by category ID
- `format` (string): Export format (default: 'csv')

**Response:** Downloads CSV file

#### POST /api/products/import
Import products from CSV file.

**Request:** Multipart form data with CSV file
- `csvFile` (file): CSV file to import
- `branchId` (string): Target branch ID
- `updateExisting` (boolean): Update existing products

**Response:**
```json
{
  "success": true,
  "message": "CSV import completed",
  "data": {
    "success": [...],
    "errors": [...],
    "skipped": [...],
    "summary": {
      "total": 100,
      "created": 85,
      "updated": 10,
      "errors": 3,
      "skipped": 2
    }
  }
}
```

### Sales

#### POST /api/sales
Create new sale with automatic stock deduction.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john@example.com",
  "paymentMethod": "cash",
  "discountPercentage": 5,
  "taxPercentage": 18,
  "branchId": "branch_id",
  "notes": "Sale notes"
}
```

**Features:**
- Automatic stock validation and deduction
- MongoDB transactions for data consistency
- Prevents negative stock scenarios
- Audit logging

#### GET /api/sales
Get all sales with filtering and pagination.

#### GET /api/sales/:id
Get sale by ID with populated references.

### Inventory Management

#### POST /api/inventory/adjustments
Create stock adjustment.

#### GET /api/inventory/adjustments
Get stock adjustments history.

#### POST /api/inventory/transfers
Create stock transfer between branches.

#### GET /api/inventory/transfers
Get stock transfers history.

#### GET /api/inventory/low-stock
Get low stock alerts.

### Dashboard

#### GET /api/dashboard/overview
Get dashboard overview with key metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 500,
    "totalSales": 1250,
    "todaySales": 15000.00,
    "totalRevenue": 250000.00,
    "lowStockItems": [...],
    "topCategories": [...]
  }
}
```

#### GET /api/dashboard/sales-chart
Get sales chart data for specified period.

**Query Parameters:**
- `period` (string): '7days', '30days', '90days'

#### GET /api/dashboard/alerts
Get system alerts (low stock, expiring products, etc.).

### Reports

#### GET /api/reports/daily
Get daily sales report.

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format

#### GET /api/reports/sales
Get sales report for date range.

**Query Parameters:**
- `startDate` (string): Start date
- `endDate` (string): End date
- `branchId` (string): Optional branch filter

#### GET /api/reports/inventory
Get inventory report.

#### GET /api/reports/financial
Get financial report.

### Master Data

#### Categories
- `GET /api/master-data/categories` - Get all categories
- `POST /api/master-data/categories` - Create category
- `PUT /api/master-data/categories/:id` - Update category
- `DELETE /api/master-data/categories/:id` - Delete category

#### Brands
- `GET /api/master-data/brands` - Get all brands
- `POST /api/master-data/brands` - Create brand
- `PUT /api/master-data/brands/:id` - Update brand
- `DELETE /api/master-data/brands/:id` - Delete brand

#### Units
- `GET /api/master-data/units` - Get all units
- `POST /api/master-data/units` - Create unit
- `PUT /api/master-data/units/:id` - Update unit
- `DELETE /api/master-data/units/:id` - Delete unit

#### Suppliers
- `GET /api/master-data/suppliers` - Get all suppliers
- `POST /api/master-data/suppliers` - Create supplier
- `PUT /api/master-data/suppliers/:id` - Update supplier
- `DELETE /api/master-data/suppliers/:id` - Delete supplier

#### Branches
- `GET /api/master-data/branches` - Get all branches
- `POST /api/master-data/branches` - Create branch (Admin only)
- `PUT /api/master-data/branches/:id` - Update branch
- `DELETE /api/master-data/branches/:id` - Delete branch

### Financial

#### GET /api/financial/invoices
Get all invoices.

#### POST /api/financial/invoices
Create new invoice.

#### GET /api/financial/invoices/:id
Get invoice by ID.

#### POST /api/financial/invoices/:id/print
Get printable invoice data (A4/thermal).

#### POST /api/financial/bulk-invoice
Create bulk invoices.

### Security & Audit

#### GET /api/security/audit-logs
Get audit logs (Admin only).

#### GET /api/security/export/audit-logs
Export audit logs.

#### GET /api/security/dashboard
Get security dashboard metrics.

## Role-Based Access Control (RBAC)

### Roles
- **Admin**: Full system access
- **Manager**: Branch management, reports, user management
- **Cashier**: Sales operations, basic inventory view
- **Viewer**: Read-only access to assigned areas

### Permissions
Each role has specific permissions for different resources:
- `products.create/read/update/delete`
- `sales.create/read/update/delete`
- `inventory.create/read/update/delete`
- `reports.read/export`
- `users.create/read/update/delete`
- `masterData.*`
- `financial.*`
- `security.*`

## Data Models

### Key Models
- **User**: Authentication and authorization
- **Branch**: Multi-branch management
- **Product**: With per-branch stock tracking
- **Sale**: Transaction records with items
- **Category/Brand/Unit/Supplier**: Master data
- **Invoice**: Financial records
- **Transfer**: Inter-branch stock transfers
- **Adjustment**: Stock adjustments
- **AuditLog**: System activity tracking

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {...}
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

### Rate Limits by Role
- **Admin**: 1000 requests/hour
- **Manager**: 500 requests/hour
- **Cashier**: 200 requests/hour
- **POS Operations**: 100 requests/hour

## Features

### Security
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input sanitization and validation
- Helmet security headers
- Rate limiting
- Audit logging
- CORS configuration

### Performance
- MongoDB indexes optimization
- Redis caching with fallback
- Performance monitoring
- Database query optimization
- Compression middleware
- Connection pooling

### Multi-branch Support
- Per-branch inventory tracking
- Inter-branch transfers
- Branch-specific reports
- User-branch assignments

### Inventory Management
- Real-time stock tracking
- Low stock alerts
- Stock adjustments and transfers
- Barcode data entry and search
- Expiry date tracking

### Sales & Financial
- POS-ready sales API
- Automatic stock deduction
- Invoice generation
- Payment tracking
- Financial reports

### Reporting & Analytics
- Daily/monthly sales reports
- Inventory reports
- Financial reports
- Dashboard analytics
- Export capabilities (CSV, PDF)

## Development

### Installation
```bash
npm install
```

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run start:prod

# Seed database
npm run seed
```

### Testing
```bash
# Run tests
npm test

# Test coverage
npm run test:coverage
```

## API Documentation
- Swagger UI: `/api-docs`
- Health Check: `/health`
- Performance Metrics: `/metrics`

## Support
For technical support or questions about the API, please contact the development team.