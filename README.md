# RF ELECTRO TECH ERP System

A full-featured Enterprise Resource Planning (ERP) platform for PCB Manufacturing, Job Launching, Barcode Movement, Customer Management, Dispatching, and Daily Reporting.

---

## 📁 Repository Architecture

```text
RF ELECTRO ERP/
├── backend/                  # NestJS REST API Backend
│   ├── src/
│   │   ├── modules/          # Domain Modules (job-cards, auth, customers, etc.)
│   │   ├── prisma/           # Database Service & Schema Integration
│   │   ├── common/           # Guards, Filters, Interceptors, Decorators
│   │   └── config/           # Application Configuration
│   ├── prisma/               # Prisma Schema & Database Migrations/Seeds
│   └── package.json
│
├── frontend/                 # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router Pages & API Routes
│   │   ├── components/       # UI Components & Layouts
│   │   ├── lib/              # API Clients & Utility Helpers
│   │   └── styles/           # Global Stylesheets & Tailwind Configuration
│   └── package.json
│
├── docs/                     # System Documentation & Specifications
│   ├── specs/                # Feature Specifications & Requirements
│   ├── ERP_DOCUMENTATION_ANALYSIS.md
│   ├── PROJECT_STRUCTURE_GUIDE.md
│   └── project_setup_and_architecture.md
│
├── ERP FULL DOCUMENT/        # Master PRD, TRD, UI/UX Specs & Media Reference
├── docker-compose.yml        # Local PostgreSQL Container Configuration
└── README.md                 # System Overview & Getting Started Guide
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm / yarn
- PostgreSQL >= 14 (or Docker Desktop)

### 1. Database Setup
Start local PostgreSQL via Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```
The NestJS API server will run at `http://localhost:3001` (or configured `PORT`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Next.js Web App will run at `http://localhost:3000`.

---

## 🛠 Tech Stack

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Passport JWT, Swagger.
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Infrastructure**: Docker, Render / Cloud Hosting ready.
