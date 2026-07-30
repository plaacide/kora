import { describe, expect, it } from "vitest";

import { loginSchema, newPasswordSchema, signupSchema } from "./auth";

const VALID_SIGNUP = {
  full_name: "Amara Diallo",
  job_title: "Fondatrice & CEO",
  email: "amara@nimbasolar.com",
  password: "motdepasse1",
};

describe("signupSchema", () => {
  it("accepte une inscription complète et valide", () => {
    expect(signupSchema.safeParse(VALID_SIGNUP).success).toBe(true);
  });

  it("rejette un nom trop court", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, full_name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejette un poste vide — le champ dépend de l'interface mais reste requis côté serveur", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, job_title: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un e-mail mal formé", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, email: "pas-un-email" });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, password: "motdepasse" });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe sans lettre", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe de moins de 8 caractères", () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, password: "abc123" });
    expect(result.success).toBe(false);
  });

  it("retombe sur founder et fr par défaut", () => {
    const result = signupSchema.safeParse(VALID_SIGNUP);
    if (!result.success) throw new Error("devrait réussir");
    expect(result.data.account_type).toBe("founder");
    expect(result.data.locale).toBe("fr");
  });
});

describe("loginSchema", () => {
  it("accepte un e-mail et un mot de passe non vide", () => {
    const result = loginSchema.safeParse({
      email: "amara@nimbasolar.com",
      password: "quoiquecesoit",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe vide, sans exiger sa complexité — la connexion n'est pas l'inscription", () => {
    const result = loginSchema.safeParse({
      email: "amara@nimbasolar.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("rejette deux mots de passe qui ne correspondent pas", () => {
    const result = newPasswordSchema.safeParse({
      password: "motdepasse1",
      confirm: "motdepasse2",
    });
    expect(result.success).toBe(false);
  });

  it("accepte deux mots de passe identiques et valides", () => {
    const result = newPasswordSchema.safeParse({
      password: "motdepasse1",
      confirm: "motdepasse1",
    });
    expect(result.success).toBe(true);
  });
});
