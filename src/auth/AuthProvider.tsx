// src/auth/AuthProvider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearToken as borrarToken, getToken as leerToken, setToken as guardarToken } from './tokenStore';

/** ====== Rutas del backend tomadas de app.json (expo.extra) ====== */
const EXTRA = (Constants.expoConfig?.extra as any) || {};
const API_BASE_URL: string = EXTRA.API_BASE_URL || '';

const LOGIN_PATH = EXTRA.LOGIN_PATH || '/api/login';
const REGISTER_PATH = EXTRA.REGISTER_PATH || '/api/register';
const FORGOT_PATH = EXTRA.FORGOT_PATH || '/api/forgot-password';
const RESET_PASSWORD_PATH = EXTRA.RESET_PASSWORD_PATH || '/api/auth/reset-password';
const CHANGE_PASSWORD_PATH = EXTRA.CHANGE_PASSWORD_PATH || '/api/auth/change-password';
const ME_PATH = EXTRA.ME_PATH || '/api/me';
const PROFILE_PATH = EXTRA.PROFILE_PATH || '/api/profile';
const LOGOUT_PATH = EXTRA.LOGOUT_PATH || '/api/logout';

const TWOFA_SETUP_PATH = EXTRA.TWOFA_SETUP_PATH || '/api/auth/2fa/setup';
const TWOFA_ENABLE_PATH = EXTRA.TWOFA_ENABLE_PATH || '/api/auth/2fa/enable';
const TWOFA_VERIFY_PATH = EXTRA.TWOFA_VERIFY_PATH || '/api/auth/2fa/verify-login';
const TWOFA_STATUS_PATH = EXTRA.TWOFA_STATUS_PATH || '/api/auth/2fa/status';
const TWOFA_DISABLE_PATH = EXTRA.TWOFA_DISABLE_PATH || '/api/auth/2fa/disable';
const TWOFA_BACKUP_REGEN_PATH =
  EXTRA.TWOFA_BACKUP_REGEN_PATH || '/api/auth/2fa/backup-codes/regenerate';

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

export type Resultado = { ok: boolean; error?: string };

/** El login puede terminar en sesión o en "falta el segundo factor". */
export type ResultadoLogin = Resultado & { mfaRequired?: boolean };

export type EstadoTwoFactor = {
  enabled: boolean;
  confirmedAt: string | null;
  backupCodesRemaining: number;
};

export type SetupTwoFactor = { secret: string; otpauthUri: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Auth */
  login: (email: string, password: string) => Promise<ResultadoLogin>;
  register: (form: RegisterForm) => Promise<Resultado>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<Resultado>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<Resultado>;
  /** Perfil */
  refreshMe: () => Promise<void>;
  updateProfile: (patch: Record<string, any>) => Promise<Resultado>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Resultado>;
  /** 2FA */
  hayDesafioPendiente: () => boolean;
  verifyTwoFactor: (code: string, type?: 'totp' | 'backup_code') => Promise<Resultado>;
  cancelTwoFactor: () => void;
  twoFactorStatus: () => Promise<Resultado & { data?: EstadoTwoFactor }>;
  twoFactorSetup: () => Promise<Resultado & { data?: SetupTwoFactor }>;
  twoFactorEnable: (code: string) => Promise<Resultado & { backupCodes?: string[] }>;
  twoFactorDisable: (password: string) => Promise<Resultado>;
  regenerateBackupCodes: (password: string) => Promise<Resultado & { backupCodes?: string[] }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  register: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  logout: async () => { },
  forgotPassword: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  resetPassword: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  refreshMe: async () => { },
  updateProfile: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  changePassword: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  hayDesafioPendiente: () => false,
  verifyTwoFactor: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  cancelTwoFactor: () => { },
  twoFactorStatus: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  twoFactorSetup: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  twoFactorEnable: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  twoFactorDisable: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
  regenerateBackupCodes: async () => ({ ok: false, error: 'AuthProvider no inicializado' }),
});

/** ====== Helpers HTTP ====== */
/** El token ya no vive acá: lo maneja tokenStore (SecureStore, con migración
 *  perezosa desde AsyncStorage). El perfil sí sigue en AsyncStorage — no es
 *  secreto y en Android puede pasar el límite de tamaño de SecureStore. */
const STORAGE_USER = 'auth_user';

function baseTo(path: string) {
  if (!API_BASE_URL) throw new Error('Falta API_BASE_URL en app.json (expo.extra).');
  const clean = API_BASE_URL.replace(/\/+$/, '');
  const root = /\/api(\/|$)/i.test(clean) ? clean.replace(/\/api.*$/i, '') : clean;
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
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data as T;
}

const get = <T,>(path: string, token?: string) => requestJSON<T>('GET', baseTo(path), undefined, token);
const post = <T,>(path: string, body: any, token?: string) => requestJSON<T>('POST', baseTo(path), body, token);
const put = <T,>(path: string, body: any, token?: string) => requestJSON<T>('PUT', baseTo(path), body, token);
const del = <T,>(path: string, token?: string) => requestJSON<T>('DELETE', baseTo(path), undefined, token);

/** ====== Provider ====== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoad] = useState(true);

  /**
   * Token del desafío de 2FA: contraseña ya validada, falta el segundo factor.
   *
   * Va en un ref y NO en storage ni en params de navegación. Con
   * `web.output: "static"`, pasarlo por `router.push({ params })` lo dejaría
   * visible en la URL. Además muere si se cierra la app, que con un TTL de 5
   * minutos es exactamente lo que se quiere.
   */
  const mfaToken = useRef<string | null>(null);

  // Restaurar sesión al abrir. Acá es donde ocurre la migración del token
  // desde AsyncStorage a SecureStore, de forma transparente.
  useEffect(() => {
    (async () => {
      try {
        const [tk, usr] = await Promise.all([
          leerToken(),
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
    mfaToken.current = null;
    await Promise.all([
      guardarToken(nextToken),
      AsyncStorage.setItem(STORAGE_USER, JSON.stringify(nextUser)),
    ]);
  }

  async function clearSession() {
    setToken(null);
    setUser(null);
    mfaToken.current = null;
    await Promise.all([
      borrarToken(),
      AsyncStorage.removeItem(STORAGE_USER),
    ]);
  }

  /** ====== Métodos de Auth ====== */
  const login: AuthContextType['login'] = async (email, password) => {
    try {
      const data = await post<{
        token?: string;
        user?: User;
        mfaRequired?: boolean;
        mfaToken?: string;
      }>(
        LOGIN_PATH,
        // toLowerCase igual que register/forgotPassword: sin esto, quien tipea
        // el email con una mayuscula no matchea la fila y no puede entrar.
        { email: email.trim().toLowerCase(), password }
      );

      // Contraseña correcta pero falta el segundo factor. El backend responde
      // 200 justamente para que esto no caiga en el catch.
      if (data?.mfaRequired && data?.mfaToken) {
        mfaToken.current = data.mfaToken;
        return { ok: true, mfaRequired: true };
      }

      if (!data?.token || !data?.user) throw new Error('Respuesta de login incompleta');
      await persistSession(data.token, data.user);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Error al iniciar sesión' };
    }
  };

  /** ====== 2FA ====== */

  const hayDesafioPendiente: AuthContextType['hayDesafioPendiente'] = () =>
    mfaToken.current !== null;

  const cancelTwoFactor: AuthContextType['cancelTwoFactor'] = () => {
    mfaToken.current = null;
  };

  const verifyTwoFactor: AuthContextType['verifyTwoFactor'] = async (code, type) => {
    if (!mfaToken.current) {
      return { ok: false, error: 'La sesión expiró. Volvé a iniciar sesión.' };
    }
    try {
      const data = await post<{ token: string; user: User }>(TWOFA_VERIFY_PATH, {
        mfaToken: mfaToken.current,
        code: code.trim(),
        ...(type ? { type } : {}),
      });
      if (!data?.token || !data?.user) throw new Error('Respuesta incompleta');
      await persistSession(data.token, data.user);
      return { ok: true };
    } catch (e: any) {
      // Si el desafío se quemó (expirado o sin intentos), se descarta acá para
      // que la pantalla pueda mandar al usuario de vuelta al login.
      if (e.status === 401 && !/incorrecto/i.test(e.message ?? '')) {
        mfaToken.current = null;
      }
      return { ok: false, error: e.message || 'No se pudo verificar el código' };
    }
  };

  const twoFactorStatus: AuthContextType['twoFactorStatus'] = async () => {
    try {
      const data = await get<EstadoTwoFactor>(TWOFA_STATUS_PATH, token ?? undefined);
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo consultar el estado' };
    }
  };

  const twoFactorSetup: AuthContextType['twoFactorSetup'] = async () => {
    try {
      const data = await post<SetupTwoFactor>(TWOFA_SETUP_PATH, {}, token ?? undefined);
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo iniciar la configuración' };
    }
  };

  const twoFactorEnable: AuthContextType['twoFactorEnable'] = async (code) => {
    try {
      const data = await post<{ ok: true; backupCodes: string[] }>(
        TWOFA_ENABLE_PATH,
        { code: code.trim() },
        token ?? undefined
      );
      return { ok: true, backupCodes: data.backupCodes };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo activar' };
    }
  };

  const twoFactorDisable: AuthContextType['twoFactorDisable'] = async (password) => {
    try {
      await post(TWOFA_DISABLE_PATH, { password }, token ?? undefined);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo desactivar' };
    }
  };

  const regenerateBackupCodes: AuthContextType['regenerateBackupCodes'] = async (password) => {
    try {
      const data = await post<{ ok: true; backupCodes: string[] }>(
        TWOFA_BACKUP_REGEN_PATH,
        { password },
        token ?? undefined
      );
      return { ok: true, backupCodes: data.backupCodes };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudieron regenerar los códigos' };
    }
  };

  const register: AuthContextType['register'] = async (form) => {
    try {
      const data = await post<{ token?: string; user?: User; user_id?: string }>(
        REGISTER_PATH,
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(),
          country: form.country.trim(),
          phone: (form.phone || '').trim(),
          language: form.language.trim(),
          password: form.password,
        }
      );
      if (data?.token) {
        let nextUser = data.user;
        if (!nextUser) {
          try {
            nextUser = await get<User>(ME_PATH, data.token);
          } catch {
            if (data.user_id) {
              nextUser = {
                id: data.user_id,
                email: form.email.trim().toLowerCase(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                country: form.country.trim(),
                phone: (form.phone || '').trim(),
                language: form.language.trim(),
              };
            }
          }
        }
        if (nextUser) {
          await persistSession(data.token, nextUser);
        }
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

  const resetPassword: AuthContextType['resetPassword'] = async (email, code, newPassword) => {
    try {
      await post(RESET_PASSWORD_PATH, { email: email.trim().toLowerCase(), code, newPassword });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo restablecer la contraseña' };
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
    } catch (err: any) {
      // Solo limpiamos la sesión si el backend confirma que es inválida;
      // en errores transitorios mantenemos al usuario conectado.
      if (err?.status === 401 || err?.status === 403) {
        await clearSession();
      }
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

  const changePassword: AuthContextType['changePassword'] = async (currentPassword, newPassword) => {
    try {
      if (!token) throw new Error('No hay sesión');
      await post(CHANGE_PASSWORD_PATH, { currentPassword, newPassword }, token);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'No se pudo cambiar la contraseña' };
    }
  };

  const value = useMemo(
    () => ({
      user, token, loading,
      login, register, logout, forgotPassword, resetPassword,
      refreshMe, updateProfile, changePassword,
      hayDesafioPendiente, cancelTwoFactor, verifyTwoFactor,
      twoFactorStatus, twoFactorSetup, twoFactorEnable, twoFactorDisable,
      regenerateBackupCodes,
    }),
    // Las funciones se redefinen en cada render pero solo dependen de `token`,
    // que ya está en la lista. Incluirlas obligaría a memoizar las 15.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  if (!user) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
