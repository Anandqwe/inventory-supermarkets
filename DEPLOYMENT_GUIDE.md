# 🚀 Deployment Guide - Railway + Vercel

Complete step-by-step guide to deploy your Supermarket Inventory Management System.

---

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] MongoDB Atlas account (already have)
- [ ] Redis Cloud account (optional, already have)
- [ ] Gmail account with App Password (for emails)

### ✅ Required Information
- [ ] MongoDB Atlas connection string
- [ ] Redis Cloud connection string (optional)
- [ ] Gmail SMTP credentials
- [ ] Strong JWT secrets (generate new ones for production)

---

## 🔧 Part 1: Backend Deployment (Railway)

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
cd c:\Users\anand\Desktop\inventory-supermarkets
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/inventory-supermarkets.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub

2. **Click "New Project"** → **"Deploy from GitHub repo"**

3. **Select your repository**: `inventory-supermarkets`

4. **Configure the service**:
   - Click on the deployed service
   - Go to **Settings** → **Root Directory**
   - Set to: `backend`

5. **Add Environment Variables**:
   - Go to **Variables** tab
   - Click **"+ New Variable"**
   - Add all variables from the list below

### Step 3: Environment Variables for Railway

Copy these variables and update with your actual values:

```env
# Database
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/inventory_db
DB_NAME=inventory_supermarket

# JWT Configuration (GENERATE NEW SECRETS!)
JWT_SECRET=GENERATE_A_STRONG_SECRET_AT_LEAST_32_CHARACTERS_LONG
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=GENERATE_ANOTHER_STRONG_SECRET_DIFFERENT_FROM_ABOVE
JWT_REFRESH_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration (Update after deploying frontend)
FRONTEND_URL=https://YOUR_VERCEL_APP.vercel.app

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=2h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
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

# Redis Configuration (Optional)
REDIS_URL=redis://YOUR_REDIS_URL
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# Business Configuration
DEFAULT_CURRENCY=INR
TAX_RATE=18
LOW_STOCK_THRESHOLD=10
CRITICAL_STOCK_THRESHOLD=5

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=365

# Development/Debug Configuration
DEBUG=inventory:*
VERBOSE_LOGGING=false
ENABLE_SWAGGER=true
```

### Step 4: Get Your Backend URL

After deployment:
1. Go to **Settings** → **Domains**
2. Railway will provide a URL like: `https://your-app.railway.app`
3. **Copy this URL** - you'll need it for frontend deployment

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Frontend

```bash
# Navigate to frontend directory
cd c:\Users\anand\Desktop\inventory-supermarkets\frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel

During deployment, Vercel will ask for environment variables. Provide:

```env
VITE_API_URL=https://your-app.railway.app/api
VITE_API_BASE_URL=https://your-app.railway.app
VITE_API_TIMEOUT=30000
VITE_APP_NAME=Supermarket Inventory System
VITE_APP_VERSION=1.0.0
VITE_DEMO_MODE=false
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_LOCALE=en-IN
```

**Or add them via Vercel Dashboard:**
1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value

### Step 4: Get Your Frontend URL

After deployment, Vercel will provide a URL like:
- `https://your-app.vercel.app`

---

## 🔄 Part 3: Update CORS Settings

### Update Railway Backend

1. Go back to **Railway** → Your backend service
2. Update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy

---

## 🧪 Part 4: Testing Your Deployment

### Test Backend API

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test API
curl https://your-app.railway.app/api/health
```

### Test Frontend

1. Open `https://your-app.vercel.app` in your browser
2. Try logging in with your test credentials
3. Check if API calls work properly

---

## 🔐 Part 5: Security Checklist

### MongoDB Atlas Security

1. **Go to MongoDB Atlas** → **Network Access**
2. **Add IP Address**: `0.0.0.0/0` (Allow from anywhere)
   - Railway uses dynamic IPs, so you need to allow all
   - Your database is still protected by username/password

### Redis Cloud Security

1. **Go to Redis Cloud** → **Security**
2. **Enable SSL/TLS** for connections
3. **Whitelist Railway IPs** if possible

### Gmail App Password

1. **Go to Google Account** → **Security**
2. **Enable 2-Step Verification**
3. **Generate App Password**:
   - Go to **App Passwords**
   - Select **Mail** and **Other (Custom name)**
   - Copy the 16-character password
   - Use this in `SMTP_PASS` environment variable

---

## 📊 Part 6: Monitoring & Logs

### Railway Logs

1. Go to your Railway project
2. Click **Deployments** tab
3. View real-time logs

### Vercel Logs

1. Go to your Vercel project
2. Click **Deployments** tab
3. Click on a deployment to view logs

---

## 🔄 Part 7: Continuous Deployment

### Automatic Deployments

Both Railway and Vercel are now configured for automatic deployments:

- **Push to `main` branch** → Railway automatically deploys backend
- **Push to `main` branch** → Vercel automatically deploys frontend

### Manual Deployments

**Railway:**
```bash
# Trigger redeploy from CLI
railway up
```

**Vercel:**
```bash
cd frontend
vercel --prod
```

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- **Check**: Railway logs for errors
- **Verify**: All environment variables are set
- **Check**: MongoDB connection string is correct

**Problem**: CORS errors
- **Check**: `FRONTEND_URL` matches your Vercel URL exactly
- **Verify**: No trailing slashes in URLs

### Frontend Issues

**Problem**: API calls failing
- **Check**: `VITE_API_URL` points to Railway backend
- **Verify**: Backend is running (check Railway dashboard)

**Problem**: Build fails
- **Check**: All dependencies are in `package.json`
- **Run**: `npm run build` locally to test

### Database Issues

**Problem**: Can't connect to MongoDB
- **Check**: IP whitelist includes `0.0.0.0/0`
- **Verify**: Connection string has correct username/password
- **Check**: Database user has read/write permissions

---

## 📝 Post-Deployment Tasks

### 1. Seed Initial Data

```bash
# Connect to Railway backend via CLI
railway run npm run seed:master
```

### 2. Create Admin User

Use the seeded admin credentials or create via MongoDB Atlas directly.

### 3. Test All Features

- [ ] Login/Logout
- [ ] Create products
- [ ] Process sales
- [ ] View reports
- [ ] Email notifications
- [ ] All user roles

### 4. Set Up Custom Domain (Optional)

**Railway:**
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records

**Vercel:**
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records

---

## 🎉 Success!

Your application is now live:

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-app.railway.app
- **API Docs**: https://your-app.railway.app/api-docs

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** to GitHub
2. ✅ **Use strong, unique JWT secrets** in production
3. ✅ **Enable 2FA** on all cloud accounts
4. ✅ **Regularly update dependencies**: `npm audit fix`
5. ✅ **Monitor logs** for suspicious activity
6. ✅ **Set up database backups** in MongoDB Atlas
7. ✅ **Use HTTPS only** (both platforms provide this automatically)

---

**Last Updated**: October 16, 2025
**Version**: 1.0.0
