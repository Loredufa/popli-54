# Popli-54 (app móvil)

App de cuentos infantiles en Expo/React Native (Expo Router). Consume la API de **poplicuentos-api** para historias, autenticación y narración por voz. Incluye música de fondo mientras se lee y narración TTS.

```bash
npm install
npx expo start
```

---

## 🔒 Premisa de arquitectura: privacidad de los niños ante todo

Esta app se construye sobre una decisión de arquitectura **no negociable**: no comprometer datos de los niños que la usan.

- Los cuentos generados y su configuración (edad, tema, personajes, etc.) **no se guardan en ningún backend ni base de datos**. El backend los genera sin estado y los devuelve; quedan **solo en el dispositivo**: el cuento en curso en `AsyncStorage` (`src/lib/storage.ts`: `saveCurrentSession`) y los cuentos guardados en el almacenamiento privado de la app (`src/lib/storyLibrary.ts`, ver abajo).
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

Cliente HTTP hacia `poplicuentos-api` (`/api/tts/*`). No genera audio localmente, todo el trabajo pasa por el backend (OpenAI para voces fijas, o el worker propio Chatterbox/RunPod para voces grabadas):

- `fetchVoices()` — trae la lista de las 3 voces fijas.
- `fetchVoicePreview(voiceId)` — genera una muestra corta (solo voces fijas).
- `fetchNarrationTemp(...)` — narra el cuento completo a un archivo temporal (usado por `StoryReader.tsx` al reproducir). Acepta `referenceAudioUri` opcional para narrar con una voz grabada.
- `downloadNarrationToGallery(...)` — guarda el audio narrado en la galería del dispositivo. Detecta MP3 vs WAV por el header `X-TTS-Format` de la respuesta.

## 🎙️ Grabar mi voz — `src/components/VoiceRecorder.tsx` + `src/lib/voicePrefs.ts`

Mamá, papá o cualquier familiar puede grabar su voz, ponerle un nombre, y esa voz queda disponible en el menú de narración junto a las fijas.

- **Motor**: self-hosted, worker propio (`poplicuentos-chatterbox-runpod`) desplegado en RunPod, no un proveedor de terceros — cumple la premisa de arquitectura de arriba.
- **Grabación**: 20 a 60 segundos, leyendo un guion fijo (fonéticamente variado, no "hola hola hola") que se muestra en pantalla.
- **Sin red al grabar**: a diferencia de la versión vieja con ElevenLabs (que subía la muestra para "clonar" en la nube de un tercero), acá la grabación se copia a almacenamiento durable del dispositivo (`FileSystem.documentDirectory`) y listo — Chatterbox es zero-shot, no hace falta crear nada del lado del servidor. La red solo se usa en cada narración, transitoriamente (igual que ya pasa hoy con las voces fijas de OpenAI).
- **Multi-voz**: hasta **3** voces guardadas a la vez (`MAX_NAMED_VOICES` en `voicePrefs.ts`), cada una con nombre propio, todas seleccionables juntas.
- **Dónde se gestiona**: grabar desde "Música y narrador" (sección "Narrador") o desde Ajustes → "Mis voces". Borrar se puede desde los dos lados, siempre con confirmación, vía `deleteNamedVoiceCascade()` — que además limpia lo que dependía de esa voz (la narración ya generada con ella, su archivo en disco y la preferencia de narrador si era la activa). Sin la cascada quedaban entradas `custom:<id>` colgadas apuntando a una voz inexistente.
- **Formato**: Chatterbox devuelve WAV (no MP3) — el cliente elige la extensión/mime dinámicamente según el header `X-TTS-Format`.

Historia: hasta el 2026-07-10 esta feature usaba ElevenLabs, un proveedor de terceros agregado sin decisión consciente del proyecto y sin créditos configurados — se sacó por completo y se reconstruyó desde cero con el enfoque self-hosted descripto arriba.

## 📚 Cuentos guardados — `src/lib/storyLibrary.ts`

"Guardar cuento completo" arma **una carpeta por cuento** en el almacenamiento privado de la app, y "Cuentos guardados" la vuelve a reproducir sin red.

```
documentDirectory/cuentos/<slug>-<id>/
  cuento.json        manifiesto (texto, meta, música elegida, índice de recursos)
  cuento.txt         texto plano
  cuento.pdf         libro con imágenes grandes (lo produce /maker vía expo-print)
  ilustraciones/     PNG/JPG descargados o decodificados a disco
  narracion/         audio ya generado, una pista por voz
```

- **El audio se copia, no se referencia.** `audioMap` puede apuntar a `cacheDirectory` (que el SO desaloja) o a un asset de galería que el usuario puede borrar; guardar la URI haría que el cuento "guardado" dejara de sonar sin aviso.
- **Guardar no genera nada nuevo**: solo empaqueta lo que ya existe. Un cuento sin narración se guarda igual y la lista lo marca como "sin narración".
- **Idempotente**: la sesión recuerda `savedId`, así que volver a guardar el mismo cuento actualiza su carpeta en vez de duplicar la entrada. El PDF sobrevive entre guardados, porque solo `/maker` lo produce.
- **Tope**: 10 cuentos (`MAX_STORIES_SAVED`), con expulsión FIFO que borra la carpeta entera.
- El índice vive en `AsyncStorage` bajo `cuentero_library`. La clave vieja `cuentero_stories` (que tenía dos esquemas incompatibles conviviendo y que ninguna pantalla llegaba a mostrar) se importa una sola vez con `migrateLegacyIndex()`.

## Estructura relevante

```
app/                    rutas (Expo Router): tabs, maker, story-audio, cuentos-guardados/, settings, record-voice (modal), login...
src/
  lib/
    musicPlayer.ts       música de fondo
    storyLibrary.ts      biblioteca de cuentos guardados (carpeta por cuento)
    ttsClient.ts          cliente TTS hacia la API (voces fijas + grabadas)
    voicePrefs.ts         preferencia de voz + voces nombradas guardadas en el dispositivo
  components/
    MusicBar.tsx          UI de música
    NarratorPicker.tsx    selector de narrador colapsable + borrar grabaciones
    StoryReader.tsx        reproductor del cuento en curso (genera la narración por red)
    SavedStoryPlayer.tsx   reproductor de un cuento ya guardado (audio local, sin red)
    VoiceRecorder.tsx      grabación de voz familiar (nombre, guion, 20-60s)
```
