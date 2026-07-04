# RF Electro PCB Manufacturing ERP — Frontend Application

This repository contains the frontend web application and mobile PWA scanner for the RF Electro PCB Manufacturing ERP system. It is built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and **html5-qrcode**.

## Key Interface Features
- **Admin & Office Portal (`/dashboard`)**: Full ERP suite for planning, CAM, managers, QA, store, and management.
- **Shop Floor Mobile PWA Scanner (`/scan`)**: QR scanner and stage movement interface for operators with offline queueing support.
- **Isolated Customer Portal (`/orders`)**: Scoped client view showing real-time stage progress while redacting internal scrap/rejection rates.
- **Visual PCB Trace Aesthetics**: Dark mode copper trace (`#f59e0b`) progress animations (`TraceLine` component).

## Setup & Development
```bash
# 1. Install dependencies
npm install

# 2. Start Next.js development server
npm run dev
```
Application runs on `http://localhost:3000`
