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

export async function fetchApi(urlOrPath: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')
    ? urlOrPath
    : `${baseUrl}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('bypass-tunnel-reminder', 'true');
  headers.set('Bypass-Tunnel-Reminder', 'true');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(fullUrl, { ...options, headers });
}

