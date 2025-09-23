# 🏪 Supermarket Inventory & Sales Management System

A comprehensive, production-ready inventory and sales management solution designed specifically for supermarkets and retail businesses. Built with modern technologies including React, Node.js, MongoDB Atlas, Redis Cloud, and professional email integration.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![Redis](https://img.shields.io/badge/Redis-Cloud-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

</div>

## 🌟 Features Overview

### 🔐 Authentication & Security
- **JWT Authentication** with access & refresh tokens (24h/7d expiry)
- **Role-Based Access Control** (Admin, Manager, Cashier, Viewer)
- **Password Security** with bcrypt hashing and strength validation
- **Rate Limiting** (100 req/15min) and advanced security headers
- **Input Sanitization** and XSS prevention

### 📦 Product Management
- **Complete CRUD Operations** with advanced search and filtering
- **Category & Brand Management** with hierarchical organization
- **Stock Tracking** with real-time updates and automated alerts
- **Barcode Support** and SKU management
- **Bulk Operations** for efficient inventory management
- **Expiry Date Tracking** for perishable items

### 💰 Sales & Transactions
- **Point-of-Sale Interface** with intuitive transaction processing
- **Multiple Payment Methods** (Cash, Card, UPI, Digital Wallets)
- **Automatic Stock Deduction** and real-time inventory updates
- **Customer Management** with purchase history
- **Receipt Generation** and transaction logging
- **Return & Refund Processing**

### 📊 Analytics & Reporting
- **Real-time Dashboard** with key business metrics
- **Sales Analytics** with trend analysis and forecasting
- **Inventory Reports** with stock levels and movement tracking
- **Financial Reports** including profit/loss and tax summaries
- **PDF Report Generation** with professional formatting
- **Email Report Delivery** with automated scheduling

### 📧 Communication System
- **Professional Email Templates** for all notifications
- **Automated Low Stock Alerts** with customizable thresholds
- **Password Reset Emails** with secure token handling
- **Report Delivery** via email with attachment support
- **Gmail SMTP Integration** with App Password security

### ⚡ Performance & Scalability
- **Redis Cloud Caching** with intelligent fallback to in-memory cache
- **Database Optimization** with connection pooling and indexing
- **API Response Caching** for frequently accessed data
- **Lazy Loading** and code splitting for optimal frontend performance
- **Health Monitoring** with comprehensive system checks

### 🏢 Multi-Branch Support
- **Branch Management** with hierarchical organization
- **Inter-Branch Transfers** with approval workflows
- **Branch-Specific Inventory** and sales tracking
- **Centralized Reporting** across all locations
- **Role-Based Branch Access** control

## �️ Technology Stack

### Frontend
- **React 18** - Modern component-based UI library with hooks
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React Router** - Declarative client-side routing
- **Lucide React** - Beautiful, customizable icon library
- **Axios** - Promise-based HTTP client with interceptors
- **Chart.js** - Flexible data visualization and charting
- **React Hook Form** - Performant forms with easy validation

### Backend
- **Node.js 18+** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Mongoose** - Elegant MongoDB object modeling
- **Redis Cloud** - High-performance in-memory caching
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing and security
- **Nodemailer** - Email sending functionality
- **Winston** - Versatile logging library
- **Joi** - Object schema validation

### Cloud Services
- **MongoDB Atlas** - Database hosting and management
- **Redis Cloud** - Managed Redis caching service
- **Gmail SMTP** - Reliable email delivery
- **Render** - Backend application hosting
- **Vercel** - Frontend deployment and CDN

### Development Tools
- **ESLint** - JavaScript linting and code quality
- **Prettier** - Opinionated code formatting
- **Husky** - Git hooks for quality gates
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion testing

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- MongoDB Atlas account
- Redis Cloud account (optional but recommended)
- Gmail account with App Password

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anandqwe/inventory-supermarkets.git
   cd inventory-supermarkets
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure API URL
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## ⚙️ Environment Configuration

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory

# Redis Cache (Optional)
REDIS_URL=redis://username:password@host:port

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Inventory Management
VITE_APP_VERSION=1.0.0
```

## 📱 Application Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Real-time business metrics and analytics*

### Product Management
![Products](docs/screenshots/products.png)
*Comprehensive product catalog with search and filters*

### Sales Interface
![Sales](docs/screenshots/sales.png)
*Intuitive point-of-sale transaction processing*

### Reports
![Reports](docs/screenshots/reports.png)
*Professional PDF reports with charts and analytics*

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        Components[Reusable Components]
        Store[State Management]
    end
    
    subgraph "Backend (Node.js)"
        API[Express API]
        Auth[JWT Authentication]
        Controllers[Business Logic]
        Middleware[Security & Validation]
    end
    
    subgraph "Data Layer"
        MongoDB[(MongoDB Atlas)]
        Redis[(Redis Cloud)]
        Files[File Storage]
    end
    
    subgraph "External Services"
        Email[Gmail SMTP]
        PDF[PDF Generation]
    end
    
    UI --> API
    API --> Auth
    Auth --> Controllers
    Controllers --> MongoDB
    Controllers --> Redis
    API --> Email
    Controllers --> PDF
    API --> Files
```

## � API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Product Management
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/adjust-stock` - Adjust stock levels

### Sales Operations
- `GET /api/sales` - List sales transactions
- `POST /api/sales` - Process new sale
- `GET /api/sales/:id` - Get sale details
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Void sale

### Analytics & Reports
- `GET /api/dashboard/overview` - Dashboard metrics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `POST /api/reports/email` - Email report delivery

For complete API documentation, visit: [API Docs](backend/docs/API.md)

## 👥 User Roles & Permissions

| Feature | Admin | Manager | Cashier | Viewer |
|---------|-------|---------|---------|--------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Product Management | ✅ | ✅ | 👁️ | 👁️ |
| Sales Processing | ✅ | ✅ | ✅ | 👁️ |
| Inventory Reports | ✅ | ✅ | 👁️ | 👁️ |
| Financial Reports | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| Email Notifications | ✅ | ✅ | ❌ | ❌ |

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment (Render)**
   ```bash
   # Build the application
   npm run build
   
   # Deploy to Render
   # Set environment variables in Render dashboard
   ```

2. **Frontend Deployment (Vercel)**
   ```bash
   # Build the application
   npm run build
   
   # Deploy to Vercel
   vercel --prod
   ```

3. **Database Setup**
   - MongoDB Atlas cluster configuration
   - Redis Cloud instance setup
   - Network access and security rules

### Environment Variables for Production
Ensure all production environment variables are configured:
- Database connection strings
- Redis cache URLs
- Email service credentials
- JWT secrets (use strong, unique keys)
- CORS origins for your domain

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run component tests
npm run test:e2e          # End-to-end tests
```

## 📈 Performance Optimization

### Caching Strategy
- **Redis Cloud**: Primary cache for API responses and session data
- **Browser Cache**: Static assets and API responses
- **Database Indexing**: Optimized queries for fast data retrieval

### Frontend Optimization
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Compressed images and lazy loading
- **Bundle Analysis**: Webpack bundle optimization

### Backend Optimization
- **Connection Pooling**: MongoDB connection optimization
- **Query Optimization**: Efficient database queries
- **Compression**: Gzip compression for API responses

## 🔒 Security Features

### Authentication Security
- JWT tokens with secure expiration
- Refresh token rotation
- Password strength requirements
- Account lockout protection

### API Security
- Rate limiting (100 requests/15 minutes)
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)
- SQL injection prevention

### Data Protection
- Password hashing with bcrypt
- Sensitive data encryption
- Audit logging for all operations
- Regular security updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint rules for code quality
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Email**: support@inventory.com
- **Documentation**: [Setup Guide](docs/SETUP.md) | [Architecture](docs/ARCHITECTURE.md)
- **Issues**: [GitHub Issues](https://github.com/Anandqwe/inventory-supermarkets/issues)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - Runtime environment
- [MongoDB](https://www.mongodb.com/) - Database
- [Redis](https://redis.io/) - Caching layer
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

<div align="center">

**Built with ❤️ for modern retail businesses**

*Last updated: September 23, 2025*

</div>
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