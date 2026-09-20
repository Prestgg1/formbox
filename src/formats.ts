import { FormatRegistry } from "@sinclair/typebox";

/**
 * Registers common string formats (email, uri, uuid, date, etc.)
 * that TypeBox does not include by default.
 *
 * Call this once at app startup or import it as a side-effect.
 */

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URI_RE = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

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
