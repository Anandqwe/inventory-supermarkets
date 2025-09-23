# Setup Guide

This comprehensive guide will help you set up the complete supermarket inventory management system with cloud deployments, Redis caching, email notifications, and all advanced features.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- MongoDB Atlas account
- Redis Cloud account (optional but recommended)
- Gmail account with App Password
- Render account (for backend hosting)
- Vercel account (for frontend hosting)

## 1. MongoDB Atlas Setup

### Create a MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up/login
2. Create a new project: "inventory-supermarkets"
3. Create a new cluster:
   - Choose "M0 Sandbox" (Free tier)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "inventory-cluster")

### Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with:
   - Authentication Method: Password
   - Username: `inventory_admin`
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"

### Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: In production, restrict to specific IPs

### Get Connection String

1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (it looks like):
   ```
   mongodb+srv://inventory_admin:<password>@inventory-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password

## 4. Environment Configuration

### Backend Environment (.env)

Create a `.env` file in the `backend` directory:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://inventory_admin:your-password@inventory-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=inventory-supermarkets

# JWT Configuration (Generate secure 64+ character keys)
JWT_SECRET=8f2e9c4b7a6d3e1f9c8b5a2d7e4f1c6b9a8e5d2c7f4b1e8a5c2f9d6b3e0c7a4d1f8e5b2c9f6a3d0e7c4b1f8a5e2d9c6b3f0a7d4c1e8b5f2a9d6c3e0b7a4f1d8c5b2e9a6d3f0c7a4b1e8d5c2
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=3f6e9c2b5a8d1e4f7c0b3a6d9e2f5c8b1a4e7d0c3f6b9a2e5d8c1b4f7a0e3d6c9b2f5a8e1d4c7b0f3a6e9d2c5b8a1f4e7c0d3b6f9a2e5c8d1b4a7f0e3c6b9f2a5d8e1c4b7a0f3d6c9e2b5a8f1d4c7b0a3f6e9c2d5b8a1e4f7c0d3a6b9f2e5c8d1a4b7f0e3c6a9d2b5f8e1c4a7b0d3f6c9a2e5b8d1f4a7c0e3b6f9a2d5c8b1e4a7f0d3c6b9e2a5f8d1c4b7a0e3d6c9b2f5
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_VERSION=v1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=Supermarket Inventory System <your-email@gmail.com>

# Redis Cloud Configuration
REDIS_ENABLED=true
REDIS_HOST=redis-xxxxx.xxxxx.xxxxx.redns.redis-cloud.com
REDIS_PORT=12067
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Database Options
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5

# Logging
LOG_LEVEL=info
```

### Frontend Environment (.env)

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Supermarket Inventory System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
```

## 5. Local Development Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Run database scripts** (optional):
   ```bash
   # Create database indexes
   npm run db:indexes
   
   # Seed with sample data
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 6. Testing the Setup

### Test Backend API

1. **Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test Authentication**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@supermarket.com", "password": "Admin@123456"}'
   ```

3. **Test Email Service**:
   ```bash
   curl -X GET http://localhost:5000/api/email/status \
     -H "Authorization: Bearer your-jwt-token"
   ```

4. **Test Redis Cache**:
   ```bash
   curl -X GET http://localhost:5000/api/cache/health \
     -H "Authorization: Bearer your-jwt-token"
   ```

### Test Frontend

1. Open browser: `http://localhost:3000` or `http://localhost:5173`
2. Login with default credentials
3. Navigate through different pages
4. Test CRUD operations

### Create Redis Cloud Account

1. Go to [Redis Cloud](https://redis.com/try-free/) and sign up
2. Create a new subscription:
   - Choose "Fixed" plan
   - Select "30MB" free tier
   - Choose your preferred cloud provider and region

### Create Database

1. Click "New Database"
2. Configure:
   - Database Name: `inventory-cache`
   - Protocol: Redis Stack
   - Modules: Enable RedisJSON and RediSearch (optional)

### Get Connection Details

1. Go to your database configuration
2. Copy the connection details:
   - **Endpoint**: `redis-xxxxx.xxxxx.xxxxx.redns.redis-cloud.com`
   - **Port**: `12067` (or your assigned port)
   - **Username**: `default`
   - **Password**: Your database password

## 3. Gmail SMTP Setup

### Enable App Passwords

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to "Security" → "2-Step Verification"
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords"
5. Generate a new app password for "Mail"
6. Save the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Email Configuration

- **Service**: Gmail
- **Username**: Your Gmail address
- **Password**: The 16-character app password (not your regular password)
- **Security**: Use App Password, not OAuth2
5. Add database name: `/inventory-supermarkets` before the `?`

## 2. Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your values:
   ```env
   MONGO_URI=mongodb+srv://inventory_admin:your_password@inventory-cluster.xxxxx.mongodb.net/inventory-supermarkets?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

6. Verify backend is running:
   ```bash
   curl http://localhost:5000/health
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

5. Start the frontend server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:3000`

## 3. Render Deployment (Backend)

### Prepare for Deployment

1. Ensure your backend has a `package.json` with proper scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "echo 'No build step required'"
     }
   }
   ```

### Deploy to Render

1. Go to [Render](https://render.com/) and sign up/login
2. Connect your GitHub account
3. Click "New +" → "Web Service"
4. Connect your repository: `inventory-supermarkets`
5. Configure the service:
   - **Name**: `inventory-supermarkets-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Configure Environment Variables

In Render dashboard, go to Environment tab and add:

```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
PORT=10000
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your Render URL (e.g., `https://inventory-supermarkets-api.onrender.com`)
4. Test the health endpoint: `https://your-render-url.onrender.com/health`

## 4. Vercel Deployment (Frontend)

### Prepare for Deployment

1. Ensure your frontend has proper build configuration in `package.json`:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

### Deploy to Vercel

1. Go to [Vercel](https://vercel.com/) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `inventory-supermarkets`
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```
VITE_API_BASE_URL=https://your-render-url.onrender.com
```

### Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at: `https://your-project-name.vercel.app`

### Update CORS Origin

1. Go back to your Render dashboard
2. Update the `CORS_ORIGIN` environment variable with your Vercel URL
3. Redeploy your backend service

## 5. Post-Deployment Configuration

### Test the Complete Setup

1. Visit your Vercel frontend URL
2. Try logging in (authentication will be implemented later)
3. Navigate through different sections
4. Check that API calls work (Network tab in browser dev tools)

### Set Up Custom Domains (Optional)

#### For Backend (Render)
1. In Render dashboard, go to Settings → Custom Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed

#### For Frontend (Vercel)
1. In Vercel dashboard, go to Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed

### Configure SSL Certificates

Both Render and Vercel provide free SSL certificates automatically for custom domains.

## 6. Database Initialization

### Seed Initial Data

Create a seed script to populate initial data:

```javascript
// backend/scripts/seed.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import your models here
// const User = require('../models/User');
// const Category = require('../models/Category');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing data (optional)
    // await User.deleteMany({});
    // await Category.deleteMany({});
    
    // Create sample categories
    const categories = [
      { name: 'Bakery', description: 'Fresh baked goods' },
      { name: 'Dairy', description: 'Milk and dairy products' },
      { name: 'Produce', description: 'Fresh fruits and vegetables' },
      { name: 'Meat', description: 'Fresh meat and poultry' },
      { name: 'Grains', description: 'Rice, pasta, and cereals' }
    ];
    
    // await Category.insertMany(categories);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
```

Run the seed script:
```bash
cd backend
node scripts/seed.js
```

## 7. Monitoring and Maintenance

### Set Up Error Tracking

1. Sign up for [Sentry](https://sentry.io/)
2. Add Sentry to both frontend and backend
3. Configure error reporting

### Set Up Uptime Monitoring

1. Use [Uptime Robot](https://uptimerobot.com/) or similar
2. Monitor your Render backend URL
3. Set up alerts for downtime

### Backup Strategy

1. MongoDB Atlas provides automatic backups
2. Export configuration regularly
3. Document deployment procedures

## 8. Troubleshooting

### Common Issues

#### Backend won't start on Render
- Check logs in Render dashboard
- Verify environment variables
- Ensure MongoDB connection string is correct

#### Frontend can't connect to backend
- Check CORS configuration
- Verify API URL in environment variables
- Check Network tab in browser dev tools

#### MongoDB connection issues
- Verify IP whitelist includes 0.0.0.0/0
- Check username/password in connection string
- Ensure database user has proper permissions

### Debug Commands

```bash
# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect('your_mongo_uri').then(() => console.log('Connected')).catch(err => console.error(err))"

# Test API endpoint
curl -X GET https://your-render-url.onrender.com/health

# Check environment variables (remove sensitive data before sharing)
printenv | grep -E "(MONGO_URI|JWT_SECRET|CORS_ORIGIN)"
```

## 9. Next Steps

After successful deployment:

1. Implement user authentication
2. Add API routes for CRUD operations
3. Integrate real-time features (Socket.io)
4. Add automated testing
5. Set up CI/CD pipelines
6. Implement proper logging
7. Add performance monitoring

## Security Considerations

1. Use strong JWT secrets (minimum 32 characters)
2. Implement rate limiting
3. Add input validation and sanitization
4. Use HTTPS everywhere
5. Regular security updates
6. Monitor for suspicious activities
7. Implement proper error handling (don't expose sensitive information)

---

**Important**: Keep your environment variables and connection strings secure. Never commit them to version control.