# Inventory Management System API Documentation

## Overview
A comprehensive inventory management system for supermarkets with multi-branch support, featuring JWT authentication, RBAC, real-time inventory tracking, sales management, and comprehensive reporting.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://api.inventorymanagement.com`

## Authentication
All API endpoints require JWT authentication except for login and health check endpoints.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### Authentication & Authorization

#### POST /api/auth/login
Login user and get JWT tokens.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "permissions": {...},
      "branch": "branch_id",
      "isActive": true,
      "lastLogin": "2023-11-01T10:00:00.000Z"
    },
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
- Barcode support
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