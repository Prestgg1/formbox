# FormBox

Minimal SolidJS form library with **native TypeBox validation**. Zero adapters, zero boilerplate, and beautiful component-based API.

## Install

```bash
bun add @prestgg/formbox solid-js @sinclair/typebox
# or
npm install @prestgg/formbox solid-js @sinclair/typebox
```

## Quick Start (Global Component API)

```tsx
import { Type } from "@sinclair/typebox";
import { createForm, Form, Field, ErrorMessage } from "@prestgg/formbox";

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
    <Form form={form} onSubmit={onSubmit} class="space-y-4">
      <div>
        <label>Email</label>
        <Field name="email" type="email" placeholder="you@company.com" />
        <ErrorMessage name="email" class="text-red-500 text-sm" />
      </div>

      <div>
        <label>Password</label>
        <Field name="password" type="password" placeholder="••••••••" />
        <ErrorMessage name="password" class="text-red-500 text-sm" />
      </div>

      <button type="submit" disabled={form.submitting()}>
        {form.submitting() ? "Signing in..." : "Sign In"}
      </button>
    </Form>
  );
}
```

## API

### `createForm(schema)`

Creates a reactive form instance from a TypeBox `Type.Object()` schema.

### UI Components

| Component | Description |
|---|---|
| `<Form form={form} onSubmit={...}>` | Provider wrapper. Handles `e.preventDefault()`, validates, and runs `onSubmit` only if valid. |
| `<Field name="xyz" type="text" />` | Automatically binds `value`, `onInput`, `onBlur` from the FormContext. |
| `<ErrorMessage name="xyz">` | Conditionally renders the error message if the field is invalid and touched. |

## License

GPL-2.0
