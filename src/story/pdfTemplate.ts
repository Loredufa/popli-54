// src/story/pdfTemplate.ts
// Plantilla HTML del cuento en PDF. Función pura, sin dependencias de React ni de
// Expo, para poder renderizarla en un navegador y ajustar el layout de impresión
// sin levantar la app.
//
// Restricción de fondo: en impresión NADA puede pintar dentro de la caja de margen
// de `@page` — la impresora la deja en blanco papel. Para que el navy llegue a
// sangre hace falta `@page { margin: 0 }`, y entonces el aire de 15mm/18mm tiene
// que venir del contenido. Como el padding de un bloque no se repite cuando ese
// bloque se parte entre hojas, el reparto de párrafos en hojas se hace acá
// (`paginate`) en vez de dejárselo al motor: cada hoja física es su propio `.page`
// con su padding completo.

export type StoryPdfImage = { dataUri: string; label: string };

export type StoryPdfInput = {
  /** Título ya compuesto (sin escapar ni pasar a mayúsculas). */
  title: string;
  /** Párrafos del cuento en texto plano, sin escapar. */
  paragraphs: string[];
  /** Una ilustración por sección; null cuando la escena no se pudo generar. */
  images: Array<StoryPdfImage | null>;
};

/** Cantidad de secciones ilustradas del cuento (intro / conflicto / resolución). */
const TOTAL_SECTIONS = 3;

// --- Geometría de la hoja (A4, 96dpi) -------------------------------------

const PX_PER_MM = 96 / 25.4;
const mm = (v: number) => v * PX_PER_MM;

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PAD_V_MM = 15;
const PAD_H_MM = 18;
/** 1mm de holgura: con el alto exacto Chrome a veces arrastra una hoja en blanco. */
const PAGE_BOX_MM = PAGE_H_MM - 1;

const CONTENT_W_PX = mm(PAGE_W_MM - 2 * PAD_H_MM);
const CONTENT_H_PX = mm(PAGE_H_MM - 2 * PAD_V_MM);

// --- Métricas del texto ----------------------------------------------------

const FONT_SIZE_PX = 26;
const LINE_HEIGHT = 1.65;
const LINE_H_PX = FONT_SIZE_PX * LINE_HEIGHT;
const PARAGRAPH_GAP_PX = 10;

/**
 * Ancho medio de carácter en mayúsculas a 26px bold con letter-spacing 1.5px.
 * Medido ~15.9px sobre el render real; se redondea hacia arriba a propósito:
 * sobreestimar el ancho ⇒ menos caracteres por línea ⇒ más líneas ⇒ más alto
 * estimado ⇒ menos párrafos por hoja. El error siempre sobra espacio, nunca
 * desborda.
 */
const CHAR_W_PX = 17;
const CHARS_PER_LINE = Math.max(1, Math.floor(CONTENT_W_PX / CHAR_W_PX));

const IMAGE_SIZE_MM = 120;
const IMAGE_GAP_MM = 8;
/** Alto reservado por la ilustración: caja + margen inferior + los 2px de borde. */
const IMAGE_BLOCK_PX = mm(IMAGE_SIZE_MM + IMAGE_GAP_MM) + 4;
/** Alto reservado por el número de página al pie. */
const PAGE_NUM_PX = mm(6) + 13 * 1.2;

function paragraphHeight(text: string) {
  const lines = Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
  return lines * LINE_H_PX + PARAGRAPH_GAP_PX;
}

/** Caracteres que caben en `budget` px de alto, con el gap del párrafo descontado. */
function charBudget(budget: number) {
  const lines = Math.floor((budget - PARAGRAPH_GAP_PX) / LINE_H_PX);
  return Math.max(CHARS_PER_LINE, lines * CHARS_PER_LINE);
}

/**
 * Parte un párrafo que no entra en una hoja entera. Ocurre cuando el modelo
 * devuelve el cuento sin líneas en blanco y `splitStoryParagraphs` entrega un
 * único bloque gigante. Se corta por final de oración; si una sola oración
 * tampoco cabe, por palabras.
 */
function splitLongParagraph(text: string, budget: number): string[] {
  const max = charBudget(budget);
  if (text.length <= max) return [text];

  const units = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  const pushWords = (unit: string) => {
    for (const word of unit.split(/\s+/).filter(Boolean)) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > max && current) {
        chunks.push(current.trim());
        current = word;
      } else {
        current = next;
      }
    }
  };

  for (const unit of units) {
    if (unit.length > max) {
      pushWords(unit);
      continue;
    }
    const next = current + unit;
    if (next.length > max && current) {
      chunks.push(current.trim());
      current = unit;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// --- Utilidades ------------------------------------------------------------

export function escapeHtml(value: string) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toImprenta(text: string) {
  return (text || '').toLocaleUpperCase('es-ES');
}

/**
 * Campo de estrellas como mosaico de 200×200 para el `background-image` del body.
 * Al ser un patrón repetido cubre solo todas las hojas que haga falta, incluidas
 * las que aparecen cuando un cuento largo necesita más de 3 secciones de hoja.
 */
function makeStarsTile(count: number) {
  const SIZE = 200;
  const circles = Array.from({ length: count }, (_, i) => {
    // Ángulo áureo: reparte los puntos sin agrupamientos visibles. El +1 evita
    // que la primera estrella caiga en el origen del mosaico, donde quedaría
    // pegada al canto del papel.
    const cx = ((((i + 1) * 137.508) % 100) * SIZE / 100).toFixed(1);
    const cy = ((((i + 1) * 73.137) % 100) * SIZE / 100).toFixed(1);
    const r = [0.7, 1, 1.2, 1.5, 0.8][i % 5];
    const op = [0.35, 0.55, 0.7, 0.85, 0.5, 0.65][i % 6];
    const fill = i % 8 === 0 ? '#9fd2ff' : i % 5 === 0 ? '#c8e8ff' : '#ffffff';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;
  }).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" ` +
    `viewBox="0 0 ${SIZE} ${SIZE}">${circles}</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

const STARS_TILE = makeStarsTile(26);

// --- Estilos ---------------------------------------------------------------

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  /* El fondo lo pinta el body, no cada .page: así llega a sangre en todas las
     hojas y no se ve ninguna costura entre ellas. */
  background-color: #0e1630;
  background-image: ${STARS_TILE};
  background-repeat: repeat;
  color: #e7eefc;
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "Comic Sans MS", sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  min-height: ${PAGE_BOX_MM}mm;
  padding: ${PAD_V_MM}mm ${PAD_H_MM}mm;
  page-break-after: always;
  display: flex;
  flex-direction: column;
  background: transparent;
}
/* Sin esto la última .page arrastra una hoja en blanco al final. */
.page:last-child { page-break-after: auto; }

.cover { text-align: center; padding-top: 22mm; }
.cover-title {
  font-size: 38px; font-weight: 900; letter-spacing: 2px;
  text-transform: uppercase; color: #e7eefc; line-height: 1.2;
  margin: 0 0 8px 0;
  text-shadow: 0 0 24px rgba(90,160,255,0.6), 0 2px 8px rgba(0,0,0,0.9);
}
.cover-brand {
  font-size: 15px; font-weight: 700; letter-spacing: 4px;
  text-transform: uppercase; color: #9fd2ff; margin: 0;
}
.cover-image {
  width: 90mm; height: 90mm; margin: 12mm auto 0;
  border-radius: 16px; overflow: hidden;
  border: 2px solid rgba(90,160,255,0.45);
  box-shadow: 0 0 24px rgba(90,160,255,0.25);
}
.cover-image img { width: 100%; height: 100%; object-fit: contain; display: block; }

.image-wrap {
  width: ${IMAGE_SIZE_MM}mm; height: ${IMAGE_SIZE_MM}mm;
  margin: 0 auto ${IMAGE_GAP_MM}mm;
  border-radius: 16px; overflow: hidden;
  border: 2px solid rgba(90,160,255,0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  /* Alto fijo + reparto propio: la ilustración nunca queda a caballo de dos hojas. */
  flex: none;
  break-inside: avoid;
  page-break-inside: avoid;
}
/* contain, no cover: si alguna ilustración dejara de ser cuadrada preferimos
   que sobre aire antes que recortarla. */
.image-wrap img { width: 100%; height: 100%; object-fit: contain; display: block; }

.paragraph {
  font-size: ${FONT_SIZE_PX}px; font-weight: 800; letter-spacing: 1.5px;
  line-height: ${LINE_HEIGHT}; text-transform: uppercase;
  margin: 0 0 ${PARAGRAPH_GAP_PX}px 0;
  color: #e7eefc;
  text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  break-inside: avoid;
  page-break-inside: avoid;
  orphans: 2;
  widows: 2;
}

.page-num {
  font-size: 13px; font-weight: 700; letter-spacing: 3px;
  text-transform: uppercase; color: #9fd2ff; text-align: center;
  margin-top: auto; padding-top: 6mm;
}
`;

// --- Paginación ------------------------------------------------------------

type Sheet = { paragraphs: string[]; image: StoryPdfImage | null; section: number };

/**
 * Reparte los párrafos de una sección en tantas hojas como haga falta, sin que
 * ninguna supere el alto útil. La ilustración va siempre en la primera hoja de
 * la sección y arriba del texto: al pie quedaba huérfana en el borde de hoja y
 * la impresora la recortaba.
 */
function paginateSection(
  paragraphs: string[],
  image: StoryPdfImage | null,
  section: number,
): Sheet[] {
  const budget = CONTENT_H_PX - PAGE_NUM_PX;
  const sheets: Sheet[] = [];
  let current: string[] = [];
  let used = image ? IMAGE_BLOCK_PX : 0;
  let sheetImage = image;

  // Un párrafo más alto que una hoja entera no se puede colocar: se trocea antes.
  const blocks = paragraphs.flatMap((p) => splitLongParagraph(p, budget));

  for (const paragraph of blocks) {
    const h = paragraphHeight(paragraph);
    if (current.length && used + h > budget) {
      sheets.push({ paragraphs: current, image: sheetImage, section });
      current = [];
      sheetImage = null;
      used = 0;
    }
    current.push(paragraph);
    used += h;
  }

  if (current.length || sheetImage) {
    sheets.push({ paragraphs: current, image: sheetImage, section });
  }
  return sheets;
}

function paginate(paragraphs: string[], images: Array<StoryPdfImage | null>): Sheet[] {
  if (!paragraphs.length) {
    return [{ paragraphs: ['Cuento sin contenido.'], image: null, section: 1 }];
  }

  const baseCount = Math.floor(paragraphs.length / TOTAL_SECTIONS);
  const remainder = paragraphs.length % TOTAL_SECTIONS;
  const sheets: Sheet[] = [];
  let cursor = 0;

  for (let i = 0; i < TOTAL_SECTIONS; i += 1) {
    const take = baseCount + (i < remainder ? 1 : 0);
    const slice = paragraphs.slice(cursor, cursor + take);
    cursor += take;
    if (!slice.length && !images[i]) continue;
    sheets.push(...paginateSection(slice, images[i] ?? null, i + 1));
  }
  return sheets;
}

// --- Render ----------------------------------------------------------------

export function buildStoryHtml({ title, paragraphs, images }: StoryPdfInput): string {
  const escapedTitle = escapeHtml(toImprenta(title));
  const cleanParagraphs = paragraphs.filter((block) => block && block.trim());

  const coverImg = images[0];
  const cover = `
    <div class="page cover">
      <p class="cover-title">${escapedTitle}</p>
      <p class="cover-brand">&#10022; POPLI &#10022;</p>
      ${coverImg ? `<div class="cover-image"><img src="${coverImg.dataUri}" alt="portada" /></div>` : ''}
    </div>`;

  const sheets = paginate(cleanParagraphs, images).map((sheet) => {
    const imageBlock = sheet.image
      ? `<div class="image-wrap"><img src="${sheet.image.dataUri}" alt="${sheet.image.label}" /></div>`
      : '';
    const textBlock = sheet.paragraphs
      .map((block) => `<p class="paragraph">${escapeHtml(toImprenta(block))}</p>`)
      .join('\n        ');
    return `
    <div class="page">
      ${imageBlock}
      <div class="text-block">
        ${textBlock}
      </div>
      <div class="page-num">${sheet.section}</div>
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapedTitle}</title>
  <style>${CSS}</style>
</head>
<body>
${[cover, ...sheets].join('\n')}
</body>
</html>`;
}
