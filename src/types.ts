import type { TObject, Static } from "@sinclair/typebox";
import type { Accessor, JSX } from "solid-js";

export interface CreateFormOptions<T extends TObject> {
  initialValues?: Partial<Static<T>>;
}

export interface FormInstance<T extends TObject> {
  schema: T;
  values: Accessor<Partial<Static<T>>>;
  submitting: Accessor<boolean>;
  valid: Accessor<boolean>;
  errors: Accessor<Partial<Record<keyof Static<T> & string, string>>>;
  
  error: (name: string) => string | undefined;
  touched: (name: string) => boolean;

  setValues: (values: Partial<Static<T>> | ((prev: Partial<Static<T>>) => Partial<Static<T>>)) => void;
  setValue: <K extends keyof Static<T> & string>(field: K, value: Static<T>[K]) => void;
  
  // Internal bindings for components
  _fieldProps: (name: string) => {
    name: string;
    value: string;
    onInput: (e: any) => void;
    onBlur: () => void;
  };
  
  _internalSubmit: (
    handler: (values: Static<T>) => void | Promise<void>
  ) => (e: Event) => void;

  reset: () => void;
}

