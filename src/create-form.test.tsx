import { describe, it, expect } from "bun:test";
import { Type } from "@sinclair/typebox";
import "./formats";
import { TypeCompiler } from "@sinclair/typebox/compiler";

// Direct validation logic test (no SolidJS runtime needed)

const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

const compiler = TypeCompiler.Compile(LoginSchema);

function validate(values: unknown): Record<string, string> {
  if (compiler.Check(values)) return {};
  const errors: Record<string, string> = {};
  for (const err of compiler.Errors(values)) {
    const key = err.path.replace(/^\//, "").replace(/\//g, ".") || "_root";
    if (!errors[key]) errors[key] = err.message;
  }
  return errors;
}

describe("FormBox validation", () => {
  it("returns no errors for valid data", () => {
    const errors = validate({ email: "test@example.com", password: "12345678" });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns error for invalid email", () => {
    const errors = validate({ email: "not-an-email", password: "12345678" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  it("returns error for short password", () => {
    const errors = validate({ email: "test@example.com", password: "123" });
    expect(errors.password).toBeDefined();
    expect(errors.email).toBeUndefined();
  });

  it("returns errors for empty object", () => {
    const errors = validate({});
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it("returns multiple field errors at once", () => {
    const errors = validate({ email: "bad", password: "ab" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe("TypeBox schema type inference", () => {
  it("Static type matches expected shape", () => {
    // Compile-time check — if this file compiles, types are correct
    type Login = import("@sinclair/typebox").Static<typeof LoginSchema>;
    const valid: Login = { email: "a@b.com", password: "12345678" };
    expect(valid.email).toBe("a@b.com");
  });
});
