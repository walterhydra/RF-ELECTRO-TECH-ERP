# RF Electro Tech ERP - System Architecture & Deployment Guide

This document provides a complete overview of the project's architecture, hosting environments, connection flows, and deployment steps.

## 1. System Overview (3-Tier Architecture)

The application follows a modern decoupled 3-tier architecture:
- **Frontend (UI):** Built with React (Next.js) & TailwindCSS.
- **Backend (API):** Built with Node.js (NestJS).
- **Database:** PostgreSQL managed via Prisma ORM.

### Connection Flow
`User Browser (Vercel)` ➡️ `API Requests (Render)` ➡️ `Database Queries (Neon)`

---

## 2. Hosting & Infrastructure

| Component | Technology | Hosting Platform | URL / Endpoint |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | **Neon** (`neon.tech`) | `postgresql://...` (Stored in `.env`) |
| **Backend** | NestJS | **Render** (`render.com`) | `https://rf-electro-tech-erp.onrender.com` |
| **Frontend** | Next.js | **Vercel** (`vercel.com`) | `https://rf-electro-tech-erp.vercel.app` (Example) |

---

## 3. Deployment Flow (Step-by-Step)

Whenever you want to deploy a new feature, follow this flow:

1. **GitHub Push:** Commit and push your code to the `main` branch.
   ```bash
   git add .
   git commit -m "Your feature description"
   git push origin main
   ```
2. **Backend (Render) Auto-Deploy:** Render will automatically detect the new commit on GitHub and start building the backend.
3. **Frontend (Vercel) Auto-Deploy:** Vercel will automatically detect the new commit and deploy the latest frontend.

*(Note: Database changes require running Prisma migrations on the backend during the build process, which is already configured in Render's Build Command).*

---

## 4. Environment Variables Reference

For the application to run successfully, specific environment variables must be configured in each environment.

### Backend (`backend/.env`) - Set in Render
```env
# Database Connection
DATABASE_URL="postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require"

# JWT Secret for Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
```

### Frontend (`frontend/.env.local`) - Set in Vercel
```env
# Backend API URLs
NEXT_PUBLIC_API_BASE_URL="https://rf-electro-tech-erp.onrender.com/api/v1"
NEXT_PUBLIC_PORTAL_API_URL="https://rf-electro-tech-erp.onrender.com/api/v1/portal"
```

---

## 5. Local Development Guide

To run the project locally on your machine for testing or development:

### A. Start the Backend
1. Open terminal in `backend` folder.
2. Run `npm install` (if first time).
3. Ensure `.env` has the `DATABASE_URL`.
4. Run `npm run start:dev`.
5. Backend will start at `http://localhost:10000`.

### B. Start the Frontend
1. Open terminal in `frontend` folder.
2. Run `npm install` (if first time).
3. Ensure `.env` has local API URLs pointing to `http://localhost:10000/api/v1`.
4. Run `npm run dev`.
5. Frontend will start at `http://localhost:3000`.

---

## 6. Database Management (Prisma)

Important commands for managing the PostgreSQL database (Run inside the `backend` folder):

- `npx prisma generate`: Updates the Prisma Client after schema changes.
- `npx prisma db push`: Pushes the current schema to the database (used in rapid development).
- `npx prisma migrate dev`: Creates a migration file and applies it (used for production tracking).
- `npm run seed`: Inserts demo/initial data into the database.

---

## 7. API Documentation (Swagger)

The backend has auto-generated Swagger documentation. You can test all endpoints, view required JSON payloads, and see response structures.

- **Live URL:** `https://rf-electro-tech-erp.onrender.com/api/docs`
- **Local URL:** `http://localhost:10000/api/docs`

---

## 8. Summary of What Was Done

1. Initialized GitHub Repository and pushed the entire source code.
2. Created a PostgreSQL database instance on Neon and retrieved the Connection String.
3. Configured Render for the backend:
   - Build Command: `npm install && npm run build && npx prisma generate && npx prisma db push && npm run seed`
   - Start Command: `node dist/src/main.js` (Fixed from `dist/main.js`).
4. Resolved a Vercel build issue by recreating the missing `frontend/src/lib/utils.ts` file for Tailwind/Shadcn.
5. Successfully connected Frontend (Vercel) to Backend (Render) using Environment Variables.
