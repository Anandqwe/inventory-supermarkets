# Supermarket Inventory & Sales Management System - Backend API

A comprehensive RESTful API for managing supermarket inventory, sales transactions, and business analytics built with Node.js, Express.js, and MongoDB.

## 🚀 Features

### Core Functionality
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Role-Based Access Control**: Admin, Manager, and Cashier roles
- **Product Management**: Complete CRUD operations with category management
- **Sales Processing**: Transaction handling with automatic stock deduction
- **Inventory Tracking**: Real-time stock levels with low-stock alerts
- **Dashboard Analytics**: Comprehensive business insights and reporting

### Technical Features
- **Production-Ready**: Comprehensive error handling and validation
- **Security First**: Rate limiting, CORS, helmet security headers
- **Indian Market Focus**: ₹ INR pricing, GST calculations, Indian categories
- **MongoDB Atlas**: Cloud database with connection pooling
- **Scalable Architecture**: Modular MVC structure with middleware patterns

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB Atlas account
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
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/supermarket-inventory
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
   JWT_EXPIRES_IN=24h
   ```

3. **Seed the database** (Optional)
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔗 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/login` | User login | Public |
| GET | `/profile` | Get user profile | Authenticated |
| PUT | `/profile` | Update profile | Authenticated |
| POST | `/change-password` | Change password | Authenticated |
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

### Sales (`/api/sales`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Create new sale | Authenticated |
| GET | `/` | List sales with filters | Authenticated |
| GET | `/:id` | Get sale by ID | Authenticated |
| GET | `/summary` | Sales analytics | Authenticated |
| GET | `/daily-report` | Daily sales report | Authenticated |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/overview` | Complete dashboard data | Authenticated |
| GET | `/sales-chart` | Sales chart data | Authenticated |
| GET | `/inventory-analytics` | Inventory insights | Authenticated |
| GET | `/alerts` | System alerts | Authenticated |

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

### Default Users (after seeding)
- **Admin**: `admin@supermarket.com` / `Admin@123456`
- **Manager**: `manager@supermarket.com` / `Manager@123456`  
- **Cashier**: `cashier@supermarket.com` / `Cashier@123456`

## 🚀 Deployment

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
   ```

3. **Environment Variables**
   Add all required environment variables in Render dashboard

4. **MongoDB Atlas**
   - Whitelist Render's IP: `0.0.0.0/0`
   - Update connection string in environment variables

## 📊 API Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

---

**Built with ❤️ for Indian supermarkets and retail businesses**
