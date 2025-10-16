# ⚡ Render Quick Start - 20 Minutes to Live!

Get your app deployed on **Render + Vercel** in 20 minutes.

---

## 🎯 What You Need (5 minutes prep)

### 1. Generate JWT Secrets (30 seconds)

Run this command **TWICE**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy both outputs** - you'll need them!

### 2. Get Gmail App Password (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Create: **Mail** → **Other** → "Inventory System"
5. Copy the 16-character password

### 3. Get MongoDB Connection String

You already have this:
```
mongodb+srv://username:password@cluster.mongodb.net/database
```

---

## 🚀 Step 1: Push to GitHub (3 minutes)

```bash
cd c:\Users\anand\Desktop\inventory-supermarkets

# Initialize and commit
git init
git add .
git commit -m "Ready for Render deployment"

# Create repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/inventory-supermarkets.git
git branch -M main
git push -u origin main
```

---

## 🎨 Step 2: Deploy to Render (8 minutes)

### A. Sign Up

1. Go to [render.com](https://render.com)
2. **Sign up with GitHub**
3. Authorize Render

### B. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select repository: `inventory-supermarkets`
3. Click **"Connect"**

### C. Configure

| Setting | Value |
|---------|-------|
| **Name** | `inventory-backend` |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

### D. Add Environment Variables

Click **"Advanced"** → Add these variables:

**Copy and paste these (update YOUR values):**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/inventory_db
JWT_SECRET=PASTE_FIRST_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=PASTE_SECOND_GENERATED_SECRET_HERE
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Inventory System
BCRYPT_SALT_ROUNDS=12
DEFAULT_CURRENCY=INR
TAX_RATE=18
LOW_STOCK_THRESHOLD=10
```

### E. Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. **Copy your URL**: `https://inventory-backend-xxxx.onrender.com`

---

## ▲ Step 3: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Login and deploy
vercel login
vercel --prod
```

### Add Environment Variables

When prompted (or in Vercel Dashboard):

```env
VITE_API_URL=https://inventory-backend-xxxx.onrender.com/api
VITE_API_BASE_URL=https://inventory-backend-xxxx.onrender.com
VITE_APP_NAME=Supermarket Inventory System
VITE_DEMO_MODE=false
VITE_DEFAULT_CURRENCY=INR
```

**Replace** `inventory-backend-xxxx.onrender.com` with your Render URL!

**Copy your Vercel URL**: `https://your-app.vercel.app`

---

## 🔄 Step 4: Update CORS (2 minutes)

1. Go to **Render Dashboard**
2. Click your service → **"Environment"**
3. Add variable:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Click **"Save Changes"**
5. Wait for auto-redeploy (1-2 minutes)

---

## ✅ Step 5: Test (2 minutes)

1. Open: `https://your-app.vercel.app`
2. Login:
   - **Email**: `admin@supermarket.com`
   - **Password**: `Admin@123456`
3. Check:
   - [ ] Dashboard loads
   - [ ] Can view products
   - [ ] No console errors

---

## 🎉 Done!

Your app is live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://inventory-backend-xxxx.onrender.com`
- **API Docs**: `https://inventory-backend-xxxx.onrender.com/api-docs`

---

## ⚠️ Important: Cold Starts

Render free tier spins down after 15 minutes of inactivity.

**First request after inactivity = 30 seconds**

### Keep It Warm (Optional)

Use [cron-job.org](https://cron-job.org):
1. Sign up free
2. Create cron job
3. URL: `https://inventory-backend-xxxx.onrender.com/health`
4. Interval: Every 14 minutes

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not starting | Check Render logs |
| CORS errors | Update `FRONTEND_URL` in Render |
| Can't login | Check MongoDB connection |
| Slow first load | Normal - cold start (30s) |

---

## 📚 Need More Help?

- **Full Guide**: `RENDER_DEPLOYMENT.md`
- **Environment Variables**: `ENVIRONMENT_VARIABLES.md`
- **Render Docs**: https://render.com/docs

---

**Total Time**: ~20 minutes  
**Cost**: $0/month  
**Status**: ✅ Live!
