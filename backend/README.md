# RF Electro PCB Manufacturing ERP — Backend API

This repository contains the backend service for the RF Electro PCB Manufacturing ERP system. It is built with **NestJS**, **Prisma ORM**, and **PostgreSQL 15+**, featuring JWT authentication, 10-role RBAC governance, server-side QR code generation, and automated audit logging.

## Prerequisites
- Node.js v20+ or v22+ LTS
- PostgreSQL 15+
- npm v10+

## Setup & Development
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations & seed database
npx prisma migrate dev --name init_phase1
npm run seed

# 4. Start development server
npm run start:dev
```
API runs on `http://localhost:3001/api/v1`  
Swagger Documentation: `http://localhost:3001/api/docs`
