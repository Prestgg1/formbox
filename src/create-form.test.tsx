import { describe, it, expect } from "bun:test";
import { Type } from "@sinclair/typebox";
import "./formats";
import { createForm } from "./core";

const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
});

describe("FormBox API", () => {
  it("initializes without errors", () => {
    const form = createForm(LoginSchema);
    expect(Object.keys(form.errors())).toHaveLength(0);
    expect(form.valid()).toBe(false); // actually false because empty is invalid
  });
});
