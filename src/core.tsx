import { type TObject, type Static } from "@sinclair/typebox";
import { TypeCompiler, type TypeCheck } from "@sinclair/typebox/compiler";
import { createSignal, createMemo, createContext, useContext, splitProps, type JSX, Show } from "solid-js";

// --- Types ---

export interface FormInstance<T extends TObject> {
  schema: T;
  values: () => Partial<Static<T>>;
  submitting: () => boolean;
  valid: () => boolean;
  errors: () => Partial<Record<keyof Static<T> & string, string>>;
  
  error: (name: string) => string | undefined;
  touched: (name: string) => boolean;
  
  _fieldProps: (name: string) => {
    name: string;
    value: string;
    onInput: (e: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => void;
    onBlur: () => void;
  };
  
  _internalSubmit: (
    handler: (values: Static<T>) => void | Promise<void>
  ) => (e: Event) => void;

  reset: () => void;
}

// --- Validation Core ---

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

// --- Form Instance ---

export function createForm<T extends TObject>(schema: T): FormInstance<T> {
  type Values = Static<T>;
  const compiler = getCompiler(schema);

  const [values, setValues] = createSignal<Record<string, unknown>>({});
  const [touchedFields, setTouched] = createSignal<Record<string, boolean>>({});
  const [submitting, setSubmitting] = createSignal(false);

  const currentErrors = createMemo(() => validate(compiler, values()));
  const valid = createMemo(() => Object.keys(currentErrors()).length === 0);

  function _fieldProps(name: string) {
    return {
      name,
      get value() {
        return String(values()[name] ?? "");
      },
      onInput(e: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) {
        setValues((prev) => ({ ...prev, [name]: e.currentTarget.value }));
      },
      onBlur() {
        setTouched((prev) => ({ ...prev, [name]: true }));
      },
    };
  }

  function error(name: string): string | undefined {
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
    return visible as Partial<Record<keyof Values & string, string>>;
  }

  function touched(name: string): boolean {
    return Boolean(touchedFields()[name]);
  }

  function reset() {
    setValues({});
    setTouched({});
    setSubmitting(false);
  }

  const _internalSubmit = (handler: (values: Values) => void | Promise<void>) => async (e: Event) => {
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

  return {
    schema,
    values,
    submitting,
    valid,
    errors,
    error,
    touched,
    _fieldProps,
    _internalSubmit,
    reset,
  };
}

// --- Context & Components ---

// We use FormInstance<TObject> instead of any for type safety
const FormContext = createContext<FormInstance<TObject>>();

function useFormContext(): FormInstance<TObject> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a <Form> wrapper");
  }
  return context;
}

export function Form<T extends TObject>(
  props: { 
    form: FormInstance<T>; 
    onSubmit: (values: Static<T>) => void | Promise<void>; 
    children: JSX.Element; 
  } & Omit<JSX.FormHTMLAttributes<HTMLFormElement>, "onSubmit">
) {
  const [local, rest] = splitProps(props, ["form", "onSubmit", "children"]);
  
  return (
    <FormContext.Provider value={local.form as unknown as FormInstance<TObject>}>
      <form {...rest} onSubmit={local.form._internalSubmit(local.onSubmit)}>
        {local.children}
      </form>
    </FormContext.Provider>
  );
}

export function Field(
  props: { name: string } & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onInput" | "onBlur">
) {
  const form = useFormContext();
  const [local, rest] = splitProps(props, ["name"]);
  return <input {...rest} {...form._fieldProps(local.name)} />;
}

export function ErrorMessage(props: { name: string; class?: string }) {
  const form = useFormContext();
  return (
    <Show when={form.error(props.name)}>
      <span class={props.class}>{form.error(props.name)}</span>
    </Show>
  );
}
