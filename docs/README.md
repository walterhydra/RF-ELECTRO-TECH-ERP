# RF Electro — PCB Manufacturing ERP System

A production-traceability-first enterprise resource planning system tailored specifically for Printed Circuit Board (PCB) manufacturing.

## Architecture Overview
The system is divided into a robust backend API and a responsive frontend web & mobile PWA application:
- **Backend (`/backend`)**: Built with **NestJS**, **Prisma ORM**, and **PostgreSQL**. Features JWT authentication, 10-role RBAC governance, stage operator scope guards, server-side QR code generation, and automated audit logging.
- **Frontend (`/frontend`)**: Built with **Next.js 14 (App Router)** and **Tailwind CSS**. Features custom PCB copper trace aesthetics (`#f59e0b`), an admin office suite, a shop floor mobile PWA scanner, and an isolated customer order tracking portal.

## Quick Start (Docker Compose)
To launch the entire stack (PostgreSQL, Backend API, and Frontend App) locally using Docker:
```bash
docker-compose up --build -d
```
- Frontend ERP / PWA: `http://localhost:3000`
- Backend API: `http://localhost:3001/api/v1`
- Swagger Documentation: `http://localhost:3001/api/docs`

## Manual Local Setup

### 1. Database & Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init_phase0
npm run seed
npm run start:dev
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```

## Phase 0 Foundation Status
All architectural scaffolding, database schema models (15 models), core governance guards (RBAC, StageScope), audit logging interceptor, standard seed data, and UI layouts are complete and tested. Ready for Phase 1 business module implementation upon approval.
