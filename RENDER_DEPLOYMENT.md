# 🎨 Render Deployment Guide

Complete guide to deploy your Supermarket Inventory System on **Render + Vercel**.

---

## 🌟 Why Render?

- ✅ **Free tier**: 750 hours/month (enough for 24/7 operation)
- ✅ **Auto-deploy**: Push to GitHub → Automatic deployment
- ✅ **Easy setup**: Similar to Railway
- ✅ **Automatic HTTPS**: Free SSL certificates
- ✅ **Environment variables**: Easy management
- ✅ **Good logs**: Real-time monitoring

**Trade-off**: Apps spin down after 15 minutes of inactivity (30-second cold start)

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Render account ([render.com](https://render.com))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] MongoDB Atlas connection string
- [ ] Gmail App Password

---

## 🚀 Part 1: Push to GitHub

### Step 1: Initialize Git Repository

```bash
cd c:\Users\anand\Desktop\inventory-supermarkets

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `inventory-supermarkets`
4. Keep it **Public** or **Private** (your choice)
5. **Don't** initialize with README (you already have one)
6. Click **"Create repository"**

### Step 3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/inventory-supermarkets.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 🎨 Part 2: Deploy Backend to Render

### Step 1: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `inventory-supermarkets`
3. Click **"Connect"**

### Step 3: Configure Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `inventory-backend` (or your choice) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

#### **Required Variables:**

```env
NODE_ENV=production
PORT=5000
```

#### **Database:**
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/inventory_db
DB_NAME=inventory_supermarket
```

#### **JWT Secrets (Generate new ones!):**
```bash
# Run this command TWICE to generate two different secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```env
JWT_SECRET=paste_first_generated_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=paste_second_generated_secret_here
JWT_REFRESH_EXPIRE=30d
```

#### **Email Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Inventory System
```

#### **Security:**
```env
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=2h
```

#### **Rate Limiting:**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **Business Config:**
```env
DEFAULT_CURRENCY=INR
TAX_RATE=18
LOW_STOCK_THRESHOLD=10
CRITICAL_STOCK_THRESHOLD=5
```

#### **Optional - Redis:**
```env
REDIS_URL=redis://YOUR_REDIS_URL
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
```

#### **CORS (Add this AFTER deploying frontend):**
```env
FRONTEND_URL=https://your-app.vercel.app
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying (takes 3-5 minutes)
3. Wait for status to show **"Live"** (green)
4. **Copy your Render URL**: `https://inventory-backend-xxxx.onrender.com`

---

## ▲ Part 3: Deploy Frontend to Vercel

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

### Step 3: Add Environment Variables

When prompted, or via Vercel Dashboard:

```env
VITE_API_URL=https://inventory-backend-xxxx.onrender.com/api
VITE_API_BASE_URL=https://inventory-backend-xxxx.onrender.com
VITE_API_TIMEOUT=30000
VITE_APP_NAME=Supermarket Inventory System
VITE_APP_VERSION=1.0.0
VITE_DEMO_MODE=false
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_LOCALE=en-IN
```

**Replace** `inventory-backend-xxxx.onrender.com` with your actual Render URL!

### Step 4: Complete Deployment

1. Vercel will build and deploy (2-3 minutes)
2. **Copy your Vercel URL**: `https://your-app.vercel.app`

---

## 🔄 Part 4: Update CORS Settings

### Go Back to Render

1. Open Render Dashboard
2. Go to your **inventory-backend** service
3. Click **"Environment"** tab
4. Add or update the `FRONTEND_URL` variable:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy (1-2 minutes)

---

## 🧪 Part 5: Test Your Deployment

### Test Backend

```bash
# Test health endpoint
curl https://inventory-backend-xxxx.onrender.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend

1. Open your Vercel URL in browser
2. You should see the login page
3. Try logging in:
   - **Email**: `admin@supermarket.com`
   - **Password**: `Admin@123456`

### Check Integration

- [ ] Dashboard loads
- [ ] Can view products
- [ ] Can navigate pages
- [ ] No CORS errors in console
- [ ] API calls work (check Network tab)

---

## ⚠️ Important: Render Free Tier Behavior

### Cold Starts

On the free tier, your backend will:
- **Spin down** after 15 minutes of inactivity
- **Spin up** when a request comes in (takes ~30 seconds)

**What this means:**
- First request after inactivity = slow (30s)
- Subsequent requests = fast
- Good for: Development, demos, low-traffic apps

**Solutions:**
1. **Keep it warm**: Use a service like [cron-job.org](https://cron-job.org) to ping your API every 14 minutes
2. **Upgrade to paid**: $7/month for always-on service
3. **Accept cold starts**: Fine for most use cases

---

## 🔥 Keep Your App Warm (Optional)

### Option 1: Use Cron-Job.org (Free)

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for free
3. Create new cron job:
   - **URL**: `https://inventory-backend-xxxx.onrender.com/health`
   - **Interval**: Every 14 minutes
   - **Method**: GET
4. Save and enable

### Option 2: Use UptimeRobot (Free)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free
3. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://inventory-backend-xxxx.onrender.com/health`
   - **Interval**: 5 minutes
4. Save

---

## 📊 Part 6: Monitoring & Logs

### Render Logs

1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. View real-time logs

### Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Click **"Deployments"**
4. Click on a deployment to view logs

---

## 🔄 Continuous Deployment

Both platforms now auto-deploy on git push:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Render automatically redeploys backend
# Vercel automatically redeploys frontend
```

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: Backend shows "Service Unavailable"
- **Check**: Render logs for errors
- **Verify**: MongoDB connection string is correct
- **Wait**: Initial deployment takes 3-5 minutes

**Problem**: Cold start is too slow
- **Solution**: Set up cron job to keep warm
- **Alternative**: Upgrade to paid plan ($7/month)

**Problem**: Environment variables not working
- **Check**: All variables are saved in Render
- **Verify**: No typos in variable names
- **Redeploy**: Click "Manual Deploy" → "Deploy latest commit"

### Frontend Issues

**Problem**: API calls failing
- **Check**: `VITE_API_URL` matches Render URL exactly
- **Verify**: Backend is running (check Render dashboard)
- **Check**: No trailing slashes in URLs

**Problem**: CORS errors
- **Check**: `FRONTEND_URL` in Render matches Vercel URL
- **Verify**: No trailing slashes
- **Redeploy**: Render backend after updating CORS

### Database Issues

**Problem**: Can't connect to MongoDB
- **Check**: IP whitelist includes `0.0.0.0/0`
- **Verify**: Connection string has correct password
- **Check**: Database user has read/write permissions

---

## 🔐 Security Checklist

- [ ] Strong JWT secrets generated (64+ characters)
- [ ] Different secrets for JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Gmail App Password (not regular password)
- [ ] MongoDB IP whitelist set to `0.0.0.0/0`
- [ ] No `.env` files committed to GitHub
- [ ] FRONTEND_URL matches Vercel URL exactly
- [ ] Demo mode disabled (`VITE_DEMO_MODE=false`)

---

## 📈 Performance Tips

### Backend Optimization

1. **Keep warm**: Use cron job to prevent cold starts
2. **Enable Redis**: Add Redis Cloud for caching
3. **Database indexes**: Already configured in your code
4. **Compression**: Already enabled in your Express app

### Frontend Optimization

1. **Vercel Edge**: Automatically enabled
2. **Image optimization**: Use Vercel's image optimization
3. **Code splitting**: Already configured in Vite
4. **Caching**: Already configured in `vercel.json`

---

## 💰 Cost Breakdown

### Free Tier (What You're Using)

| Service | Cost | Limits |
|---------|------|--------|
| **Render** | $0 | 750 hrs/mo, 512 MB RAM, cold starts |
| **Vercel** | $0 | 100 GB bandwidth, unlimited requests |
| **MongoDB Atlas** | $0 | 512 MB storage, shared cluster |
| **Redis Cloud** | $0 | 30 MB storage (optional) |
| **Total** | **$0/month** | Perfect for development/demos |

### Upgrade Options (If Needed)

| Service | Paid Plan | Benefits |
|---------|-----------|----------|
| **Render** | $7/mo | No cold starts, 512 MB RAM, always-on |
| **Vercel** | $20/mo | Team features, more bandwidth |
| **MongoDB Atlas** | $9/mo | Dedicated cluster, 10 GB storage |

---

## 🎉 Success!

Your application is now live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://inventory-backend-xxxx.onrender.com`
- **API Docs**: `https://inventory-backend-xxxx.onrender.com/api-docs`

### Test Credentials

- **Email**: `admin@supermarket.com`
- **Password**: `Admin@123456`

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Render Community**: https://community.render.com

---

## 🔄 Next Steps

1. **Test thoroughly**: Try all features
2. **Seed data**: Run `npm run seed:master` if needed
3. **Set up monitoring**: Use UptimeRobot or cron-job.org
4. **Custom domain**: Add your own domain (optional)
5. **Share your app**: Your inventory system is live!

---

**Deployment Time**: ~20 minutes  
**Last Updated**: October 16, 2025  
**Platform**: Render + Vercel  
**Status**: ✅ Production Ready
