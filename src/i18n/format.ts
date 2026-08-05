// src/i18n/format.ts

/**
 * Interpolación mínima para las traducciones: `fmt(t.msg_delete_story_msg, { title })`
 * reemplaza `{title}` por su valor. Las claves de `TRANSLATIONS` son strings planos,
 * así que sin esto los mensajes con datos del usuario no se pueden traducir.
 */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}
