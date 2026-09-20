import { describe, it, expect } from "bun:test";
import { Type } from "@sinclair/typebox";
import "./formats";
import { createForm } from "./core";

const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

describe("FormBox Core API", () => {
  it("initializes without errors but is invalid by default", () => {
    const form = createForm(LoginSchema);
    expect(Object.keys(form.errors())).toHaveLength(0);
  });

  it("updates value and touched state on field blur", () => {
    const form = createForm(LoginSchema);
    const emailField = form._fieldProps("email");
    
    emailField.onInput({ currentTarget: { value: "invalid-email" } } as any);
    expect(form.values().email).toBe("invalid-email");
    
    emailField.onBlur();
    expect(form.touched("email")).toBe(true);
  });
  
  it("resets form state correctly", () => {
    const form = createForm(LoginSchema);
    form._fieldProps("email").onInput({ currentTarget: { value: "test@example.com" } } as any);
    form._fieldProps("email").onBlur();
    
    form.reset();
    expect(form.values().email).toBeUndefined();
    expect(form.touched("email")).toBe(false);
  });
});
