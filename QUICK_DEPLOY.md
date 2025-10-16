# ⚡ Quick Deploy Guide

**Get your app live in 15 minutes!**

---

## 🎯 Prerequisites

- ✅ GitHub account
- ✅ Railway account ([railway.app](https://railway.app))
- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ MongoDB Atlas connection string
- ✅ Gmail App Password

---

## 🚀 Step 1: Push to GitHub (2 minutes)

```bash
cd c:\Users\anand\Desktop\inventory-supermarkets

# Initialize git
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/inventory-supermarkets.git
git branch -M main
git push -u origin main
```

---

## 🚂 Step 2: Deploy Backend to Railway (5 minutes)

1. **Go to [railway.app](https://railway.app)** → Sign in with GitHub

2. **New Project** → **Deploy from GitHub repo** → Select `inventory-supermarkets`

3. **Configure**:
   - Settings → Root Directory → Set to `backend`

4. **Add Environment Variables** (click "Variables" tab):

   **Copy these 6 CRITICAL variables:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=generate_random_64_char_string
   JWT_REFRESH_SECRET=generate_different_random_64_char_string
   NODE_ENV=production
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   ```

   **Generate JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Wait for deployment** (2-3 minutes)

6. **Copy your Railway URL**: `https://your-app.railway.app`

---

## ▲ Step 3: Deploy Frontend to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**When prompted for environment variables, add:**

```env
VITE_API_URL=https://your-railway-app.railway.app/api
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_APP_NAME=Supermarket Inventory System
VITE_DEMO_MODE=false
```

**Copy your Vercel URL**: `https://your-app.vercel.app`

---

## 🔄 Step 4: Update CORS (2 minutes)

1. **Go back to Railway** → Your project → Variables

2. **Add one more variable**:
   ```env
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

3. **Railway will auto-redeploy** (1 minute)

---

## ✅ Step 5: Test Your App (1 minute)

1. **Open**: `https://your-vercel-app.vercel.app`

2. **Login** with your seeded credentials:
   - Email: `admin@supermarket.com`
   - Password: `Admin@123456`

3. **Test features**:
   - Dashboard loads ✅
   - Can view products ✅
   - Can create a sale ✅

---

## 🎉 Done!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app
- **API Docs**: https://your-app.railway.app/api-docs

---

## 🐛 Troubleshooting

### Backend won't start?
- Check Railway logs: Project → Deployments → View logs
- Verify MongoDB connection string is correct
- Ensure all required env vars are set

### Frontend can't connect to backend?
- Check `VITE_API_URL` matches your Railway URL
- Verify `FRONTEND_URL` is set in Railway
- Check Railway backend is running (green status)

### CORS errors?
- Ensure `FRONTEND_URL` in Railway matches Vercel URL exactly
- No trailing slashes in URLs
- Redeploy backend after updating CORS

### Can't login?
- Check if backend is seeded with users
- Run seed script: Railway CLI → `railway run npm run seed:users`
- Or create user manually in MongoDB Atlas

---

## 📚 Full Documentation

For detailed instructions, see:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - All environment variables explained

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com

---

**Deployment Time**: ~15 minutes
**Last Updated**: October 16, 2025
