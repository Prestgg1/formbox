import type { TObject, Static } from "@sinclair/typebox";
import type { Accessor, JSX } from "solid-js";

export interface FormInstance<T extends TObject> {
  schema: T;
  values: Accessor<Partial<Static<T>>>;
  submitting: Accessor<boolean>;
  valid: Accessor<boolean>;
  errors: Accessor<Partial<Record<keyof Static<T> & string, string>>>;
  
  error: (name: string) => string | undefined;
  touched: (name: string) => boolean;
  
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
