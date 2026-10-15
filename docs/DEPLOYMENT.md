# Deployment Guide: eLabs Registration System on Render

This guide outlines the production deployment of the **eLabs Student Registration and Event Management System** on [Render](https://render.com) with HTTPS, managed PostgreSQL, a Node.js backend Web Service, and a React + Vite Static Site.

---

## Architecture Overview

```
[ Clients / Browsers ]
        │
        ├── HTTPS ──► [ Frontend Static Site (Render CDN) ]
        │                     │
        │             REST API Requests (withCredentials: true)
        │                     ▼
        └── HTTPS ──► [ Backend Web Service (Render Node) ]
                              │
                      PostgreSQL Connection (SSL)
                              ▼
                      [ Neon Cloud / Render PostgreSQL ]
```

---

## 1. PostgreSQL Database Setup

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **PostgreSQL**.
3. Configure the database:
   - **Name:** `elabs-postgres`
   - **Database:** `elabs_registration_db`
   - **User:** `elabs_user`
   - **Region:** Singapore (`singapore`) or closest to your users.
   - **Plan:** Free or Starter.
4. Once provisioned, copy the **Internal Database URL** (for Render web services) or **External Database URL** (for local CLI migration).

### Running Initial Migrations on Render PostgreSQL

From your local terminal with `DATABASE_URL` pointed to your Render/Neon PostgreSQL instance:

```bash
cd backend
# Set your production database URL
export DATABASE_URL="postgres://elabs_user:PASSWORD@host.render.com/elabs_registration_db?sslmode=require"
export DB_SSL="true"

# Run schema and seed scripts
npm run db:migrate
npm run db:seed
```

---

## 2. Backend Web Service Deployment

1. On the Render Dashboard, click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name:** `elabs-registration-api`
   - **Region:** Same region as your database.
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci --only=production`
   - **Start Command:** `node src/server.js`
   - **Plan:** Free or Starter.

### Environment Variables for Backend

Navigate to **Environment** under your Web Service and add:

| Variable | Recommended Value / Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | `production` |
| `PORT` | `10000` (Render default) or `5000` | `10000` |
| `DATABASE_URL` | Render Internal Database URL or Neon Cloud URL | `postgres://user:pass@host/db?sslmode=require` |
| `DB_SSL` | Enable SSL for managed PostgreSQL | `true` |
| `JWT_SECRET` | 64+ character random string | `6f9c2d1b7a8e4f50...` |
| `JWT_EXPIRES_IN` | Token expiration period | `7d` |
| `FRONTEND_URL` | URL of your deployed frontend | `https://elabs-events.onrender.com` |

> [!NOTE]
> Render automatically provisions a free TLS/SSL certificate for your service `https://elabs-registration-api.onrender.com`.

---

## 3. Frontend Static Site Deployment

1. Click **New +** > **Static Site**.
2. Connect the same Git repository.
3. Configure static site settings:
   - **Name:** `elabs-events`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### Environment Variables & Routing for Frontend

1. **Environment Variables:**
   - `VITE_API_URL`: `https://elabs-registration-api.onrender.com`
2. **Single Page Application (SPA) Rewrite Rules:**
   - Go to **Redirects / Rewrites** in your Static Site dashboard.
   - Add rule:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`

---

## 4. Verification & Health Monitoring

1. **Backend Health Check:**
   ```bash
   curl -s https://elabs-registration-api.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "uptime": 42,
     "db": "connected",
     "timestamp": "2026-10-15T03:30:00.000Z"
   }
   ```
2. **Access Frontend:**
   Navigate to `https://elabs-events.onrender.com`. Register a student account or log in with the seed credentials.
