
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl(): string {
  // If running in browser
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    const hostname = window.location.hostname || 'localhost';
    const isVercel = hostname.includes('vercel.app') || isHttps;

    // Purge legacy localtunnel / invalid localhost overrides if present in browser storage
    const savedApiHost = localStorage.getItem('erp_backend_api_url') || localStorage.getItem('erp_qr_server_host');
    if (
      savedApiHost &&
      (savedApiHost.includes('loca.lt') || (isVercel && (savedApiHost.includes('localhost') || savedApiHost.startsWith('http://') || savedApiHost.includes('192.168.') || savedApiHost.includes('127.0.0.1'))))
    ) {
      localStorage.removeItem('erp_backend_api_url');
      localStorage.removeItem('erp_qr_server_host');
    }

    // Check explicit localStorage override (only if valid HTTPS or matching environment)
    const validSavedHost = localStorage.getItem('erp_backend_api_url');
    if (validSavedHost && validSavedHost.trim() !== '') {
      let cleaned = validSavedHost.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = isHttps ? `https://${cleaned}` : `http://${cleaned}`;
      }
      return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
    }

    // If on Vercel or any HTTPS cloud deployment, always use Render Cloud Backend
    if (isVercel) {
      return 'https://rf-electro-tech-erp.onrender.com/api/v1';
    }

    // Default LAN / Localhost resolution for local dev
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${hostname}:3001/api/v1`;
  }

  // Check env var first (works both SSR and CSR)
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    let cleaned = envUrl.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned.endsWith('/api/v1') ? cleaned : (cleaned.endsWith('/') ? `${cleaned}api/v1` : `${cleaned}/api/v1`);
  }

  return 'https://rf-electro-tech-erp.onrender.com/api/v1';
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

/**
 * Compresses an image file (e.g. from camera/phone or local file upload)
 * down to max dimensions and JPEG/PNG quality, preventing huge 10MB+ payload transfers
 * while preserving crystal-clear readability for technical documents and job cards.
 */
export function compressImageFile(file: File, maxDimension = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

