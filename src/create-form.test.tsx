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



// "A note or a link": a rule across fields, as a union of objects.
const ProofSchema = Type.Union([
  Type.Object({ note: Type.String({ pattern: "\\S" }), url: Type.String() }),
  Type.Object({ note: Type.String(), url: Type.String({ pattern: "^https?://\\S+$" }) }),
]);

describe("Union schemas", () => {
  it("is valid when any variant accepts the values", () => {
    const form = createForm(ProofSchema, { initialValues: { note: "", url: "" } });
    expect(form.valid()).toBe(false);

    form.setValue("note", "Done");
    expect(form.valid()).toBe(true);

    form.setValues({ note: "", url: "https://example.com/pr/1" });
    expect(form.valid()).toBe(true);
  });

  it("shows the closest variant's errors on its fields after submit", async () => {
    const form = createForm(ProofSchema, { initialValues: { note: "", url: "ftp://x" } });
    let submitted = false;
    await form._internalSubmit(() => {
      submitted = true;
    })({ preventDefault() {} } as Event);

    expect(submitted).toBe(false);
    // Every field of every variant is touched; one variant fails on a single field.
    expect(form.touched("note")).toBe(true);
    expect(form.touched("url")).toBe(true);
    expect(Object.keys(form.errors())).toHaveLength(1);
  });

  it("submits the values when a variant matches", async () => {
    const form = createForm(ProofSchema, { initialValues: { note: "Fixed", url: "" } });
    let received: unknown;
    await form._internalSubmit((values) => {
      received = values;
    })({ preventDefault() {} } as Event);
    expect(received).toEqual({ note: "Fixed", url: "" });
  });

  it("uses a discriminated union's fields together", () => {
    const Review = Type.Union([
      Type.Object({ decision: Type.Literal("approve") }),
      Type.Object({ decision: Type.Literal("reject"), note: Type.String({ minLength: 1 }) }),
    ]);
    const form = createForm(Review, { initialValues: { decision: "reject", note: "" } });
    expect(form.valid()).toBe(false);
    form.setValue("note", "Tests fail");
    expect(form.valid()).toBe(true);
    form.setValues({ decision: "approve" });
    expect(form.valid()).toBe(true);
  });
});
