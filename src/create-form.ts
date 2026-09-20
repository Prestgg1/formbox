import { type TObject, type Static } from "@sinclair/typebox";
import { TypeCompiler, type TypeCheck } from "@sinclair/typebox/compiler";
import { createSignal, createMemo } from "solid-js";
import type { FormInstance, FieldProps, CheckboxFieldProps } from "./types";

/** Compiled schema cache — avoids recompiling on every createForm call */
const compilerCache = new WeakMap<TObject, TypeCheck<TObject>>();

function getCompiler<T extends TObject>(schema: T): TypeCheck<T> {
  let compiled = compilerCache.get(schema) as TypeCheck<T> | undefined;
  if (!compiled) {
    compiled = TypeCompiler.Compile(schema) as TypeCheck<T>;
    compilerCache.set(schema, compiled as TypeCheck<TObject>);
  }
  return compiled;
}

/**
 * Runs TypeBox validation and returns a field→error map.
 * Only keeps the first error per field for clean UX.
 */
function validate<T extends TObject>(
  compiler: TypeCheck<T>,
  values: Record<string, unknown>,
): Record<string, string> {
  if (compiler.Check(values)) return {};

  const errors: Record<string, string> = {};
  for (const err of compiler.Errors(values)) {
    // TypeBox returns JSON Pointer paths: "/email" → "email"
    const key = err.path.replace(/^\//, "").replace(/\//g, ".") || "_root";
    if (!errors[key]) {
      errors[key] = err.message;
    }
  }
  return errors;
}

/**
 * Creates a reactive form instance bound to a TypeBox schema.
 *
 * @example
 * ```tsx
 * const Schema = Type.Object({
 *   email: Type.String({ format: "email" }),
 *   password: Type.String({ minLength: 8 }),
 * });
 *
 * function LoginPage() {
 *   const form = createForm(Schema);
 *
 *   return (
 *     <form onSubmit={form.submit(async (data) => { await api.login(data); })}>
 *       <input {...form.field("email")} />
 *       <span>{form.error("email")}</span>
 *
 *       <input {...form.field("password")} type="password" />
 *       <span>{form.error("password")}</span>
 *
 *       <button disabled={form.submitting()}>Sign In</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function createForm<T extends TObject>(schema: T): FormInstance<T> {
  type Values = Static<T>;
  type Key = keyof Values & string;

  const compiler = getCompiler(schema);

  // --- Reactive state ---
  const [values, setValues] = createSignal<Record<string, unknown>>({});
  const [touchedFields, setTouched] = createSignal<Record<string, boolean>>({});
  const [submitting, setSubmitting] = createSignal(false);

  // Errors recompute automatically when values change
  const currentErrors = createMemo(() => validate(compiler, values()));

  const valid = createMemo(() => Object.keys(currentErrors()).length === 0);

  // --- Field binding ---
  function field<K extends Key>(name: K): FieldProps {
    return {
      name,
      get value() {
        return String(values()[name] ?? "");
      },
      onInput(e) {
        setValues((prev) => ({ ...prev, [name]: e.currentTarget.value }));
      },
      onBlur() {
        setTouched((prev) => ({ ...prev, [name]: true }));
      },
    };
  }

  function checkbox<K extends Key>(name: K): CheckboxFieldProps {
    return {
      name,
      type: "checkbox",
      get checked() {
        return Boolean(values()[name]);
      },
      onChange(e) {
        setValues((prev) => ({ ...prev, [name]: (e.currentTarget as HTMLInputElement).checked }));
      },
      onBlur() {
        setTouched((prev) => ({ ...prev, [name]: true }));
      },
    };
  }

  // --- Error access (only show after touch) ---
  function error<K extends Key>(name: K): string | undefined {
    if (!touchedFields()[name]) return undefined;
    return currentErrors()[name];
  }

  function errors() {
    const errs = currentErrors();
    const t = touchedFields();
    const visible: Record<string, string> = {};
    for (const key in errs) {
      if (t[key]) visible[key] = errs[key];
    }
    return visible as Partial<Record<Key, string>>;
  }

  // --- Submit ---
  function submit(handler: (values: Values) => void | Promise<void>) {
    return async (e: Event) => {
      e.preventDefault();

      // Touch all fields so errors become visible
      const allTouched: Record<string, boolean> = {};
      for (const key of Object.keys(schema.properties)) {
        allTouched[key] = true;
      }
      setTouched(allTouched);

      // Validate
      const errs = validate(compiler, values());
      if (Object.keys(errs).length > 0) return;

      setSubmitting(true);
      try {
        await handler(values() as Values);
      } finally {
        setSubmitting(false);
      }
    };
  }

  // --- Touched check ---
  function touched<K extends Key>(name: K): boolean {
    return Boolean(touchedFields()[name]);
  }

  // --- Reset ---
  function reset() {
    setValues({});
    setTouched({});
    setSubmitting(false);
  }

  return {
    field,
    checkbox,
    error,
    errors,
    submit,
    submitting,
    valid,
    touched,
    reset,
    values: values as unknown as FormInstance<T>["values"],
  };
}
