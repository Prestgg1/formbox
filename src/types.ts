import type { TObject, Static } from "@sinclair/typebox";
import type { Accessor } from "solid-js";

/** Input props returned by form.field() */
export interface FieldProps {
  name: string;
  value: string;
  onInput: (e: InputEvent & { currentTarget: HTMLInputElement }) => void;
  onBlur: () => void;
}

/** Checkbox props returned by form.checkbox() */
export interface CheckboxFieldProps {
  name: string;
  checked: boolean;
  onChange: (e: Event & { currentTarget: HTMLInputElement }) => void;
  onBlur: () => void;
  type: "checkbox";
}

/** The object returned by createForm */
export interface FormInstance<T extends TObject> {
  /** Returns spread-ready input props: name, value, onInput, onBlur */
  field: <K extends keyof Static<T> & string>(name: K) => FieldProps;

  /** Returns spread-ready checkbox props: name, checked, onChange, onBlur */
  checkbox: <K extends keyof Static<T> & string>(name: K) => CheckboxFieldProps;

  /** Returns the error message for a given field (reactive) */
  error: <K extends keyof Static<T> & string>(name: K) => string | undefined;

  /** Returns all current errors (reactive) */
  errors: Accessor<Partial<Record<keyof Static<T> & string, string>>>;

  /** Creates an onSubmit handler — validates, then calls your callback with typed values */
  submit: (handler: (values: Static<T>) => void | Promise<void>) => (e: Event) => void;

  /** Whether the form is currently submitting (reactive) */
  submitting: Accessor<boolean>;

  /** Whether the entire form is valid right now (reactive) */
  valid: Accessor<boolean>;

  /** Whether a specific field has been touched/blurred (reactive) */
  touched: <K extends keyof Static<T> & string>(name: K) => boolean;

  /** Reset all values, errors, and touched state */
  reset: () => void;

  /** Current form values (reactive) */
  values: Accessor<Partial<Static<T>>>;
}
