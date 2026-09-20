import { type TObject, type Static } from "@sinclair/typebox";
import { TypeCompiler, type TypeCheck } from "@sinclair/typebox/compiler";
import { createSignal, createMemo, splitProps } from "solid-js";
import { Show } from "solid-js/web"; // Show from solid-js
import type { FormInstance, FieldProps, CheckboxFieldProps } from "./types";

const compilerCache = new WeakMap<TObject, TypeCheck<TObject>>();

function getCompiler<T extends TObject>(schema: T): TypeCheck<T> {
  let compiled = compilerCache.get(schema) as TypeCheck<T> | undefined;
  if (!compiled) {
    compiled = TypeCompiler.Compile(schema) as TypeCheck<T>;
    compilerCache.set(schema, compiled as TypeCheck<TObject>);
  }
  return compiled;
}

function validate<T extends TObject>(
  compiler: TypeCheck<T>,
  values: Record<string, unknown>,
): Record<string, string> {
  if (compiler.Check(values)) return {};
  const errors: Record<string, string> = {};
  for (const err of compiler.Errors(values)) {
    const key = err.path.replace(/^\//, "").replace(/\//g, ".") || "_root";
    if (!errors[key]) errors[key] = err.message;
  }
  return errors;
}

export function createForm<T extends TObject>(schema: T): FormInstance<T> {
  type Values = Static<T>;
  type Key = keyof Values & string;

  const compiler = getCompiler(schema);

  const [values, setValues] = createSignal<Record<string, unknown>>({});
  const [touchedFields, setTouched] = createSignal<Record<string, boolean>>({});
  const [submitting, setSubmitting] = createSignal(false);

  const currentErrors = createMemo(() => validate(compiler, values()));
  const valid = createMemo(() => Object.keys(currentErrors()).length === 0);

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

  function touched<K extends Key>(name: K): boolean {
    return Boolean(touchedFields()[name]);
  }

  function reset() {
    setValues({});
    setTouched({});
    setSubmitting(false);
  }

  // Submit trigger internal helper
  const handleInternalSubmit = async (handler: (values: Values) => void | Promise<void>, e: Event) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(schema.properties)) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const errs = validate(compiler, values());
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await handler(values() as Values);
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI Components ---

  const Form: FormInstance<T>["Form"] = (props) => {
    const [local, rest] = splitProps(props, ["onSubmit", "children"]);
    return (
      <form
        {...rest}
        onSubmit={(e) => handleInternalSubmit(local.onSubmit, e)}
      >
        {local.children}
      </form>
    );
  };

  const Field: FormInstance<T>["Field"] = (props) => {
    return props.children(field(props.name), {
      get error() { return error(props.name); },
      get touched() { return touched(props.name); }
    });
  };

  const ErrorMessage: FormInstance<T>["ErrorMessage"] = (props) => {
    return (
      <span class={props.class} style={!props.class ? "color: red; font-size: 12px;" : undefined}>
        {error(props.name) || ""}
      </span>
    ) as any;
  };

  return {
    field,
    checkbox,
    error,
    errors,
    submitting,
    valid,
    touched,
    reset,
    values: values as unknown as FormInstance<T>["values"],
    Form,
    Field,
    ErrorMessage,
  };
}
