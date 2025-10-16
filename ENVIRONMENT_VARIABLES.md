# 🔐 Environment Variables Checklist

Complete list of environment variables needed for deployment.

---

## 🚂 Railway (Backend) Environment Variables

### ✅ Required Variables

Copy and paste these into Railway's environment variables section. **Replace placeholder values with your actual credentials.**

```env
# ========================================
# DATABASE CONFIGURATION
# ========================================
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/inventory_db
DB_NAME=inventory_supermarket

# ========================================
# JWT CONFIGURATION (CRITICAL!)
# ========================================
# Generate strong secrets using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_64_CHARACTERS_OR_MORE
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_STRONG_SECRET_64_CHARACTERS
JWT_REFRESH_EXPIRE=30d

# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=5000
NODE_ENV=production

# ========================================
# CORS CONFIGURATION
# ========================================
# Update this AFTER deploying frontend to Vercel
FRONTEND_URL=https://YOUR_VERCEL_APP_NAME.vercel.app

# ========================================
# SECURITY CONFIGURATION
# ========================================
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=2h

# ========================================
# RATE LIMITING
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# EMAIL CONFIGURATION
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Inventory System

# ========================================
# FILE UPLOAD CONFIGURATION
# ========================================
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ========================================
# REDIS CONFIGURATION (Optional)
# ========================================
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_REDIS_HOST:PORT
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# ========================================
# BUSINESS CONFIGURATION
# ========================================
DEFAULT_CURRENCY=INR
TAX_RATE=18
LOW_STOCK_THRESHOLD=10
CRITICAL_STOCK_THRESHOLD=5

# ========================================
# ANALYTICS CONFIGURATION
# ========================================
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=365

# ========================================
# DEBUG CONFIGURATION
# ========================================
DEBUG=inventory:*
VERBOSE_LOGGING=false
ENABLE_SWAGGER=true
```

---

## ▲ Vercel (Frontend) Environment Variables

### ✅ Required Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# ========================================
# API CONFIGURATION
# ========================================
# Update with your Railway backend URL
VITE_API_URL=https://YOUR_RAILWAY_APP.railway.app/api
VITE_API_BASE_URL=https://YOUR_RAILWAY_APP.railway.app
VITE_API_TIMEOUT=30000

# ========================================
# APPLICATION CONFIGURATION
# ========================================
VITE_APP_NAME=Supermarket Inventory System
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Complete inventory and sales management system

# ========================================
# DEMO MODE CONFIGURATION
# ========================================
VITE_DEMO_MODE=false
VITE_SHOW_DEMO_CREDENTIALS=false

# ========================================
# AUTHENTICATION CONFIGURATION
# ========================================
VITE_JWT_STORAGE_KEY=inventory_token
VITE_JWT_REFRESH_KEY=inventory_refresh_token
VITE_SESSION_TIMEOUT=30

# ========================================
# THEME CONFIGURATION
# ========================================
VITE_DEFAULT_THEME=light
VITE_THEME_STORAGE_KEY=inventory_theme

# ========================================
# FEATURE FLAGS
# ========================================
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=false

# ========================================
# UI CONFIGURATION
# ========================================
VITE_ITEMS_PER_PAGE=20
VITE_MAX_ITEMS_PER_PAGE=100
VITE_DEBOUNCE_SEARCH_MS=300
VITE_AUTO_SAVE_INTERVAL_MS=30000
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_LOCALE=en-IN

# ========================================
# FILE UPLOAD CONFIGURATION
# ========================================
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
VITE_UPLOAD_CHUNK_SIZE=1048576

# ========================================
# CHART CONFIGURATION
# ========================================
VITE_CHART_ANIMATION_DURATION=750
VITE_CHART_RESPONSIVE=true
VITE_CHART_MAINTAIN_ASPECT_RATIO=false

# ========================================
# NOTIFICATION CONFIGURATION
# ========================================
VITE_TOAST_DURATION=4000
VITE_TOAST_POSITION=top-right
VITE_NOTIFICATION_SOUND=true

# ========================================
# DEVELOPMENT CONFIGURATION
# ========================================
VITE_DEBUG_MODE=false
VITE_MOCK_API=false
VITE_LOG_LEVEL=warn

# ========================================
# PWA CONFIGURATION
# ========================================
VITE_PWA_NAME=Inventory System
VITE_PWA_SHORT_NAME=Inventory
VITE_PWA_DESCRIPTION=Supermarket inventory and sales management
VITE_PWA_THEME_COLOR=#3b82f6
VITE_PWA_BACKGROUND_COLOR=#ffffff

# ========================================
# PERFORMANCE CONFIGURATION
# ========================================
VITE_LAZY_LOADING=true
VITE_IMAGE_OPTIMIZATION=true
VITE_PRELOAD_CRITICAL_ROUTES=true

# ========================================
# SECURITY CONFIGURATION
# ========================================
VITE_ENABLE_CSP=true
VITE_SECURE_COOKIES=true

# ========================================
# BUSINESS CONFIGURATION
# ========================================
VITE_DEFAULT_CURRENCY=INR
VITE_CURRENCY_SYMBOL=₹
VITE_DECIMAL_PLACES=2
VITE_TAX_INCLUDED=true
```

---

## 🔑 How to Generate Secure JWT Secrets

### Option 1: Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Option 2: Using OpenSSL

```bash
openssl rand -hex 64
```

### Option 3: Online Generator

Visit: https://generate-secret.vercel.app/64

**⚠️ Important:**
- Use **different secrets** for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Never reuse development secrets in production
- Store secrets securely (use password manager)

---

## 📧 How to Get Gmail App Password

1. **Go to Google Account**: https://myaccount.google.com
2. **Enable 2-Step Verification**:
   - Security → 2-Step Verification → Turn On
3. **Generate App Password**:
   - Security → App Passwords
   - Select App: **Mail**
   - Select Device: **Other (Custom name)**
   - Enter name: "Inventory System"
   - Click **Generate**
4. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
5. **Use in `SMTP_PASS`** environment variable (remove spaces)

---

## 🗄️ MongoDB Atlas Connection String

### Format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Where to Find:
1. Go to **MongoDB Atlas Dashboard**
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with `inventory_db`

### Example:
```
mongodb+srv://admin:MySecureP@ss123@cluster0.abc123.mongodb.net/inventory_db?retryWrites=true&w=majority
```

---

## 🔴 Redis Cloud Connection String

### Format:
```
redis://default:<password>@<host>:<port>
```

### Where to Find:
1. Go to **Redis Cloud Dashboard**
2. Select your database
3. Click **Connect**
4. Copy the connection string
5. Use in `REDIS_URL` environment variable

### Example:
```
redis://default:MyRedisPass123@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

---

## ✅ Deployment Checklist

### Before Deploying Backend (Railway)

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with read/write permissions
- [ ] IP whitelist set to `0.0.0.0/0` (allow all)
- [ ] Redis Cloud instance created (optional)
- [ ] Gmail App Password generated
- [ ] Strong JWT secrets generated
- [ ] All environment variables prepared

### Before Deploying Frontend (Vercel)

- [ ] Backend deployed and URL obtained
- [ ] Backend URL added to frontend env vars
- [ ] All feature flags configured
- [ ] Demo mode disabled for production

### After Both Deployments

- [ ] Update `FRONTEND_URL` in Railway backend
- [ ] Test login functionality
- [ ] Test API calls from frontend
- [ ] Verify email sending works
- [ ] Check CORS is working properly

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Using same JWT secrets** for `JWT_SECRET` and `JWT_REFRESH_SECRET`
2. ❌ **Forgetting to update `FRONTEND_URL`** after deploying frontend
3. ❌ **Not whitelisting IPs** in MongoDB Atlas
4. ❌ **Using development secrets** in production
5. ❌ **Hardcoding URLs** instead of using environment variables
6. ❌ **Leaving demo mode enabled** in production
7. ❌ **Not testing email** before going live

---

## 📝 Quick Copy Templates

### Railway Environment Variables (Minimal)

```env
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=production
FRONTEND_URL=
SMTP_USER=
SMTP_PASS=
```

### Vercel Environment Variables (Minimal)

```env
VITE_API_URL=
VITE_API_BASE_URL=
VITE_APP_NAME=Supermarket Inventory System
VITE_DEMO_MODE=false
```

---

## 🔒 Security Notes

- **Never commit** `.env` files to Git
- **Use different secrets** for development and production
- **Rotate secrets** periodically (every 90 days recommended)
- **Store secrets** in a password manager
- **Limit access** to production environment variables
- **Enable 2FA** on all cloud service accounts

---

**Last Updated**: October 16, 2025
**Version**: 1.0.0
