/**
 * Créer les comptes d'essai de la suite Playwright, sans qu'aucun humain ne
 * voie leur mot de passe.
 *
 * POURQUOI CE SCRIPT EXISTE. La suite authentifiée n'avait jamais tourné faute
 * d'identifiants, et il n'y avait pas de bonne façon d'en obtenir : le
 * fondateur ne saisit pas de mot de passe pour authentifier un agent, et un mot
 * de passe collé dans une conversation y reste. Ce script tranche autrement —
 * il en TIRE un au sort, crée les comptes par l'API d'administration, les écrit
 * dans `.env.test.local` que git ignore, et ne les affiche jamais.
 *
 * DEUX COMPTES, PARCE QU'UN SEUL NE PEUT PAS ÊTRE DANS DEUX ÉTATS.
 *
 *   · INSTALLÉ  — organisation créée, onboarding terminé. Il ouvre le poste de
 *     pilotage, le menu du compte, la data room. C'est une SARL sénégalaise en
 *     amorçage, choisie pour exercer les variantes du référentiel.
 *   · NEUF      — aucune organisation, jamais passé par l'onboarding. Les neuf
 *     tests d'onboarding s'ignoraient tout seuls avec le premier compte, et
 *     c'est précisément le parcours le plus critique de la bêta.
 *
 * Le compte NEUF est DÉTRUIT ET RECRÉÉ à chaque exécution : un test qui termine
 * l'onboarding le rendrait installé, et la fois suivante les mêmes neuf tests
 * s'ignoreraient de nouveau, sans que rien ne le signale.
 *
 * CE QU'IL NE FAIT JAMAIS : viser autre chose que la recette. La cible est
 * vérifiée avant toute écriture, et la production `bileqzpguyynkktndazs` est
 * refusée nommément.
 *
 * Usage : node e2e/creer-compte-essai.mjs
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const PRODUCTION_INTERDITE = "bileqzpguyynkktndazs";
const STAGING = "jourzsgjnutktsrgxkoo";

const INSTALLE = "zz-test-e2e@sanza.africa";
const NEUF = "zz-test-neuf@sanza.africa";

function env(fichier) {
  if (!existsSync(fichier)) return {};
  return Object.fromEntries(
    readFileSync(fichier, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

const local = env(".env.local");
const url = local.NEXT_PUBLIC_SUPABASE_URL;
const cleAdmin = local.SUPABASE_SERVICE_ROLE_KEY;
const clePublique =
  local.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !cleAdmin || !clePublique) {
  console.error(
    "`.env.local` doit porter NEXT_PUBLIC_SUPABASE_URL, " +
      "SUPABASE_SERVICE_ROLE_KEY et la clé publique.",
  );
  process.exit(1);
}

if (url.includes(PRODUCTION_INTERDITE) || !url.includes(STAGING)) {
  console.error(
    `REFUS : seule la recette ${STAGING} est autorisée. Cible reçue : ${url}`,
  );
  process.exit(1);
}

const admin = createClient(url, cleAdmin, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** 32 octets en base64url : ni mémorisable, ni devinable, ni saisi par personne. */
const motDePasse = () => randomBytes(32).toString("base64url");

async function trouver(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find((u) => u.email === email) ?? null;
}

async function poser(email, { recreer }) {
  const mdp = motDePasse();
  const existant = await trouver(email);

  if (existant && recreer) {
    const { error } = await admin.auth.admin.deleteUser(existant.id);
    if (error) throw new Error(`Suppression de ${email} : ${error.message}`);
  }

  if (existant && !recreer) {
    const { error } = await admin.auth.admin.updateUserById(existant.id, {
      password: mdp,
      email_confirm: true,
    });
    if (error) throw new Error(`Renouvellement de ${email} : ${error.message}`);
    return { id: existant.id, mdp, cree: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: mdp,
    email_confirm: true,
    user_metadata: {
      full_name: "ZZ Test E2E",
      locale: "fr",
      account_type: "founder",
      job_title: "Compte de test automatisé",
    },
  });
  if (error) throw new Error(`Création de ${email} : ${error.message}`);
  return { id: data.user.id, mdp, cree: true };
}

/**
 * Installer le compte : entreprise puis organisation.
 *
 * On passe par les MÊMES fonctions que l'interface, sous l'identité du compte,
 * plutôt que par des insertions directes — sinon le compte de test vivrait dans
 * un état que le produit ne sait pas produire, et la suite éprouverait une
 * fiction.
 */
async function installer(email, mdp) {
  const client = createClient(url, clePublique, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: err } = await client.auth.signInWithPassword({
    email,
    password: mdp,
  });
  if (err) throw new Error(`Connexion de ${email} : ${err.message}`);

  const { data: deja } = await client
    .from("memberships")
    .select("org_id")
    .limit(1)
    .maybeSingle();
  if (deja) return false;

  const { error: e1 } = await client.rpc("save_startup", {
    p_name: "ZZ-TEST Entreprise E2E",
    p_country: "Sénégal",
    p_sector: "Technologies et télécoms",
    p_stage: "Amorçage",
    p_one_liner: "Compte de test automatisé — données fabriquées.",
    p_amount: 50000000,
    p_arr: null,
    p_objectif: "levee",
    p_horizon: null,
    p_devise: "XOF",
    p_modalite: "Amorçage",
    p_forme_juridique: "SARL",
    p_numero_immatriculation: "SN-DKR-0000-Z-00000",
    p_site_web: null,
  });
  if (e1) throw new Error(`save_startup : ${e1.message}`);

  const { error: e2 } = await client.rpc("complete_onboarding", {
    p_org_name: "ZZ-TEST Organisation E2E",
    p_create_room: true,
  });
  if (e2) throw new Error(`complete_onboarding : ${e2.message}`);
  return true;
}

const installe = await poser(INSTALLE, { recreer: false });
const pose = await installer(INSTALLE, installe.mdp);
console.log(
  `Compte installé : ${installe.cree ? "créé" : "mot de passe renouvelé"}` +
    (pose ? ", onboarding effectué." : ", onboarding déjà fait."),
);

const neuf = await poser(NEUF, { recreer: true });
console.log("Compte neuf : recréé, aucun onboarding.");

writeFileSync(
  ".env.test.local",
  `# Écrit par e2e/creer-compte-essai.mjs. Ignoré par git.\n` +
    `# Comptes de RECETTE dédiés, jamais des comptes réels.\n` +
    `NEXT_PUBLIC_SUPABASE_URL=${url}\n` +
    `E2E_EMAIL=${INSTALLE}\n` +
    `E2E_PASSWORD=${installe.mdp}\n` +
    `E2E_EMAIL_NEUF=${NEUF}\n` +
    `E2E_PASSWORD_NEUF=${neuf.mdp}\n`,
  { mode: 0o600 },
);

console.log(
  "`.env.test.local` écrit. Aucun mot de passe n’est affiché ni journalisé.",
);
