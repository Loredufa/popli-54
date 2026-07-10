# Popli-54 (app móvil)

App de cuentos infantiles en Expo/React Native (Expo Router). Consume la API de **poplicuentos-api** para historias, autenticación y narración por voz. Incluye música de fondo mientras se lee y narración TTS.

```bash
npm install
npx expo start
```

---

## 🔒 Premisa de arquitectura: privacidad de los niños ante todo

Esta app se construye sobre una decisión de arquitectura **no negociable**: no comprometer datos de los niños que la usan.

- Los cuentos generados y su configuración (edad, tema, personajes, etc.) **no se guardan en ningún backend ni base de datos**. El backend los genera sin estado y los devuelve; quedan **solo en el dispositivo**, en `AsyncStorage` (`src/lib/storage.ts`: `saveStory`, `saveCurrentSession`).
- La narración por voz funciona igual: se genera sin estado en el backend y el audio resultante se guarda localmente en el teléfono, nunca en un servidor.
- **Cualquier feature nueva que implique mandar datos a una nube — propia o de terceros — se evalúa contra esta premisa antes de implementarse.**
- Por qué está escrito acá tan explícito: el 2026-07-10 se detectaron y se sacaron dos cosas que la violaban sin que fuera una decisión consciente del proyecto — una integración completa con ElevenLabs (voz de un tercero externo) y una tabla `story_narrations` en la base de datos del backend con el texto completo del cuento. Ninguna de las dos fue una decisión de arquitectura, se colaron. Ver `poplicuentos-api/README.md` para el detalle.

---

## 🎵 Música de fondo — `src/lib/musicPlayer.ts` + `src/components/MusicBar.tsx`

Hook `useMusicPlayer()` sobre `expo-av`:

- 4 pistas instrumentales incluidas en el bundle (`assets/audio/*.mp3`), en loop.
- `play(trackId?)`, `pause()`, `setVolume()`, `setTrack()`.
- Configura el modo de audio para no cortarse en iOS silencioso y no mezclarse con otro audio (`InterruptionModeIOS/Android.DoNotMix`) — importante porque compite con la narración.

`MusicBar.tsx` es la UI que consume el hook desde la pantalla de lectura.

## 🗣️ Narración de cuentos — `src/lib/ttsClient.ts`

Cliente HTTP hacia `poplicuentos-api` (`/api/tts/*`). No genera audio localmente, todo el trabajo pasa por el backend (OpenAI):

- `fetchVoices()` — trae la lista de las 3 voces disponibles.
- `fetchVoicePreview(voiceId)` — genera una muestra corta.
- `fetchNarrationTemp(...)` — narra el cuento completo a un archivo temporal (usado por `StoryReader.tsx` al reproducir).
- `downloadNarrationToGallery(...)` — guarda el audio narrado en la galería del dispositivo.

## 🎙️ Clonación de voz — sacada, se reconstruye desde cero

Hasta el 2026-07-10 existía acá un botón "Grabar mi voz" (`VoiceRecorder.tsx`) que clonaba la voz de un familiar usando **ElevenLabs**, un proveedor de nube de terceros agregado en una sesión de IA previa sin que fuera una decisión consciente del proyecto — y sin créditos de esa cuenta, fallaba en producción. Se sacó por completo porque viola la premisa de arquitectura de arriba: no mandar datos a la nube de un tercero.

La feature se va a reconstruir **desde cero**, respetando esa premisa desde el diseño inicial (evaluar self-hosted vs. on-device, minimizar qué datos salen del teléfono) en vez de agregarla primero y evaluar la privacidad después.

## Estructura relevante

```
app/                    rutas (Expo Router): tabs, story/[id], maker, settings, login...
src/
  lib/
    musicPlayer.ts       música de fondo
    ttsClient.ts          cliente TTS hacia la API
    voicePrefs.ts         preferencia de voz guardada en el dispositivo
  components/
    MusicBar.tsx          UI de música
    StoryReader.tsx        pantalla de lectura (une música + narración)
```
