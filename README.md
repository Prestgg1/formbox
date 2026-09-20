# FormBox

Minimal SolidJS form library with **native TypeBox validation**. Zero adapters, zero boilerplate, and beautiful component-based API.

## Install

```bash
bun add formbox solid-js @sinclair/typebox
```

## Quick Start (Component API)

```tsx
import { Type } from "@sinclair/typebox";
import { createForm } from "formbox";

const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

function LoginPage() {
  const form = createForm(LoginSchema);

  const onSubmit = async (data: typeof LoginSchema["static"]) => {
    // data is fully typed!
    await api.auth.login.post(data);
  };

  return (
    <form.Form onSubmit={onSubmit}>
      <form.Field name="email">
        {(field, state) => (
          <div>
            <label>Email</label>
            <input {...field} type="email" placeholder="you@company.com" />
            <form.ErrorMessage name="email" class="text-red-500 text-sm" />
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field, state) => (
          <div>
            <label>Password</label>
            <input {...field} type="password" placeholder="••••••••" />
            <form.ErrorMessage name="password" class="text-red-500 text-sm" />
          </div>
        )}
      </form.Field>

      <button type="submit" disabled={form.submitting()}>
        {form.submitting() ? "Signing in..." : "Sign In"}
      </button>
    </form.Form>
  );
}
```

## API

### `createForm(schema)`

Creates a reactive form instance from a TypeBox `Type.Object()` schema.

### UI Components (Formik/Modular Forms style)

| Component | Description |
|---|---|
| `<form.Form>` | Wrapper component. Handles `e.preventDefault()`, touches all fields, validates, and runs `onSubmit` only if valid. |
| `<form.Field name="xyz">` | Render prop component. Injects `{ name, value, onInput, onBlur }` and `state: { error, touched }`. |
| `<form.ErrorMessage name="xyz">` | Conditionally renders the error message if the field is invalid and touched. |

### Hook State

| Property | Type | Description |
|---|---|---|
| `form.submitting()` | `boolean` | Whether submit handler is running |
| `form.valid()` | `boolean` | Whether the form is currently valid |
| `form.values()` | `Partial<Static<T>>` | Current form values |
| `form.reset()` | `void` | Reset values, errors, and touched state |

## License

GPL-2.0
