# BookMart Admin Server

Dedicated Administrative Backend microservice/server for BookMart, connected to the same shared MongoDB database (`mongodb://localhost:27017/bookmart`).

Runs on **Port 5001** (`http://127.0.0.1:5001`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd admin-server
npm install
```

### 2. Seed Default Admin User
```bash
npm run seed:admin
```
> **Default Admin Credentials:**
> - **Email:** `admin@bookmart.com`
> - **Password:** `Admin@123456`

### 3. Start Development Server
```bash
npm run dev
```

From the root project directory:
```bash
npm run admin
```

---

## 📡 API Endpoints Overview

All endpoints (except login, refresh, logout, and health) require an authenticated admin session (`adminAccessToken` cookie or `Authorization: Bearer <token>`).

### 1. Authentication (`/api/admin/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | Log in as administrator | Public |
| `POST` | `/api/admin/auth/refresh` | Refresh admin access token | Public (Cookie) |
| `POST` | `/api/admin/auth/logout` | Log out and destroy session cookies | Public |
| `GET`  | `/api/admin/auth/me` | Fetch active admin profile | Admin |
| `POST` | `/api/admin/auth/register-admin` | Create a new administrator account | Admin |

### 2. Analytics & Dashboard (`/api/admin/dashboard`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Aggregated catalog, stock, user, and financial stats | Admin |
| `GET` | `/api/admin/dashboard/activity` | Audit logs of all admin actions | Admin |

### 3. Book Catalog Management (`/api/admin/books`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET`    | `/api/admin/books` | List books with search, filters (stock, price, category), pagination | Admin |
| `GET`    | `/api/admin/books/:id` | Fetch detailed book record | Admin |
| `POST`   | `/api/admin/books` | Create a new book | Admin |
| `PUT`    | `/api/admin/books/:id` | Update existing book details | Admin |
| `DELETE` | `/api/admin/books/:id` | Delete book | Admin |
| `POST`   | `/api/admin/books/bulk-delete` | Delete multiple books by array of IDs | Admin |
| `PATCH`  | `/api/admin/books/:id/toggle-featured` | Toggle book's `isFeatured` flag | Admin |
| `PATCH`  | `/api/admin/books/:id/toggle-bestseller` | Toggle book's `isBestseller` flag | Admin |
| `PATCH`  | `/api/admin/books/:id/stock` | Update stock quantity | Admin |
| `POST`   | `/api/admin/books/seed` | Reset & reseed sample books into the shared DB | Admin |

### 4. User & Role Management (`/api/admin/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET`    | `/api/admin/users` | List all users (pagination, search, role filter) | Admin |
| `GET`    | `/api/admin/users/:id` | Get user profile details | Admin |
| `POST`   | `/api/admin/users` | Create new user or admin account | Admin |
| `PUT`    | `/api/admin/users/:id/role` | Change user role (`user` <-> `admin`) | Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user account (prevents self-deletion) | Admin |

### 5. System & Health (`/api/admin/system`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Basic server & DB ping | Public |
| `GET` | `/api/admin/health` | Admin service ping | Public |
| `GET` | `/api/admin/system/health` | Diagnostic metrics (uptime, memory, DB collections) | Admin |

---

## ⚙️ Environment Variables (`.env`)

```env
MONGO_URI=mongodb://localhost:27017/bookmart
PORT=5001
JWT_SECRET=bookmart_super_secret_jwt_key_2024
JWT_REFRESH_SECRET=bookmart_refresh_secret_key_2024_secure
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ADMIN_CLIENT_URL=http://localhost:5174
```
