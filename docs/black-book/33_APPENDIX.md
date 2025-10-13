# APPENDIX

## APPENDIX A: System Configuration Files

### A.1 Backend Environment Configuration (.env)

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory_db
DB_NAME=inventory_supermarket

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secure_refresh_token_secret_key_here
JWT_REFRESH_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=2h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Inventory System

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Redis Configuration (Optional for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

### A.2 Frontend Environment Configuration (.env)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Inventory Supermarkets
VITE_APP_VERSION=1.0.0
```

---

## APPENDIX B: Database Schema Details

### B.1 User Schema (Mongoose)

```javascript
{
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'manager', 'cashier', 'inventory_clerk'], default: 'cashier' },
  permissions: [{ type: String }],
  branch: { type: ObjectId, ref: 'Branch', required: true },
  phone: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### B.2 Product Schema

```javascript
{
  name: { type: String, required: true, trim: true },
  description: { type: String },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, unique: true, sparse: true },
  category: { type: ObjectId, ref: 'Category', required: true },
  brand: { type: ObjectId, ref: 'Brand' },
  unit: { type: ObjectId, ref: 'Unit', required: true },
  stocks: [{
    branch: { type: ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    maxStockLevel: { type: Number },
    lastUpdated: { type: Date, default: Date.now }
  }],
  price: { type: Number, required: true },
  cost: { type: Number },
  tax: { type: Number, default: 5 },
  expiryDate: { type: Date },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### B.3 Sale Schema

```javascript
{
  saleNumber: { type: String, required: true, unique: true },
  items: [{
    product: { type: ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    sku: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    tax: { type: Number },
    subtotal: { type: Number },
    total: { type: Number }
  }],
  customer: { type: ObjectId, ref: 'Customer' },
  branch: { type: ObjectId, ref: 'Branch', required: true },
  cashier: { type: ObjectId, ref: 'User', required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'netbanking'], required: true },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'refunded'], default: 'completed' },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

---

## APPENDIX C: API Endpoint Reference

### C.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/api/auth/login` | User login | No | - |
| POST | `/api/auth/register` | Register new user | Yes | Admin/Manager |
| POST | `/api/auth/logout` | User logout | Yes | - |
| GET | `/api/auth/profile` | Get current user | Yes | - |
| PUT | `/api/auth/profile` | Update user profile | Yes | - |
| POST | `/api/auth/change-password` | Change password | Yes | - |
| POST | `/api/auth/refresh-token` | Refresh JWT token | Yes | - |
| GET | `/api/auth/users` | Get all users | Yes | Admin/Manager |
| PATCH | `/api/auth/users/:userId/toggle-status` | Toggle user active status | Yes | Admin/Manager |

### C.2 Product Endpoints

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/products` | Get all products | Yes | products.read |
| GET | `/api/products/:id` | Get single product | Yes | products.read |
| POST | `/api/products` | Create product | Yes | products.create |
| PUT | `/api/products/:id` | Update product | Yes | products.update |
| DELETE | `/api/products/:id` | Delete product | Yes | products.delete |
| GET | `/api/products/search/:query` | Search products | Yes | products.read |
| GET | `/api/products/low-stock` | Get low stock items | Yes | products.read |
| GET | `/api/products/categories` | Get categories | Yes | products.read |
| POST | `/api/products/import` | Import products CSV | Yes | products.create |
| GET | `/api/products/export` | Export products CSV | Yes | products.export |
| POST | `/api/products/bulk` | Bulk create products | Yes | products.create |
| PATCH | `/api/products/:id/stock` | Update stock | Yes | inventory.update |

### C.3 Sales Endpoints

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/sales` | Get all sales | Yes | sales.read |
| GET | `/api/sales/:id` | Get single sale | Yes | sales.read |
| POST | `/api/sales` | Create sale | Yes | sales.create |
| PUT | `/api/sales/:id` | Update sale | Yes | sales.update |
| DELETE | `/api/sales/:id` | Delete sale | Yes | sales.delete |
| GET | `/api/sales/:id/receipt` | Get sale receipt | Yes | sales.read |
| POST | `/api/sales/process` | Process sale transaction | Yes | sales.create |

### C.4 Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/overview` | Get dashboard overview | Yes |
| GET | `/api/dashboard/stats` | Get dashboard statistics | Yes |
| GET | `/api/dashboard/sales-trend` | Get sales trend data | Yes |
| GET | `/api/dashboard/top-products` | Get top selling products | Yes |

### C.5 Reports Endpoints

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/reports/sales` | Sales report | Yes | reports.read |
| GET | `/api/reports/inventory` | Inventory report | Yes | reports.read |
| GET | `/api/reports/financial` | Financial report | Yes | reports.read |
| GET | `/api/reports/export` | Export report | Yes | reports.export |

### C.6 Inventory Endpoints

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/inventory/adjustments` | Get stock adjustments | Yes | inventory.read |
| POST | `/api/inventory/adjustments` | Create adjustment | Yes | inventory.create |
| GET | `/api/inventory/transfers` | Get stock transfers | Yes | inventory.read |
| POST | `/api/inventory/transfers` | Create transfer | Yes | inventory.create |
| PUT | `/api/inventory/transfers/:id` | Update transfer | Yes | inventory.update |

---

## APPENDIX D: Sample API Requests and Responses

### D.1 User Login Request/Response

**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "admin@supermarket.com",
  "password": "Admin@123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j1",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@supermarket.com",
      "role": "admin",
      "branch": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j2",
        "name": "Main Branch - Delhi"
      },
      "permissions": ["view_products", "manage_products", "make_sales"]
    }
  },
  "timestamp": "2025-10-13T10:30:45.123Z"
}
```

### D.2 Create Product Request/Response

**Request:**
```http
POST /api/products HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Amul Taaza Milk 1L",
  "sku": "MILK-AMUL-1L-001",
  "barcode": "8901430100123",
  "category": "6501a2b3c4d5e6f7g8h9i0j3",
  "brand": "6501a2b3c4d5e6f7g8h9i0j4",
  "unit": "6501a2b3c4d5e6f7g8h9i0j5",
  "price": 48.00,
  "cost": 42.00,
  "tax": 5,
  "stocks": [
    {
      "branch": "6501a2b3c4d5e6f7g8h9i0j2",
      "quantity": 150,
      "reorderLevel": 30
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "6501a2b3c4d5e6f7g8h9i0j6",
    "name": "Amul Taaza Milk 1L",
    "sku": "MILK-AMUL-1L-001",
    "price": 48.00,
    "margin": 12.50
  },
  "timestamp": "2025-10-13T10:35:22.456Z"
}
```

---

## APPENDIX E: Installation and Setup Guide

### E.1 Prerequisites

**System Requirements:**
- Operating System: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- RAM: Minimum 4GB, Recommended 8GB+
- Disk Space: Minimum 2GB free space
- Internet Connection: Required for cloud services

**Software Requirements:**
- Node.js v18 LTS or higher
- npm v9 or higher (comes with Node.js)
- Git v2.30 or higher
- MongoDB Compass (optional, for database management)
- VS Code or preferred IDE

### E.2 Backend Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/inventory-supermarkets.git
cd inventory-supermarkets

# 2. Navigate to backend directory
cd backend

# 3. Install dependencies
npm install

# 4. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 5. Run database seed (optional)
npm run seed:master

# 6. Start development server
npm run dev

# Server will start at http://localhost:5000
```

### E.3 Frontend Setup Steps

```bash
# 1. Navigate to frontend directory (from project root)
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with backend API URL

# 4. Start development server
npm run dev

# Application will start at http://localhost:5173
```

### E.4 Production Deployment

```bash
# Backend Production Build
cd backend
npm run build
npm start

# Frontend Production Build
cd frontend
npm run build
# Deploy 'dist' folder to hosting service

# Recommended Hosting:
# - Backend: Heroku, AWS EC2, Azure App Service
# - Frontend: Vercel, Netlify, AWS S3 + CloudFront
# - Database: MongoDB Atlas (already cloud-based)
# - Cache: Redis Cloud (already cloud-based)
```

---

## APPENDIX F: Testing Commands

### F.1 Backend Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run tests in watch mode
npm test -- --watch

# Run CI-friendly tests
npm run test:ci
```

### F.2 Frontend Testing (if implemented)

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## APPENDIX G: Common Commands Reference

### G.1 Backend Commands

```bash
# Development
npm run dev              # Start dev server with nodemon
npm run dev:debug        # Start dev server with debug logs
npm start               # Start production server
npm run start:prod      # Start production with NODE_ENV=production

# Database Seeding
npm run seed            # Alias for seed:master
npm run seed:master     # Run comprehensive master seed script
npm run seed:branches   # Seed Mumbai branch data
npm run seed:users      # Seed enhanced user accounts
npm run seed:products   # Seed realistic product catalog
npm run seed:customers  # Seed segmented customers
npm run seed:inventory  # Seed distributed inventory
npm run seed:sales      # Seed consistent sales data
npm run validate:data   # Validate seeded data integrity

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run with coverage report
npm run test:ci        # CI-friendly test run
npm run test:rbac      # Test RBAC functionality

# Linting and Formatting
npm run lint           # Check for lint errors
npm run lint:fix       # Auto-fix lint errors
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting

# Maintenance
npm run clean:categories    # Remove duplicate categories
npm run migrate:permissions # Migrate user permissions
```

### G.2 Frontend Commands

```bash
# Development
npm run dev            # Start Vite dev server (port 5173)
npm run build          # Production build with optimizations
npm run preview        # Preview production build

# Linting and Formatting
npm run lint           # Check for lint errors
npm run lint:fix       # Auto-fix lint errors
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

---

## APPENDIX H: Error Codes and Troubleshooting

### H.1 Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| AUTH_001 | Invalid credentials | Check email and password |
| AUTH_002 | Account locked | Wait or contact admin |
| AUTH_003 | Token expired | Re-login to get new token |
| PROD_001 | Product not found | Verify product ID |
| PROD_002 | Duplicate SKU | Use unique SKU |
| SALE_001 | Insufficient stock | Check product availability |
| SALE_002 | Invalid payment method | Use: cash, card, upi |
| DB_001 | Database connection failed | Check MongoDB URI |
| CACHE_001 | Redis connection failed | Check Redis URL |

### H.2 Common Issues and Solutions

**Issue: Port 5000 already in use**
```bash
# Solution 1: Kill process using port
npx kill-port 5000

# Solution 2: Change port in .env
PORT=5001
```

**Issue: MongoDB connection timeout**
```bash
# Check network connectivity
# Verify MongoDB Atlas IP whitelist
# Check MONGODB_URI in .env
# Ensure MongoDB cluster is running
```

**Issue: JWT token verification failed**
```bash
# Clear browser localStorage
localStorage.clear()

# Verify JWT_SECRET matches between requests
# Check token expiration time
```

---

## APPENDIX I: User Roles and Permissions Matrix

### I.1 Complete Permissions Matrix

| Feature | Admin | Manager | Cashier | Inventory Clerk |
|---------|-------|---------|---------|-----------------|
| **Dashboard** |
| View dashboard | ✓ | ✓ | ✓ | ✓ |
| View all branches | ✓ | ✓ | ✗ | ✗ |
| **Products** |
| View products | ✓ | ✓ | ✓ | ✓ |
| Create products | ✓ | ✓ | ✗ | ✓ |
| Edit products | ✓ | ✓ | ✗ | ✓ |
| Delete products | ✓ | ✓ | ✗ | ✗ |
| Import/Export | ✓ | ✓ | ✗ | ✓ |
| **Sales** |
| View sales | ✓ | ✓ | ✓ | ✗ |
| Make sales | ✓ | ✓ | ✓ | ✗ |
| Cancel sales | ✓ | ✓ | ✗ | ✗ |
| View receipts | ✓ | ✓ | ✓ | ✗ |
| **Inventory** |
| View inventory | ✓ | ✓ | ✓ | ✓ |
| Adjust stock | ✓ | ✓ | ✗ | ✓ |
| Transfer stock | ✓ | ✓ | ✗ | ✓ |
| View alerts | ✓ | ✓ | ✗ | ✓ |
| **Reports** |
| View reports | ✓ | ✓ | ✗ | ✗ |
| Generate reports | ✓ | ✓ | ✗ | ✗ |
| Export reports | ✓ | ✓ | ✗ | ✗ |
| **Users** |
| View users | ✓ | ✓ | ✗ | ✗ |
| Create users | ✓ | ✓ | ✗ | ✗ |
| Edit users | ✓ | ✓ | ✗ | ✗ |
| Delete users | ✓ | ✗ | ✗ | ✗ |
| **Settings** |
| View settings | ✓ | ✓ | ✗ | ✗ |
| Edit settings | ✓ | ✗ | ✗ | ✗ |
| System config | ✓ | ✗ | ✗ | ✗ |

---

## APPENDIX J: Glossary of Terms

**API (Application Programming Interface)**: Interface for communication between software components

**Authentication**: Process of verifying user identity

**Authorization**: Process of determining user permissions

**Bcrypt**: Password hashing algorithm for security

**CORS (Cross-Origin Resource Sharing)**: Security feature controlling resource access

**CRUD**: Create, Read, Update, Delete operations

**JWT (JSON Web Token)**: Token-based authentication standard

**Middleware**: Software that connects different applications or services

**MongoDB**: NoSQL document database

**Node.js**: JavaScript runtime for server-side applications

**NPM**: Node Package Manager for JavaScript

**ODM (Object Document Mapper)**: Mongoose for MongoDB

**PWA (Progressive Web App)**: Web app with native app features

**React**: JavaScript library for building user interfaces

**Redis**: In-memory data structure store used for caching

**RESTful API**: Architectural style for web services

**SKU (Stock Keeping Unit)**: Unique product identifier

**TLS/SSL**: Security protocols for encrypted communication

**UUID**: Universally Unique Identifier

---

## APPENDIX K: Seed Data Summary

### K.1 Default User Accounts

All users have the default password: **`Mumbai@123456`**

| Email | Role | Branch |
|-------|------|--------|
| admin@mumbaisupermart.com | Admin | All Branches |
| regional.manager@mumbaisupermart.com | Regional Manager | All Branches |
| manager.andheri@mumbaisupermart.com | Store Manager | Andheri West |
| manager.vileparle@mumbaisupermart.com | Store Manager | Vile Parle East |
| manager.bandra@mumbaisupermart.com | Store Manager | Bandra West |
| inventory.andheri@mumbaisupermart.com | Inventory Manager | Andheri West |
| cashier1.andheri@mumbaisupermart.com | Cashier | Andheri West |
| auditor@mumbaisupermart.com | Viewer | All Branches |

### K.2 Branch Locations

| Branch Name | Code | Type | Area | Address |
|-------------|------|------|------|---------|
| Mumbai Supermart - Andheri West | AW001 | Flagship | 3,000 sq ft | Link Road, Near Infinity Mall |
| Mumbai Supermart - Vile Parle East | VP002 | Express | 1,500 sq ft | Nehru Road, Opposite Railway Station |
| Mumbai Supermart - Bandra West | BW003 | Premium | 2,500 sq ft | Turner Road, Near Bandra Bandstand |

### K.3 Seeded Data Statistics

- **Branches**: 3 Mumbai locations (Flagship, Express, Premium stores)
- **Users**: 18 users across 6 roles (Admin, Regional Manager, Store Manager, Inventory Manager, Cashier, Viewer)
- **Categories**: 15 Indian retail categories
- **Brands**: 40+ Indian brands (Amul, Britannia, Tata, Nestle, Parle, etc.)
- **Units**: 10 measurement units (kg, L, pcs, box, etc.)
- **Products**: 587 realistic Indian products with GST rates
- **Customers**: 500 segmented customers in 4 tiers (Platinum, Gold, Silver, Bronze)
- **Inventory**: ₹81 Lakh distributed across branches
- **Sales**: 1,750 transactions over last 90 days
- **Payment Methods**: Cash, Card, UPI

### K.4 Master Seed Script Execution Order

1. **Branches** → `seedBranchesMumbai.js` (3 Mumbai branches)
2. **Users** → `seedUsersEnhanced.js` (18 users with roles)
3. **Products** → `seedProductsRealistic.js` (587 products with GST)
4. **Customers** → `seedCustomersSegmented.js` (500 tiered customers)
5. **Inventory** → `seedInventoryDistributed.js` (₹81L stock value)
6. **Sales** → `seedSalesConsistent.js` (1,750 transactions)
7. **Date Update** → `updateSalesDatesRaw.js` (Align dates to today)

**Command**: `npm run seed` or `npm run seed:master`

---

## APPENDIX L: Project File Structure

```
inventory-supermarkets/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── scripts/             # Seed and utility scripts
│   ├── tests/               # Test files
│   ├── logs/                # Log files
│   ├── uploads/             # Uploaded files
│   ├── app.js              # Express app
│   └── package.json        # Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # UI components
│   │   │   └── shell/      # Layout components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/              # Static assets
│   └── package.json        # Dependencies
├── docs/                    # Documentation
│   ├── black-book/         # Academic documentation
│   └── owner-manual/       # User manuals
└── shared/                  # Shared code
    ├── permissions.js      # Permission constants
    └── types/              # TypeScript types
```

---

**Note**: All appendices should be formatted in Times New Roman font, size 12, when converting to Word. Code blocks should use Courier New font, size 10, as specified in the formatting guide.
