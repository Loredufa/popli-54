// src/api/useApi.ts
import Constants from 'expo-constants';
import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';

function baseTo(path: string) {
  const base = (Constants.expoConfig?.extra as any)?.API_BASE_URL as string;
  const clean = base.replace(/\/+$/, '');
  const root = /\/api(\/|$)/i.test(clean) ? clean.replace(/\/api.*$/i, '') : clean;
  // Asegura que path tenga un solo slash inicial
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${root}${normalizedPath}`;
}

export function useApi() {
  const { token } = useAuth();

  return useMemo(() => {
    async function request<T>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      path: string,
      body?: any
    ): Promise<T> {
      const url = baseTo(path);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Solo mandamos Content-Type si hay body (POST/PUT)
        ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      };

      // DEBUG: podés comentar estos logs en producción
      console.log('[API]', method, url);
      if (body != null) console.log('[API:body]', body);

      const res = await fetch(url, {
        method,
        headers,
        ...(body != null ? { body: JSON.stringify(body) } : {}),
      });

      // Leemos texto primero para poder mostrar errores del back aunque no sean JSON
      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* no era JSON */ }

      console.log('[API:status]', res.status);
      if (!res.ok) {
        console.log('[API:error]', raw);
        const msg =
          (data && (data.error || data.message)) ||
          raw ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      return (data as T) ?? ({} as T);
    }

    return {
      get : <T>(path: string)           => request<T>('GET', path),
      post: <T>(path: string, body: any) => request<T>('POST', path, body),
      put : <T>(path: string, body: any) => request<T>('PUT', path, body),
      del : <T>(path: string)           => request<T>('DELETE', path),
    };
  }, [token]);
}

