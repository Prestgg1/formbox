import { registerDefaultFormats } from "./formats";
import { KindGuard, type TObject, type TUnion, type Static } from "@sinclair/typebox";
import { TypeCompiler, type TypeCheck } from "@sinclair/typebox/compiler";
import { createSignal, createMemo, createContext, useContext, splitProps, type JSX, Show } from "solid-js";

// --- Types ---

/**
 * A form schema: an object, or a union of objects for rules across fields ("a note or a link",
 * "a reason when rejecting"). A union form has every field of every variant.
 */
export type FormSchema = TObject | TUnion<TObject[]>;

/** Field names of a form: the object's keys, or the keys of any union variant. */
export type FieldName<T extends FormSchema> = T extends TUnion<infer V>
  ? { [I in keyof V]: V[I] extends TObject ? keyof Static<V[I]> & string : never }[number]
  : keyof Static<T> & string;

/** A field's value type (across the union variants that have it). */
export type FieldValue<T extends FormSchema, K extends string> = Static<T> extends infer S
  ? S extends Record<K, infer V>
    ? V
    : never
  : never;

/** What the form holds while it is being filled: any field of the schema, possibly unset. */
export type FormValues<T extends FormSchema> = { [K in FieldName<T>]?: FieldValue<T, K> };

export interface CreateFormOptions<T extends FormSchema> {
  initialValues?: FormValues<T>;
}

export interface FormInstance<T extends FormSchema> {
  schema: T;
  values: () => FormValues<T>;
  submitting: () => boolean;
  valid: () => boolean;
  errors: () => Partial<Record<FieldName<T>, string>>;
  
  error: (name: string) => string | undefined;
  touched: (name: string) => boolean;

  setValues: (values: FormValues<T> | ((prev: FormValues<T>) => FormValues<T>)) => void;
  setValue: <K extends FieldName<T>>(field: K, value: FieldValue<T, K>) => void;
  
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

function getCompiler(schema: TObject): TypeCheck<TObject> {
  let compiled = compilerCache.get(schema);
  if (!compiled) {
    registerDefaultFormats();
    compiled = TypeCompiler.Compile(schema);
    compilerCache.set(schema, compiled);
  }
  return compiled;
}

/** The object schemas a form checks against: the schema itself, or each union variant. */
function variantsOf(schema: FormSchema): TObject[] {
  return KindGuard.IsUnion(schema) ? schema.anyOf : [schema];
}

/** Field errors of one object schema (first message per field). */
function errorsFor(compiler: TypeCheck<TObject>, values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const err of compiler.Errors(values)) {
    const key = err.path.replace(/^\//, "").replace(/\//g, ".") || "_root";
    if (!errors[key]) errors[key] = err.message;
  }
  return errors;
}

/**
 * Valid when any variant accepts the values. Otherwise the errors of the closest variant (fewest
 * errors; the first on a tie), so a union form still shows messages on its fields.
 */
function validate(compilers: TypeCheck<TObject>[], values: Record<string, unknown>): Record<string, string> {
  if (compilers.some((compiler) => compiler.Check(values))) return {};
  const [closest] = compilers
    .map((compiler) => errorsFor(compiler, values))
    .sort((a, b) => Object.keys(a).length - Object.keys(b).length);
  return closest ?? {};
}

// --- Form Instance ---

export function createForm<T extends FormSchema>(
  schema: T,
  options?: CreateFormOptions<T>
): FormInstance<T> {
  type Values = FormValues<T>;
  const variants = variantsOf(schema);
  const compilers = variants.map(getCompiler);
  const fieldNames = [...new Set(variants.flatMap((variant) => Object.keys(variant.properties)))];

  const [values, setValues] = createSignal<Record<string, unknown>>(
    options?.initialValues ? { ...options.initialValues } : {}
  );
  const [touchedFields, setTouched] = createSignal<Record<string, boolean>>({});
  const [submitting, setSubmitting] = createSignal(false);

  const currentErrors = createMemo(() => validate(compilers, values()));
  const valid = createMemo(() => Object.keys(currentErrors()).length === 0);

  function setValue<K extends FieldName<T>>(field: K, value: FieldValue<T, K>) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function setValuesState(updater: Values | ((prev: Values) => Values)) {
    if (typeof updater === "function") {
      setValues((prev) => ({ ...prev, ...updater(prev as Values) }));
    } else {
      setValues((prev) => ({ ...prev, ...updater }));
    }
  }

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
    return visible as Partial<Record<FieldName<T>, string>>;
  }

  function touched(name: string): boolean {
    return Boolean(touchedFields()[name]);
  }

  function reset() {
    setValues(options?.initialValues ? { ...options.initialValues } : {});
    setTouched({});
    setSubmitting(false);
  }

  const _internalSubmit = (handler: (values: Static<T>) => void | Promise<void>) => async (e: Event) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fieldNames.map((key) => [key, true])));

    const errs = validate(compilers, values());
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await handler(values() as Static<T>);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    schema,
    values: values as () => Values,
    submitting,
    valid,
    errors,
    error,
    touched,
    setValues: setValuesState,
    setValue,
    _fieldProps,
    _internalSubmit,
    reset,
  };
}

// --- Context & Components ---

const FormContext = createContext<FormInstance<FormSchema>>();

function useFormContext(): FormInstance<FormSchema> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a <Form> wrapper");
  }
  return context;
}

export function Form<T extends FormSchema>(
  props: { 
    form: FormInstance<T>; 
    onSubmit: (values: Static<T>) => void | Promise<void>; 
    children: JSX.Element; 
  } & Omit<JSX.FormHTMLAttributes<HTMLFormElement>, "onSubmit">
) {
  const [local, rest] = splitProps(props, ["form", "onSubmit", "children"]);
  
  return (
    <FormContext.Provider value={local.form as unknown as FormInstance<FormSchema>}>
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
