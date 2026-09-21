# 🚀 Deployment Guide for Render.com

This guide provides step-by-step instructions to deploy the BookMart application on [Render](https://render.com).

---

## ⚡ Option 1: One-Click Blueprint Deployment (Recommended)

1. Push this repository to GitHub:
   ```bash
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** &rarr; Select **"Blueprint"**.
4. Connect your repository: `https://github.com/Jeet-827/BookSystem.git`.
5. Render will detect `render.yaml` and automatically configure:
   - `bookmart-frontend` (Static Site with SPA rewrite rules)
   - `bookmart-backend` (Node Web Service on port 5000)
   - `bookmart-admin-server` (Node Web Service on port 5001)
6. Fill in your **`MONGO_URI`** (e.g. MongoDB Atlas connection string).
7. Click **"Apply"** to deploy all services together.

---

## 🛠️ Option 2: Manual Service-by-Service Deployment

### 1. Customer Backend API (`bookmart-backend`)
- **Service Type**: Web Service
- **Runtime**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=5000
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bookmart?retryWrites=true&w=majority
  JWT_SECRET=your_super_secret_jwt_key
  JWT_REFRESH_SECRET=your_super_secret_refresh_key
  CLIENT_URL=https://your-frontend-url.onrender.com
  ```

---

### 2. Admin Management Server (`bookmart-admin-server`)
- **Service Type**: Web Service
- **Runtime**: Node
- **Root Directory**: `admin-server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=5001
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bookmart?retryWrites=true&w=majority
  JWT_SECRET=your_super_secret_jwt_key
  JWT_REFRESH_SECRET=your_super_secret_refresh_key
  ADMIN_DEFAULT_EMAIL=admin@bookmart.com
  ADMIN_DEFAULT_PASSWORD=Admin@123456
  CLIENT_URL=https://your-frontend-url.onrender.com
  ```

---

### 3. Customer Frontend (`bookmart-frontend`)
- **Service Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Redirects / Rewrites**:
  - `/*` &rarr; `/index.html` (Status `200 - Rewrite`)
- **Environment Variables**:
  ```env
  VITE_API_BASE_URL=https://bookmart-backend.onrender.com/api
  ```

---

## 🧪 Post-Deployment Verification Checklist

1. [ ] Access frontend URL (`https://your-frontend.onrender.com`) and verify book catalog loads.
2. [ ] Test User Registration and Login.
3. [ ] Access `/admin` (`https://your-frontend.onrender.com/admin`) and login with `admin@bookmart.com` / `Admin@123456`.
4. [ ] Verify creating, editing, and deleting a book from the Admin Dashboard.
