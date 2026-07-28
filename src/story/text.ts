// src/story/text.ts
//
// El generador de cuentos le pide al modelo que meta marcas "(pausa)" en el texto
// (systemPrompt en poplicuentos-api/app/api/story/route.ts). Son indicaciones de
// narracion, no parte del cuento: el worker de TTS las convierte en silencio real
// (PAUSE_MARKER_RE en poplicuentos-chatterbox-runpod/src/handler.py) y acá se sacan
// de todo lo que el usuario ve o se lleva: pantalla, PDF, texto compartido y los
// cuentos guardados.
//
// Importante: el texto que se manda a narrar tiene que ir CON las marcas, si no el
// worker no sabe dónde poner los silencios. Por eso `storyText` se guarda crudo y el
// stripping pasa solo en los bordes de presentación.

/** Marcas de narración: "(pausa)", "[PAUSA]", "( Pausa )"... */
const NARRATION_CUE_PATTERN = String.raw`[([]\s*pausa\s*[)\]]`;

/** Saca las marcas de narración y normaliza los espacios que quedan. */
export function stripNarrationCues(text: string): string {
  if (!text) return '';
  return text
    .replace(new RegExp(NARRATION_CUE_PATTERN, 'gi'), '')
    // Espacios dobles y espacios antes de puntuación que deja la marca al irse.
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?…])/g, '$1')
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
