# Supermarket Inventory & Sales Management System - Backend API

A comprehensive RESTful API for managing supermarket inventory, sales transactions, and business analytics built with Node.js, Express.js, MongoDB, and Redis Cloud integration.

## 🚀 Features

### Core Functionality
- **Secure Authentication**: JWT-based auth with refresh tokens and bcrypt password hashing
- **Role-Based Access Control**: Admin, Manager, Cashier, and Viewer roles
- **Product Management**: Complete CRUD operations with category and brand management
- **Sales Processing**: Transaction handling with automatic stock deduction
- **Inventory Tracking**: Real-time stock levels with automated low-stock alerts
- **Dashboard Analytics**: Comprehensive business insights and reporting

### Advanced Features
- **Email System**: Professional email notifications and automated alerts
- **Caching Layer**: Redis Cloud integration with intelligent fallback
- **Performance Optimization**: Database connection pooling and query optimization
- **Security**: Rate limiting, CORS, helmet headers, input validation
- **Monitoring**: Health checks, error logging, and performance tracking

### Technical Features
- **Production-Ready**: Comprehensive error handling and validation
- **Security First**: Rate limiting, CORS, helmet security headers
- **Indian Market Focus**: ₹ INR pricing, GST calculations, Indian categories
- **MongoDB Atlas**: Cloud database with connection pooling
- **Redis Cloud**: High-performance caching with fallback
- **Scalable Architecture**: Modular MVC structure with middleware patterns

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB Atlas account
- Redis Cloud account (optional but recommended)
- Gmail account with App Password (for email features)
- npm or yarn package manager

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/supermarket-inventory
   
   # JWT Configuration
   JWT_SECRET=your-super-secure-jwt-secret-key-minimum-64-characters-long
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-minimum-64-characters
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email Configuration (Gmail SMTP)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   EMAIL_FROM=Supermarket Inventory System <your-email@gmail.com>
   
   # Redis Cloud Configuration (Optional but recommended)
   REDIS_ENABLED=true
   REDIS_HOST=your-redis-cloud-host
   REDIS_PORT=12067
   REDIS_USERNAME=default
   REDIS_PASSWORD=your-redis-password
   REDIS_DB=0
   
   # Security Configuration
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX_REQUESTS=5
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. **Database Setup**
   ```bash
   # Create database indexes (optional)
   npm run db:indexes
   
   # Seed the database with sample data (optional)
   npm run seed
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Available Scripts

- **`npm start`** - Start production server
- **`npm run dev`** - Start development server with nodemon
- **`npm test`** - Run test suite
- **`npm run test:coverage`** - Run tests with coverage report
- **`npm run seed`** - Seed database with sample data
- **`npm run db:indexes`** - Create database indexes
- **`npm run cache:clear`** - Clear application cache
- **`npm run perf:check`** - Run performance checks
- **`npm run lint`** - Run ESLint
- **`npm run format`** - Format code with Prettier

## 🔗 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/login` | User login | Public |
| POST | `/refresh-token` | Refresh JWT token | Public |
| GET | `/profile` | Get user profile | Authenticated |
| PUT | `/profile` | Update profile | Authenticated |
| POST | `/change-password` | Change password | Authenticated |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |
| POST | `/register` | Register new user | Manager+ |
| GET | `/users` | List all users | Manager+ |

### Products (`/api/products`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | List products with filters | Authenticated |
| POST | `/` | Create new product | Manager+ |
| GET | `/:id` | Get product by ID | Authenticated |
| PUT | `/:id` | Update product | Manager+ |
| DELETE | `/:id` | Delete product | Manager+ |
| GET | `/search/:query` | Search by barcode/SKU | Authenticated |
| GET | `/low-stock` | Low stock products | Authenticated |
| GET | `/categories` | List categories | Authenticated |
| GET | `/brands` | List brands | Authenticated |

### Sales (`/api/sales`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Create new sale | Authenticated |
| GET | `/` | List sales with filters | Authenticated |
| GET | `/:id` | Get sale by ID | Authenticated |
| PUT | `/:id` | Update sale | Manager+ |
| DELETE | `/:id` | Delete sale | Admin |
| GET | `/summary` | Sales analytics | Authenticated |
| GET | `/daily-report` | Daily sales report | Authenticated |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/overview` | Complete dashboard data | Authenticated |
| GET | `/sales-chart` | Sales chart data | Authenticated |
| GET | `/inventory-analytics` | Inventory insights | Authenticated |
| GET | `/alerts` | System alerts | Authenticated |
| GET | `/performance` | Performance metrics | Manager+ |

### Email System (`/api/email`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/status` | Email service status | Authenticated |
| POST | `/test` | Send test email | Admin |
| POST | `/send-test` | Send test to specific email | Admin |
| POST | `/password-reset` | Send password reset email | Admin |
| POST | `/low-stock-alert` | Send low stock alert | Manager+ |
| POST | `/send-report` | Email report | Manager+ |

### Health & Monitoring
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/health` | System health check | Public |
| GET | `/api/cache/stats` | Cache statistics | Admin |
| GET | `/api/cache/health` | Cache health check | Admin |
## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication with refresh token support. Include the token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

### Token Management
- **Access Token**: Expires in 24 hours
- **Refresh Token**: Expires in 7 days
- **Automatic Refresh**: Frontend can automatically refresh tokens

### Default Users (after seeding)
- **Admin**: `admin@supermarket.com` / `Admin@123456`
- **Manager**: `manager@supermarket.com` / `Manager@123456`  
- **Cashier**: `cashier@supermarket.com` / `Cashier@123456`
- **Viewer**: `viewer@supermarket.com` / `Viewer@123456`

### Role Permissions
- **Admin**: Full system access, user management, system configuration
- **Manager**: Product management, sales, reports, inventory management
- **Cashier**: Sales transactions, product lookup, basic inventory view
- **Viewer**: Read-only access to products and basic reports

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inventory
JWT_SECRET=production-jwt-secret-64-characters-minimum
JWT_REFRESH_SECRET=production-refresh-secret-64-characters-minimum
EMAIL_SERVICE=gmail
EMAIL_USER=production-email@gmail.com
EMAIL_PASSWORD=production-app-password
REDIS_ENABLED=true
REDIS_HOST=production-redis-host
REDIS_PORT=12067
REDIS_USERNAME=default
REDIS_PASSWORD=production-redis-password
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Render Deployment

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Configure Web Service**
   ```yaml
   Name: supermarket-inventory-api
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free (for development)
   ```

3. **Environment Variables**
   Add all required environment variables in Render dashboard

4. **MongoDB Atlas**
   - Whitelist Render's IP: `0.0.0.0/0`
   - Update connection string in environment variables

5. **Redis Cloud Setup**
   - Create free Redis Cloud account
   - Get connection details
   - Add to environment variables

### Railway Deployment

1. **Connect Repository**
   - Import from GitHub
   - Select Node.js template

2. **Configure Environment**
   - Add all environment variables
   - Set start command: `npm start`

3. **Deploy**
   - Automatic deployment on git push
   - Custom domain available

## 📊 API Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2023-09-23T10:30:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR", // Error code
  "details": { /* additional error details */ },
  "timestamp": "2023-09-23T10:30:00.000Z"
}
```

### Pagination Response
```javascript
{
  "success": true,
  "data": { /* array of items */ },
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2023-09-23T10:30:00.000Z"
}
```

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   │   ├── database.js # MongoDB connection
│   │   ├── cache.js    # Redis configuration
│   │   └── swagger.js  # API documentation
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
├── scripts/            # Database and utility scripts
├── tests/              # Test files
├── uploads/            # File uploads directory
├── app.js              # Main application file
└── package.json        # Dependencies and scripts
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/auth.test.js

# Watch mode for development
npm run test:watch
```

### API Documentation
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`
- **API Base**: `http://localhost:5000/api/`

## 🛡️ Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Headers**: Security headers for production
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Mongoose parameterized queries
- **XSS Protection**: Input sanitization
- **JWT Security**: Secure token implementation

## 📈 Performance Features

- **Redis Caching**: High-performance data caching
- **Database Optimization**: Indexed queries and aggregations
- **Response Compression**: Gzip compression for responses
- **Connection Pooling**: Efficient database connections
- **Background Tasks**: Non-blocking inventory monitoring
- **Error Handling**: Comprehensive error management

---

**Built with ❤️ for modern supermarket management systems**

*Last updated: September 23, 2025*