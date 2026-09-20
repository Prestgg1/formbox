# FormBox

Minimal SolidJS form library with **native TypeBox validation**. Zero adapters, zero boilerplate.

## Install

```bash
bun add formbox solid-js @sinclair/typebox
```

## Quick Start

```tsx
import { Type } from "@sinclair/typebox";
import { createForm } from "formbox";

const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

function LoginPage() {
  const form = createForm(LoginSchema);

  return (
    <form onSubmit={form.submit(async (data) => {
      // data is fully typed: { email: string; password: string }
      await api.auth.login.post(data);
    })}>
      <input {...form.field("email")} type="email" placeholder="you@company.com" />
      <span>{form.error("email")}</span>

      <input {...form.field("password")} type="password" placeholder="••••••••" />
      <span>{form.error("password")}</span>

      <button type="submit" disabled={form.submitting()}>
        Sign In
      </button>
    </form>
  );
}
```

## API

### `createForm(schema)`

Creates a reactive form instance from a TypeBox `Type.Object()` schema.

| Property | Type | Description |
|---|---|---|
| `form.field(name)` | `FieldProps` | Spread-ready `{ name, value, onInput, onBlur }` for text inputs |
| `form.checkbox(name)` | `CheckboxFieldProps` | Spread-ready `{ name, checked, onChange, onBlur, type }` for checkboxes |
| `form.error(name)` | `string \| undefined` | Error message for a field (only shown after touch) |
| `form.errors()` | `Record<string, string>` | All visible errors |
| `form.submit(handler)` | `(e: Event) => void` | Validates, touches all fields, calls handler with typed values |
| `form.submitting()` | `boolean` | Whether submit handler is running |
| `form.valid()` | `boolean` | Whether the form is currently valid |
| `form.touched(name)` | `boolean` | Whether a field has been blurred |
| `form.values()` | `Partial<Static<T>>` | Current form values |
| `form.reset()` | `void` | Reset values, errors, and touched state |

## Full Signup Example

```tsx
import { Show } from "solid-js";
import { Type } from "@sinclair/typebox";
import { createForm } from "formbox";

const SignupSchema = Type.Object({
  fullName: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  terms: Type.Boolean(),
});

function SignupPage() {
  const form = createForm(SignupSchema);

  return (
    <form onSubmit={form.submit(async (data) => {
      const res = await api.auth.signup.post(data);
      navigate("/dashboard");
    })}>
      <div>
        <label>Full Name</label>
        <input {...form.field("fullName")} />
        <Show when={form.error("fullName")}>
          <p class="error">{form.error("fullName")}</p>
        </Show>
      </div>

      <div>
        <label>Email</label>
        <input {...form.field("email")} type="email" />
        <Show when={form.error("email")}>
          <p class="error">{form.error("email")}</p>
        </Show>
      </div>

      <div>
        <label>Password</label>
        <input {...form.field("password")} type="password" />
        <Show when={form.error("password")}>
          <p class="error">{form.error("password")}</p>
        </Show>
      </div>

      <div>
        <input {...form.checkbox("terms")} id="terms" />
        <label for="terms">I agree to the Terms of Service</label>
        <Show when={form.error("terms")}>
          <p class="error">{form.error("terms")}</p>
        </Show>
      </div>

      <button type="submit" disabled={form.submitting()}>
        {form.submitting() ? "Signing up..." : "Create Account"}
      </button>
    </form>
  );
}
```

## Why FormBox?

| | FormBox | Felte + Zod | Modular Forms + Zod |
|---|---|---|---|
| TypeBox native | ✅ | ❌ adapter needed | ❌ adapter needed |
| Schema = single source | ✅ share with Elysia | ❌ duplicate schemas | ❌ duplicate schemas |
| API surface | ~10 methods | ~20+ | ~15+ |
| Validation engine | TypeCompiler (JIT) | Zod (interpreted) | Zod (interpreted) |
| Bundle overhead | ~2KB | ~12KB | ~8KB |

## License

MIT
