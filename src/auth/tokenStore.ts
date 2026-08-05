import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Guarda el token de sesion.
 *
 * Antes vivia en AsyncStorage en claro, que es incoherente con tener 2FA: el
 * token ES la sesion, cualquiera que lo lea entra sin contraseña ni segundo
 * factor. Ahora va al keychain/keystore del sistema.
 *
 * La migracion es perezosa: la primera vez que la app arranca con esta version,
 * el token viejo se promueve a SecureStore y se limpia el rastro. Nadie se
 * desloguea.
 */

export const CLAVE_TOKEN = 'auth_token';

/**
 * SecureStore no existe en web y este proyecto compila a web estatico
 * (`web.output: "static"`). Sin este branch la build web se rompe.
 * El branch vive acá adentro: AuthProvider no se entera.
 */
const enWeb = Platform.OS === 'web';

/** En Android hay un limite practico de ~2048 bytes por valor. El token de
 *  Lucia son ~40 caracteres, asi que entra sobrado. El perfil del usuario NO
 *  se guarda acá: no es secreto y podria pasarse. */
const OPCIONES: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export async function setToken(token: string): Promise<void> {
  if (enWeb) {
    await AsyncStorage.setItem(CLAVE_TOKEN, token);
    return;
  }
  await SecureStore.setItemAsync(CLAVE_TOKEN, token, OPCIONES);
}

/**
 * Devuelve el token, migrando desde AsyncStorage si viene de una version
 * anterior. Si SecureStore falla (dispositivo sin keystore, permisos raros),
 * cae a AsyncStorage en vez de desloguear al usuario.
 */
export async function getToken(): Promise<string | null> {
  if (enWeb) {
    return AsyncStorage.getItem(CLAVE_TOKEN);
  }

  try {
    const seguro = await SecureStore.getItemAsync(CLAVE_TOKEN, OPCIONES);
    if (seguro) return seguro;
  } catch (e) {
    if (__DEV__) console.warn('[tokenStore] SecureStore no disponible:', e);
  }

  // Camino de migracion: token de una version anterior de la app.
  const legado = await AsyncStorage.getItem(CLAVE_TOKEN);
  if (!legado) return null;

  try {
    await SecureStore.setItemAsync(CLAVE_TOKEN, legado, OPCIONES);
    // Solo se borra el legado si la promocion salio bien. Si se borrara antes,
    // un fallo de SecureStore dejaria al usuario sin token en ningun lado.
    await AsyncStorage.removeItem(CLAVE_TOKEN);
  } catch (e) {
    if (__DEV__) console.warn('[tokenStore] no se pudo migrar a SecureStore:', e);
  }

  return legado;
}

export async function clearToken(): Promise<void> {
  // Se borra en los dos backends: si quedara el legado, un getToken posterior
  // lo "recuperaria" y revivira una sesion ya cerrada.
  await AsyncStorage.removeItem(CLAVE_TOKEN);
  if (enWeb) return;

  try {
    await SecureStore.deleteItemAsync(CLAVE_TOKEN, OPCIONES);
  } catch (e) {
    if (__DEV__) console.warn('[tokenStore] no se pudo borrar de SecureStore:', e);
  }
}
