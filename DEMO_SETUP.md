# Demo Setup and Integration Guide

## Overview
This document provides complete instructions for setting up the demo environment with 1200+ Indian supermarket products and comprehensive transaction history.

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed:demo    # Creates 1200+ products + transaction history
npm run dev         # Start development server
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local    # Copy environment config
npm run dev         # Start frontend (http://localhost:5173)
```

### 3. Demo Access
- **Admin**: admin@supermarket.com / Admin@123456
- **Manager**: manager@supermarket.com / Manager@123456  
- **Cashier**: cashier@supermarket.com / Cashier@123456

## Generated Demo Data

### Products (1200+ items)
- **Categories**: 12 Indian retail categories (Dairy, Pantry, Grains, Personal Care, etc.)
- **Brands**: 34 popular Indian brands (Amul, Tata, Patanjali, etc.)
- **Pricing**: Realistic INR pricing with GST compliance
- **Stock**: Multi-branch inventory levels

### Transaction History (60 days)
- **Sales**: 500 POS transactions with realistic patterns
- **Purchases**: 250 supplier orders with proper stock updates
- **Transfers**: 45 inter-branch inventory movements
- **Adjustments**: 35 stock corrections (damage, loss, expiry)

### Master Data
- **Suppliers**: 8 Indian suppliers with GST details
- **Branches**: 8 store locations across India
- **Users**: 5 demo users with role-based permissions
- **Customers**: 150 sample customers with purchase history

## NPM Scripts

### Backend Commands
```bash
# Data Management
npm run seed:demo           # Full demo setup (recommended)
npm run seed:products       # Products and master data only
npm run seed:transactions   # Transaction history only
npm run seed:sales          # Sales transactions only
npm run seed:purchases      # Purchase orders only
npm run seed:verify         # Verify seeded data
npm run seed:wipe -- --force [--reseed]  # DANGEROUS: Clear all data

# Development
npm run dev                 # Development server with hot reload
npm run start              # Production server
npm run test               # Run test suite
npm run db:indexes         # Create database indexes
npm run cache:clear        # Clear Redis cache
npm run perf:check         # Performance diagnostics
```

### Frontend Commands
```bash
npm run dev                # Development server (port 5173)
npm run build             # Production build
npm run preview           # Preview production build
npm run test              # Run Vitest tests
npm run lint:fix          # Auto-fix ESLint issues
```

## Environment Configuration

### Backend (.env)
```env
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/supermarket
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Demo Mode
DEMO_MODE=true
NODE_ENV=development

# Optional
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
PORT=5000
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000
VITE_DEMO_MODE=true
VITE_SHOW_DEMO_CREDENTIALS=true

# Demo Credentials (displayed in UI)
VITE_DEMO_ADMIN_EMAIL=admin@supermarket.com
VITE_DEMO_ADMIN_PASSWORD=Admin@123456
```

## API Endpoints

### Core Endpoints
- `GET /health` - Server health check
- `GET /api/demo/config` - Demo configuration
- `POST /api/auth/login` - User authentication
- `GET /api/dashboard/overview` - Dashboard metrics
- `GET /api/products` - Product listings with search/filter
- `GET /api/sales` - Sales transactions
- `GET /api/reports/summary` - Business reports

### Demo-Specific Features
- CORS configured for localhost development
- Rate limiting disabled in demo mode
- Enhanced error messages
- Realistic Indian market data

## Database Schema

### Key Collections
- **users**: Role-based user accounts
- **products**: 1200+ Indian supermarket items
- **categories**: 12 retail categories with GST rates
- **brands**: 34 popular Indian brands
- **suppliers**: 8 suppliers with GST compliance
- **branches**: 8 store locations
- **sales**: POS transaction history
- **purchases**: Supplier order history
- **transfers**: Inter-branch movements
- **adjustments**: Stock corrections

## Demo Features

### Dashboard Metrics
- Real-time sales analytics
- Inventory levels and alerts
- Top-selling products
- Revenue trends with charts
- GST breakdowns

### Inventory Management
- Multi-branch stock tracking
- Low stock alerts
- Batch/expiry management
- Stock movement history

### Sales Management
- POS-style transaction entry
- Multiple payment methods
- GST calculations
- Receipt generation
- Sales analytics

### Reports
- Sales summary reports
- Inventory valuation
- Stock movement reports
- GST reports for compliance
- Profit/loss analysis

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MONGODB_URI in .env
   - Check network connectivity
   - Ensure database user has read/write permissions

2. **CORS Errors**
   - Verify FRONTEND_URL in backend .env
   - Check frontend API_BASE_URL configuration
   - Ensure both servers are running

3. **Demo Data Not Loading**
   - Run `npm run seed:verify` to check data
   - Try `npm run seed:wipe -- --force --reseed`
   - Check console for seeding errors

4. **Authentication Issues**
   - Verify JWT_SECRET is set (minimum 32 characters)
   - Clear browser localStorage
   - Check user credentials match demo users

### Performance Optimization
- Database indexes are automatically created
- Redis caching enabled (falls back to in-memory)
- Response compression enabled
- Optimized queries with population

## Development Workflow

### 1. Initial Setup
```bash
# Clone and install
git clone <repository>
cd inventory-supermarkets

# Backend setup
cd backend
npm install
cp .env.example .env    # Configure MongoDB URI and JWT_SECRET
npm run seed:demo       # Generate demo data

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Monitoring (optional)
cd backend && npm run perf:check
```

### 3. Testing Demo
1. Access frontend at http://localhost:5173
2. Login with demo credentials
3. Verify dashboard shows realistic data
4. Test product search/filtering
5. Check sales transaction flow
6. Review reports functionality

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Set `DEMO_MODE=false` for production
- Configure production MongoDB URI
- Set secure JWT_SECRET
- Configure production CORS origins

### Data Migration
- Use production seeding script
- Import real product catalog
- Configure actual supplier data
- Set up proper user accounts

## Support

### Logs and Debugging
- Backend logs: `backend/logs/`
- Console output shows seeding progress
- Health check: http://localhost:5000/health
- Demo config: http://localhost:5000/api/demo/config

### Data Verification
```bash
cd backend
npm run seed:verify    # Check record counts
node -e "console.log(require('./src/config/demo'))"  # Show config
```

This setup provides a fully functional supermarket inventory system with realistic Indian market data, perfect for demonstrations and development.