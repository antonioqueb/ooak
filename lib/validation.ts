// Slugs/keys permitidos hacia la API de Odoo: solo minúsculas/números/guiones.
// Bloquea path traversal (../), query injection (?a=b) y caracteres de control.
const SLUG_RE = /^[a-z0-9-]{1,128}$/i;

export function isValidSlug(value: unknown): value is string {
    return typeof value === 'string' && SLUG_RE.test(value);
}
