# ✅ Deployment Checklist

Use this checklist to track your deployment progress.

---

## 📋 Pre-Deployment Setup

### Accounts & Access
- [ ] GitHub account created and logged in
- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] Vercel account created ([vercel.com](https://vercel.com))
- [ ] MongoDB Atlas cluster is running
- [ ] Gmail account with 2FA enabled

### Credentials Prepared
- [ ] MongoDB connection string copied
- [ ] JWT_SECRET generated (64+ characters)
- [ ] JWT_REFRESH_SECRET generated (different from above)
- [ ] Gmail App Password generated
- [ ] Redis URL (optional, if using Redis)

### Local Setup
- [ ] All code changes committed
- [ ] `.env` files are NOT committed (check `.gitignore`)
- [ ] Application tested locally
- [ ] No errors in console

---

## 🚀 Deployment Steps

### Step 1: GitHub Repository
- [ ] Git repository initialized (`git init`)
- [ ] All files added (`git add .`)
- [ ] Initial commit created (`git commit -m "Ready for deployment"`)
- [ ] GitHub repository created
- [ ] Remote added (`git remote add origin ...`)
- [ ] Code pushed to GitHub (`git push -u origin main`)

### Step 2: Railway Backend Deployment
- [ ] Logged into Railway dashboard
- [ ] Created new project from GitHub repo
- [ ] Selected `inventory-supermarkets` repository
- [ ] Set root directory to `backend`
- [ ] Added environment variable: `MONGODB_URI`
- [ ] Added environment variable: `JWT_SECRET`
- [ ] Added environment variable: `JWT_REFRESH_SECRET`
- [ ] Added environment variable: `NODE_ENV=production`
- [ ] Added environment variable: `SMTP_USER`
- [ ] Added environment variable: `SMTP_PASS`
- [ ] Added environment variable: `FROM_EMAIL`
- [ ] Added environment variable: `FROM_NAME`
- [ ] Added other optional environment variables
- [ ] Deployment started automatically
- [ ] Deployment completed successfully (green status)
- [ ] Railway URL copied: `https://________________.railway.app`

### Step 3: Vercel Frontend Deployment
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged into Vercel (`vercel login`)
- [ ] Navigated to frontend directory (`cd frontend`)
- [ ] Deployed to production (`vercel --prod`)
- [ ] Added environment variable: `VITE_API_URL` (Railway URL + `/api`)
- [ ] Added environment variable: `VITE_API_BASE_URL` (Railway URL)
- [ ] Added environment variable: `VITE_APP_NAME`
- [ ] Added environment variable: `VITE_DEMO_MODE=false`
- [ ] Added other optional environment variables
- [ ] Deployment completed successfully
- [ ] Vercel URL copied: `https://________________.vercel.app`

### Step 4: CORS Configuration
- [ ] Returned to Railway dashboard
- [ ] Added environment variable: `FRONTEND_URL` (Vercel URL)
- [ ] Railway automatically redeployed
- [ ] Redeployment completed successfully

---

## 🧪 Testing

### Backend Testing
- [ ] Opened Railway URL in browser
- [ ] Health endpoint works: `https://your-app.railway.app/health`
- [ ] API docs accessible: `https://your-app.railway.app/api-docs`
- [ ] No errors in Railway logs

### Frontend Testing
- [ ] Opened Vercel URL in browser
- [ ] Application loads without errors
- [ ] Login page displays correctly
- [ ] No console errors in browser

### Integration Testing
- [ ] Logged in with test credentials
  - Email: `admin@supermarket.com`
  - Password: `Admin@123456`
- [ ] Dashboard loads with data
- [ ] Can navigate between pages
- [ ] Can view products
- [ ] Can create a test sale
- [ ] API calls work (check Network tab)
- [ ] No CORS errors

---

## 🔐 Security Verification

### MongoDB Atlas
- [ ] IP whitelist includes `0.0.0.0/0`
- [ ] Database user has correct permissions
- [ ] Connection string is secure (not exposed)

### Environment Variables
- [ ] All secrets are strong and unique
- [ ] No `.env` files committed to GitHub
- [ ] Production secrets different from development
- [ ] JWT secrets are 64+ characters

### Application Security
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Demo mode disabled (`VITE_DEMO_MODE=false`)

---

## 📊 Post-Deployment

### Database Setup
- [ ] Seed initial data (if needed): `railway run npm run seed:master`
- [ ] Verified admin user exists
- [ ] Verified branches exist
- [ ] Verified products exist

### Monitoring Setup
- [ ] Railway dashboard bookmarked
- [ ] Vercel dashboard bookmarked
- [ ] MongoDB Atlas dashboard bookmarked
- [ ] Email notifications tested

### Documentation
- [ ] Deployment URLs documented
- [ ] Admin credentials stored securely
- [ ] Environment variables backed up securely

---

## 🎯 Optional Enhancements

### Custom Domains
- [ ] Custom domain purchased (optional)
- [ ] Domain added to Railway (backend)
- [ ] Domain added to Vercel (frontend)
- [ ] DNS records configured
- [ ] SSL certificates verified

### Monitoring & Analytics
- [ ] Error tracking setup (optional)
- [ ] Performance monitoring enabled (optional)
- [ ] Analytics configured (optional)

### Backups
- [ ] MongoDB Atlas backups enabled
- [ ] Backup schedule configured
- [ ] Backup restoration tested

---

## ✅ Deployment Complete!

### Your Live URLs

**Frontend**: `https://________________.vercel.app`

**Backend**: `https://________________.railway.app`

**API Docs**: `https://________________.railway.app/api-docs`

### Login Credentials

**Admin Account**:
- Email: `admin@supermarket.com`
- Password: `Admin@123456`

---

## 🔄 Continuous Deployment

- [x] Automatic deployments enabled
- [x] Push to `main` → Railway redeploys backend
- [x] Push to `main` → Vercel redeploys frontend

---

## 📝 Notes & Issues

Use this space to track any issues or notes during deployment:

```
Date: _______________
Issue: 
Solution:

Date: _______________
Issue:
Solution:

Date: _______________
Issue:
Solution:
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Frontend loads without errors
- ✅ Backend API responds correctly
- ✅ Can login with test credentials
- ✅ Dashboard displays data
- ✅ Can perform CRUD operations
- ✅ No CORS errors
- ✅ Email notifications work
- ✅ All user roles function correctly

---

## 🆘 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Railway logs, verify MongoDB URI |
| Frontend blank page | Check browser console, verify API URL |
| CORS errors | Update `FRONTEND_URL` in Railway |
| Can't login | Seed database, check credentials |
| 500 errors | Check Railway logs for details |
| Slow loading | Check MongoDB/Redis connection |

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Status**: ⬜ In Progress  ⬜ Completed  ⬜ Issues

---

**Print this checklist and check off items as you complete them!**
