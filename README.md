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

## Rules across fields (union schemas)

`createForm` also takes a union of objects. The form has every field of every variant and is valid
when any variant accepts the values; otherwise the closest variant's errors show on its fields.

```tsx
// A note or a link (at least one)
const ProofSchema = Type.Union([
  Type.Object({ note: Type.String({ pattern: "\\S" }), url: Type.String() }),
  Type.Object({ note: Type.String(), url: Type.String({ pattern: "^https?://\\S+$" }) }),
]);

// A reason only when rejecting
const ReviewSchema = Type.Union([
  Type.Object({ decision: Type.Literal("approve") }),
  Type.Object({ decision: Type.Literal("reject"), note: Type.String({ minLength: 1 }) }),
]);

const form = createForm(ProofSchema, { initialValues: { note: "", url: "" } });
form.valid(); // false until a note or an http(s) link is given
```

The same schema validates the request on the server, so the rule lives in one place.

## License

GPL-2.0
