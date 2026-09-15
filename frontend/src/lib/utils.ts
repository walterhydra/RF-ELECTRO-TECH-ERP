import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    const hostname = window.location.hostname || 'localhost';
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${hostname}:3001/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
}

