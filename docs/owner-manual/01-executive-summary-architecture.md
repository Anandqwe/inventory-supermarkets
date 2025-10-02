# Part 1: Executive Summary & Architecture

## Executive Summary

### What the App Does

The **Supermarket Inventory & Sales Management System** is a comprehensive full-stack web application designed specifically for Indian retail businesses. It manages the complete lifecycle of supermarket operations from product catalog management to point-of-sale transactions, inventory tracking, and business analytics.

**Core Business Flows:**
- **Products** → Create/manage product catalog with SKU, barcode, pricing
- **Sales** → Process POS transactions with automatic stock deduction  
- **Stock** → Real-time inventory tracking with low-stock alerts
- **Reports** → Generate PDF/CSV reports with business analytics

### Who Uses It

| Role | Access Level | Key Functions |
|------|-------------|---------------|
| **Admin** | Full system access | User management, system settings, all reports |
| **Manager** | Operations oversight | Product management, inventory, financial reports |
| **Cashier** | Transaction focused | POS sales, basic inventory viewing |
| **Viewer** | Read-only access | Dashboard viewing, basic reports |

### What's Implemented vs. Coming Later

**✅ Fully Implemented (90%+):**
- JWT authentication with role-based access control
- Complete product CRUD with categories/brands/units
- Point-of-sale interface with real-time stock deduction
- Multi-branch inventory tracking with low-stock monitoring
- Dashboard analytics with charts and KPIs
- PDF report generation and email delivery
- Comprehensive audit logging
- Indian market features (₹ INR pricing, product categories)

**🔄 Partially Implemented:**
- GST calculations (structure present, needs tax rate mapping)
- Advanced filtering and search
- Barcode scanning integration
- CSV import/export functionality

**📋 Planned Features:**
- Supplier management and purchase orders
- Return/refund processing
- Loyalty program integration
- Advanced discount systems
- Offline POS capability

### Domain Context: How Supermarket Inventory Systems Work

Indian supermarket inventory systems are complex due to:
- **Multi-branch operations** with centralized management
- **GST compliance** requiring CGST/SGST (intrastate) vs IGST (interstate) calculations
- **Diverse product categories** from packaged goods to fresh produce
- **High-volume transactions** requiring real-time stock updates
- **Regulatory requirements** for audit trails and tax reporting

The system handles these by maintaining per-branch stock levels, comprehensive transaction logging, and automated tax calculations based on product categories and customer location.

---

## Architecture Overview

### High-Level System Diagram

```mermaid
graph TB
    subgraph "Frontend Layer (Port 5173)"
        UI[React UI Components]
        Router[React Router]
        Store[Context + React Query]
        Auth[Auth Context]
    end
    
    subgraph "API Layer (Port 5000)"
        Express[Express.js Server]
        Middleware[JWT + CORS + Rate Limiting]
        Routes[API Routes]
        Controllers[Business Logic]
    end
    
    subgraph "Data Layer"
        MongoDB[(MongoDB Atlas)]
        Redis[(Redis Cloud Cache)]
        Files[File Storage]
    end
    
    subgraph "External Services"
        Email[Gmail SMTP]
        PDF[PDF Generation]
    end
    
    UI --> |Axios + JWT Bearer| Express
    Express --> Middleware
    Middleware --> Routes
    Routes --> Controllers
    Controllers --> MongoDB
    Controllers --> Redis
    Controllers --> Email
    Controllers --> PDF
    
    Auth --> |localStorage| UI
    Store --> |React Query| UI
```

### Communication Flow

**Frontend ↔ Backend:**
- **Axios instance** (`frontend/src/utils/api.js`) with base URL from `VITE_API_BASE_URL`
- **JWT Authentication** via `Authorization: Bearer {token}` headers
- **Consistent API responses** with `{success, message, data, timestamp}` structure

**Backend ↔ Database:**
- **Mongoose ODM** with schema validation and middleware hooks
- **Connection pooling** via MongoDB Atlas connection string
- **Redis caching** for frequently accessed data with Node Cache fallback

### Environment Variables & Configuration

**Backend (.env):**
```bash
# Core Database & Auth
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inventory_db
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d

# Server Configuration  
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email Integration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (.env):**
```bash
# API Communication
VITE_API_BASE_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Supermarket Inventory System
VITE_DEMO_MODE=true
```

### CORS Configuration

CORS is configured in `backend/app.js`:
```javascript
// CORS options for local development
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
```

**Local Development Setup:**
1. Backend runs on `http://localhost:5000`
2. Frontend runs on `http://localhost:5173` 
3. Frontend points to backend via `VITE_API_BASE_URL=http://localhost:5000`
4. CORS allows requests from frontend origin

### Authentication Flow

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    participant Storage as localStorage
    
    UI->>API: POST /api/auth/login {email, password}
    API->>DB: Find user + validate password
    DB-->>API: User data
    API-->>UI: {success: true, data: {user, token}}
    UI->>Storage: Store token + user
    UI->>UI: Set Authorization header
    UI->>API: Subsequent requests with Bearer {token}
    API->>API: Verify JWT + extract user
    API-->>UI: Protected resource data
```

**Key Points:**
- JWT payload: `{id, email, role, fullName}`
- Frontend stores: `{token, user}` in localStorage
- AuthContext manages authentication state
- Protected routes check `isAuthenticated = !!(token && user)`

---

## Navigation

**← Previous**: [Table of Contents](README.md)  
**→ Next**: [Codebase Map & Data Models](02-codebase-data-models.md)