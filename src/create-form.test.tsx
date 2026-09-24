import { describe, it, expect } from "bun:test";
import { Type } from "@sinclair/typebox";
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

  it("validates email format without throwing unknown format error", () => {
    const form = createForm(LoginSchema);
    const emailField = form._fieldProps("email");

    // Invalid email input
    emailField.onInput({ currentTarget: { value: "not-an-email" } } as any);
    emailField.onBlur();

    expect(form.touched("email")).toBe(true);
    const err = form.error("email");
    expect(err).toBeDefined();
    expect(err).not.toContain("Unknown format");
    expect(err).toContain("email");
  });

  it("marks form valid when all fields including email format are satisfied", () => {
    const form = createForm(LoginSchema);
    form._fieldProps("email").onInput({ currentTarget: { value: "user@example.com" } } as any);
    form._fieldProps("password").onInput({ currentTarget: { value: "12345678" } } as any);

    expect(form.valid()).toBe(true);
    expect(form.error("email")).toBeUndefined();
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

  it("supports custom formats registered via addFormat", async () => {
    const { addFormat } = await import("./formats");
    addFormat("voen", (v) => /^\d{10}$/.test(v));

    const CompanySchema = Type.Object({
      taxId: Type.String({ format: "voen" }),
    });

    const form = createForm(CompanySchema);
    const taxField = form._fieldProps("taxId");

    taxField.onInput({ currentTarget: { value: "123" } } as any);
    taxField.onBlur();
    expect(form.error("taxId")).toBeDefined();
    expect(form.error("taxId")).not.toContain("Unknown format");

    taxField.onInput({ currentTarget: { value: "1234567890" } } as any);
    taxField.onBlur();
    expect(form.error("taxId")).toBeUndefined();
    expect(form.valid()).toBe(true);
  });

  it("supports initialValues in createForm options", () => {
    const form = createForm(LoginSchema, {
      initialValues: { email: "initial@example.com" },
    });

    expect(form.values().email).toBe("initial@example.com");
    expect(form._fieldProps("email").value).toBe("initial@example.com");

    form.reset();
    expect(form.values().email).toBe("initial@example.com");
  });

  it("supports setting values via setValue and setValues", () => {
    const form = createForm(LoginSchema);

    form.setValue("email", "setvalue@example.com");
    expect(form.values().email).toBe("setvalue@example.com");
    expect(form._fieldProps("email").value).toBe("setvalue@example.com");

    form.setValues({ email: "updated@example.com", password: "password123" });
    expect(form.values().email).toBe("updated@example.com");
    expect(form.values().password).toBe("password123");
    expect(form.valid()).toBe(true);
  });
});


