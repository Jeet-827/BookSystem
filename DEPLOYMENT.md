# 🚀 Complete Deployment Guide: Vercel & Render

This guide provides step-by-step instructions to deploy the BookMart full-stack application using the industry standard setup:
- **Frontend (React + Vite)**: Deployed on **[Vercel](https://vercel.com)** (Edge CDN, instant global invalidation, automated PR previews).
- **Backend (Express + Node.js)**: Deployed on **[Render](https://render.com)** (Long-running Node Web Service with persistent connection to MongoDB Atlas).
- **Database**: **[MongoDB Atlas](https://www.mongodb.com/atlas)** (Free tier cloud database).

---

## 🌟 Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              User's Browser                  │
                      └──────────────┬───────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
    ┌──────────────────────────┐            ┌──────────────────────────┐
    │     Vercel Platform      │            │       Render Cloud       │
    │  (bookmart.vercel.app)   │            │ (bookmart-api.onrender)  │
    │                          │            │                          │
    │   • React 18 + Vite SPA  │  API Req   │   • Express Unified API  │
    │   • Tailwind + Redux     ├───────────►│   • Port 5000 /api       │
    │   • vercel.json rewrites │   with     │   • Rate Limiting & Auth │
    │   • Edge CDN Caching     │   Cookies  │   • Admin Order Portal   │
    └──────────────────────────┘            └────────────┬─────────────┘
                                                         │
                                                         ▼
                                            ┌──────────────────────────┐
                                            │      MongoDB Atlas       │
                                            │    Cloud Database URI    │
                                            └──────────────────────────┘
```

---

## 📦 Step 1: Set Up MongoDB Atlas Database (Free Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a **Shared (Free M0)** cluster.
3. Under **Security &rarr; Database Access**, create a database user:
   - Example username: `bookmart_admin`
   - Example password: `<your_secure_password>`
4. Under **Security &rarr; Network Access**, click **Add IP Address** &rarr; select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** &rarr; **Drivers** &rarr; copy your connection string:
   ```
   mongodb+srv://bookmart_admin:<your_password>@cluster0.mongodb.net/bookmart?retryWrites=true&w=majority
   ```

---

## 🚀 Step 2: Deploy Backend to Render.com

### Option A: Render Blueprint (1-Click Automated Setup)
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. In your [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Blueprint**.
3. Select your GitHub repository (`Jeet-827/BookSystem`).
4. Render automatically reads [`render.yaml`](./render.yaml).
5. Set your **`MONGO_URI`** to your Atlas connection string.
6. Click **Apply** to deploy.

---

### Option B: Manual Web Service Setup (Step-by-Step)
1. In your [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `bookmart-backend`
   - **Region**: Closest to you (e.g., *Singapore*, *Frankfurt*, *Oregon*)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Port for Express server |
   | `MONGO_URI` | `mongodb+srv://.../bookmart` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | *(Random 32+ character string)* | Sign secret for access tokens |
   | `JWT_REFRESH_SECRET` | *(Random 32+ character string)* | Sign secret for refresh tokens |
   | `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (or leave blank initially) |
5. Click **Create Web Service**.
6. Once deployed, note down your backend URL (e.g. `https://bookmart-backend.onrender.com`).
   - Test it by opening: `https://bookmart-backend.onrender.com/api/health`

---

## ⚡ Step 3: Deploy Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository (`Jeet-827/BookSystem`).
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`** (or leave root since root [`vercel.json`](./vercel.json) is pre-configured).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://bookmart-backend.onrender.com/api` *(Your Render backend URL from Step 2 + /api)* |
6. Click **Deploy**.
7. Vercel will build the frontend and provide your production URL (e.g., `https://bookmart-xyz.vercel.app`).
8. Notice that client-side routes like `/books`, `/checkout`, `/orders`, and `/admin` work on page refresh thanks to [`frontend/vercel.json`](./frontend/vercel.json).

---

## 🔗 Step 4: Link Vercel & Render (CORS & Cookie Whitelisting)

1. Return to your Render backend web service.
2. Go to **Environment** &rarr; edit `CLIENT_URL`:
   - Set `CLIENT_URL`: `https://bookmart-xyz.vercel.app` *(Your actual Vercel URL)*
3. Save changes. Render will automatically perform a fast zero-downtime redeploy.
4. *Bonus:* The backend's CORS configuration already automatically allows all `*.vercel.app` domains dynamically, so your PR preview deployments will also work out of the box!

---

## 🛠️ Step 5: Seed Sample eBooks into Production Database

To populate your live production MongoDB database with the sample eBooks:

From your local machine terminal:
```bash
# Temporarily set your Atlas URI and run seeder:
MONGO_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/bookmart" node backend/seed.js
```
*Alternatively, simply open the app! The backend automatically self-populates the initial catalog of eBooks when it starts if the database is empty!*

---

## 🧪 Post-Deployment Verification Checklist

1. [ ] **Storefront**: Open your Vercel URL &rarr; verify the catalog loads, categories filter smoothly, and eBook covers display.
2. [ ] **Registration & Login**: Register a test account &rarr; check that session persists via HTTP-only cookies.
3. [ ] **Cart & Checkout**:
   - Add eBooks to cart.
   - Click *Proceed to Payment* &rarr; redirected to `/checkout`.
   - Test payment methods (Card, UPI, Net Banking, Wallet) with coupons (`READMORE` or `BOOK20`).
   - Click *Pay & Download eBooks* &rarr; payment succeeds.
4. [ ] **Instant Download**: Verify download buttons trigger on the confirmation screen and under `/orders` (My Offline Library).
5. [ ] **Admin Portal**: Navigate to `/admin` &rarr; verify digital orders, transaction IDs, and stats appear.
