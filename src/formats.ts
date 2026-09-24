import { FormatRegistry } from "@sinclair/typebox";

/**
 * Registers common string formats (email, uri, uuid, date, etc.)
 * that TypeBox does not include by default.
 *
 * Call this once at app startup or import it as a side-effect.
 */

export const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const URI_RE = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^\s]+$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function registerDefaultFormats() {
  if (!FormatRegistry.Has("email")) {
    FormatRegistry.Set("email", (v) => EMAIL_RE.test(v));
  }
  if (!FormatRegistry.Has("uuid")) {
    FormatRegistry.Set("uuid", (v) => UUID_RE.test(v));
  }
  if (!FormatRegistry.Has("uri")) {
    FormatRegistry.Set("uri", (v) => URI_RE.test(v));
  }
  if (!FormatRegistry.Has("date")) {
    FormatRegistry.Set("date", (v) => DATE_RE.test(v));
  }
  if (!FormatRegistry.Has("date-time")) {
    FormatRegistry.Set("date-time", (v) => DATE_TIME_RE.test(v));
  }
}

export function addFormat(name: string, validator: (value: string) => boolean) {
  FormatRegistry.Set(name, validator);
}

// Auto-register formats on import
registerDefaultFormats();
