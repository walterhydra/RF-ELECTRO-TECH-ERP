import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Check explicit localStorage override (user custom server IP or tunnel URL)
    const savedApiHost = localStorage.getItem('erp_backend_api_url') || localStorage.getItem('erp_qr_server_host');
    if (savedApiHost && savedApiHost.trim() !== '') {
      let cleaned = savedApiHost.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `https://${cleaned}`;
      }
      return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
    }

    // 2. Check environment variable NEXT_PUBLIC_API_URL
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.trim() !== '') {
      let cleaned = envUrl.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `https://${cleaned}`;
      }
      return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
    }

    // 3. Handle Vercel deployment (e.g. rf-electrotech.vercel.app)
    const hostname = window.location.hostname || 'localhost';
    if (hostname.includes('vercel.app')) {
      return 'https://rf-electro-erp.loca.lt/api/v1';
    }

    // 4. Default LAN / Localhost resolution
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${hostname}:3001/api/v1`;
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    let cleaned = envUrl.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
  }
  return 'http://localhost:3001/api/v1';
}

