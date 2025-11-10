// src/auth/AuthProvider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/** ====== Rutas del backend tomadas de app.json (expo.extra) ====== */
const EXTRA = (Constants.expoConfig?.extra as any) || {};
const API_BASE_URL: string = EXTRA.API_BASE_URL || '';

const LOGIN_PATH    = EXTRA.LOGIN_PATH    || '/api/login';
const REGISTER_PATH = EXTRA.REGISTER_PATH || '/api/register';
const FORGOT_PATH   = EXTRA.FORGOT_PATH   || '/api/forgot-password';
const ME_PATH       = EXTRA.ME_PATH       || '/api/me';
const PROFILE_PATH  = EXTRA.PROFILE_PATH  || '/api/profile';
const LOGOUT_PATH   = EXTRA.LOGOUT_PATH   || '/api/logout';

/** ====== Tipos ====== */
export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  [k: string]: any;
};

export type RegisterForm = {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  phone?: string;
  language: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Auth */
  login:   (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register:(form: RegisterForm)              => Promise<{ ok: boolean; error?: string }>;
  logout:  () => Promise<void>;
  forgotPassword: (email: string)            => Promise<{ ok: boolean; error?: string }>;
  /** Perfil */
  refreshMe: () => Promise<void>;
  updateProfile: (patch: Record<string, any>) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  register: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  logout: async () => {},
  forgotPassword: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  refreshMe: async () => {},
  updateProfile: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
});

/** ====== Helpers HTTP ====== */
const STORAGE_TOKEN = 'auth_token';
const STORAGE_USER  = 'auth_user';

function baseTo(path: string) {
  if (!API_BASE_URL) throw new Error('Falta API_BASE_URL en app.json (expo.extra).');
  const clean = API_BASE_URL.replace(/\/+$/, '');
  const root  = /\/api(\/|$)/i.test(clean) ? clean.replace(/\/api.*$/i, '') : clean;
  return `${root}${path}`;
}

async function requestJSON<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any,
  token?: string
): Promise<T> {
  if (__DEV__) console.log(`[${method}]`, url, body ?? '');
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = (data?.error || data?.message || `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data as T;
}

const get  = <T,>(path: string, token?: string)      => requestJSON<T>('GET',  baseTo(path), undefined, token);
const post = <T,>(path: string, body: any, token?: string) => requestJSON<T>('POST', baseTo(path), body, token);
const put  = <T,>(path: string, body: any, token?: string) => requestJSON<T>('PUT',  baseTo(path), body, token);
const del  = <T,>(path: string, token?: string)      => requestJSON<T>('DELETE', baseTo(path), undefined, token);

/** ====== Provider ====== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoad]  = useState(true);

  // Restaurar sesión al abrir
  useEffect(() => {
    (async () => {
      try {
        const [tk, usr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOKEN),
          AsyncStorage.getItem(STORAGE_USER),
        ]);
        if (tk) setToken(tk);
        if (usr) setUser(JSON.parse(usr));
        // Si hay token pero el usuario guardado está viejo, refrescamos silenciosamente
        if (tk && !usr) await safeRefreshMe(tk);
      } finally {
        setLoad(false);
      }
    })();
  }, []);

  async function persistSession(nextToken: string, nextUser: User) {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_TOKEN, nextToken),
      AsyncStorage.setItem(STORAGE_USER, JSON.stringify(nextUser)),
    ]);
  }

  async function clearSession() {
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_TOKEN),
      AsyncStorage.removeItem(STORAGE_USER),
    ]);
  }

  /** ====== Métodos de Auth ====== */
  const login: AuthContextType['login'] = async (email, password) => {
    try {
      const data = await post<{ token: string; user: User }>(
        LOGIN_PATH,
        { email: email.trim(), password }
      );
      if (!data?.token || !data?.user) throw new Error('Respuesta de login incompleta');
      await persistSession(data.token, data.user);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Error al iniciar sesión' };
    }
  };

  const register: AuthContextType['register'] = async (form) => {
    try {
      const data = await post<{ token?: string; user?: User; user_id?: string }>(
        REGISTER_PATH,
        {
          first_name: form.first_name.trim(),
          last_name : form.last_name.trim(),
          email     : form.email.trim().toLowerCase(),
          country   : form.country.trim(),
          phone     : (form.phone || '').trim(),
          language  : form.language.trim(),
          password  : form.password,
        }
      );
      // Si la API devuelve token+user (registro + login), persistimos;
      // si solo devuelve user_id, dejamos al front en estado "no logueado".
      if (data?.token && data?.user) {
        await persistSession(data.token, data.user);
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Error al registrar' };
    }
  };

  const forgotPassword: AuthContextType['forgotPassword'] = async (email) => {
    try {
      await post(FORGOT_PATH, { email: email.trim().toLowerCase() });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo enviar el enlace' };
    }
  };

  const logout: AuthContextType['logout'] = async () => {
    try {
      // Si tu back tiene endpoint de logout, lo llamamos (tolerante a fallo)
      if (token && LOGOUT_PATH) {
        try { await post(LOGOUT_PATH, {}, token); } catch { /* noop */ }
      }
    } finally {
      await clearSession();
    }
  };

  /** ====== Perfil ====== */
  async function safeRefreshMe(tk: string) {
    try {
      const me = await get<User>(ME_PATH, tk);
      setUser(me);
      await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(me));
    } catch {
      // Si falla (token inválido), limpiamos
      await clearSession();
    }
  }

  const refreshMe: AuthContextType['refreshMe'] = async () => {
    if (!token) return;
    await safeRefreshMe(token);
  };

  const updateProfile: AuthContextType['updateProfile'] = async (patch) => {
    try {
      if (!token) throw new Error('No hay sesión');
      const updated = await put<User>(PROFILE_PATH, patch, token);
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(updated));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo actualizar el perfil' };
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, forgotPassword, refreshMe, updateProfile }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook del contexto */
export function useAuth() {
  return useContext(AuthContext);
}

/** Componente de guardia para proteger pantallas privadas */
export function AuthGate({
  children,
  fallback,
  loadingFallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  if (loading) return <>{loadingFallback ?? null}</>;
  if (!user)  return <>{fallback ?? null}</>;
  return <>{children}</>;
}


