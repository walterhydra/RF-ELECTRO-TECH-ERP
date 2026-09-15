import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl(): string {
  // Check env var first (works both SSR and CSR)
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    let cleaned = envUrl.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned.endsWith('/api/v1') ? cleaned : (cleaned.endsWith('/') ? `${cleaned}api/v1` : `${cleaned}/api/v1`);
  }

  if (typeof window !== 'undefined') {
    // Purge legacy localtunnel overrides if present in browser storage
    const savedApiHost = localStorage.getItem('erp_backend_api_url') || localStorage.getItem('erp_qr_server_host');
    if (savedApiHost && savedApiHost.includes('loca.lt')) {
      localStorage.removeItem('erp_backend_api_url');
      localStorage.removeItem('erp_qr_server_host');
    }

    // Check explicit localStorage override (user custom server IP or custom cloud URL)
    const validSavedHost = localStorage.getItem('erp_backend_api_url');
    if (validSavedHost && validSavedHost.trim() !== '') {
      let cleaned = validSavedHost.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `https://${cleaned}`;
      }
      return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
    }

    // Handle Vercel deployment hostname fallback if env var wasn't set or HTTPS external access
    const hostname = window.location.hostname || 'localhost';
    if (hostname.includes('vercel.app') || (window.location.protocol === 'https:' && !hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
      return 'https://rf-electro-tech-erp.onrender.com/api/v1';
    }

    // Default LAN / Localhost resolution
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${hostname}:3001/api/v1`;
  }

  return envUrl || 'https://rf-electro-tech-erp.onrender.com/api/v1';
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

