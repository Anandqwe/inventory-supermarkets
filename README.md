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
- **Advanced Role-Based Access Control (RBAC)** with 6 hierarchical roles:
  - **Admin**: Full system access across all branches
  - **Regional Manager**: Multi-branch oversight and management
  - **Store Manager**: Complete control of assigned branch
  - **Inventory Manager**: Stock control and purchase management
  - **Cashier**: Sales operations only
  - **Viewer**: Read-only access for auditing
- **Granular Permissions System** with 50+ individual permissions
- **Per-Branch Access Control** with automatic data filtering
- **Password Security** with bcrypt hashing (12 rounds) and strength validation
- **Rate Limiting** (100 req/15min general, 5 req/15min auth) with IP tracking
- **Input Sanitization** and XSS prevention on all endpoints
- **Account Security** with login attempt tracking and auto-lockout (5 attempts)

### 📦 Product Management
- **Complete CRUD Operations** with advanced search and filtering
- **Category & Brand Management** with hierarchical organization
- **Stock Tracking** with real-time updates and automated alerts
- **Barcode Data Support** and SKU management
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

## System Architecture

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

For complete API documentation, visit the Swagger UI at: http://localhost:5000/api-docs

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