import type { TObject, Static } from "@sinclair/typebox";
import type { Accessor, JSX } from "solid-js";

export interface FieldProps {
  name: string;
  value: string;
  onInput: (e: InputEvent & { currentTarget: HTMLInputElement }) => void;
  onBlur: () => void;
}

export interface CheckboxFieldProps {
  name: string;
  checked: boolean;
  onChange: (e: Event & { currentTarget: HTMLInputElement }) => void;
  onBlur: () => void;
  type: "checkbox";
}

export interface FormInstance<T extends TObject> {
  // Mövcud action-lar (hook kimi)
  field: <K extends keyof Static<T> & string>(name: K) => FieldProps;
  checkbox: <K extends keyof Static<T> & string>(name: K) => CheckboxFieldProps;
  error: <K extends keyof Static<T> & string>(name: K) => string | undefined;
  errors: Accessor<Partial<Record<keyof Static<T> & string, string>>>;
  submitting: Accessor<boolean>;
  valid: Accessor<boolean>;
  touched: <K extends keyof Static<T> & string>(name: K) => boolean;
  reset: () => void;
  values: Accessor<Partial<Static<T>>>;

  // Yeni UI Komponentləri (Formik/Modular Forms stili)
  Form: (props: {
    onSubmit: (values: Static<T>) => void | Promise<void>;
    children: JSX.Element;
    class?: string;
  } & Omit<JSX.FormHTMLAttributes<HTMLFormElement>, "onSubmit">) => JSX.Element;

  Field: <K extends keyof Static<T> & string>(props: {
    name: K;
    children: (field: FieldProps, state: { error: string | undefined; touched: boolean }) => JSX.Element;
  }) => JSX.Element;

  ErrorMessage: <K extends keyof Static<T> & string>(props: {
    name: K;
    class?: string;
  }) => JSX.Element;
}
