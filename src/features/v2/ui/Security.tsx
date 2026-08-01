"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  logV2Security,
  signOutOtherDevices,
} from "@/app/v2/(workspace)/security/actions";
import { dateJournal, heure } from "@/features/v2/domain/journal";
import type {
  EtatSecurite,
  EvenementSecurite,
} from "@/features/v2/server/securite";
import { createClient } from "@/lib/supabase/client";

import { messageDErreur } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";

/**
 * Écran 34 — sécurité du compte.
 *
 * L'écran annonçait « Non configurée », « 10 codes de récupération non
 * générés » et trois sessions actives — un MacBook à Dakar, un iPhone, un
 * Windows à Thiès. Aucune n'existait. Lire « aucune session suspecte » sur des
 * lignes inventées est plus grave qu'un tableau vide : on y croit.
 *
 * L'inscription du facteur TOTP se fait ici, dans le navigateur, parce que
 * c'est Supabase qui la gère et qu'elle exige la session vivante de l'usager.
 */
export function SecurityScreen({
  etat,
  journal,
}: {
  etat: EtatSecurite;
  journal: readonly EvenementSecurite[];
}) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmeArret, setConfirmeArret] = useState(false);

  async function commencer() {
    setBusy("enroll");
    setErreur(null);

    const supabase = createClient();

    // Les facteurs commencés et jamais vérifiés s'accumulent sinon : Supabase
    // refuse un nouveau `enroll` quand un nom identique traîne, et l'écran se
    // bloquerait sans dire pourquoi.
    const { data: existants } = await supabase.auth.mfa.listFactors();
    for (const f of existants?.totp ?? []) {
      if (f.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Sanza · ${new Date().toISOString().slice(0, 16)}`,
    });

    setBusy(null);
    if (error) {
      console.error("[v2 sécurité] enrôlement échoué :", error);
      setErreur(messageDErreur("mfa.activation_impossible"));
      return;
    }

    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function verifier() {
    if (!factorId) return;
    setBusy("verify");
    setErreur(null);

    const supabase = createClient();
    const defi = await supabase.auth.mfa.challenge({ factorId });

    if (defi.error) {
      setBusy(null);
      console.error("[v2 sécurité] défi échoué :", defi.error);
      setErreur(messageDErreur("mfa.activation_impossible"));
      return;
    }

    const v = await supabase.auth.mfa.verify({
      factorId,
      challengeId: defi.data.id,
      code: code.trim(),
    });

    if (v.error) {
      setBusy(null);
      setErreur(messageDErreur("mfa.code_invalide"));
      return;
    }

    await logV2Security({ action: "security.mfa_enabled" });

    setBusy(null);
    setQr(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    router.refresh();
  }

  async function desactiver() {
    setBusy("disable");
    setErreur(null);

    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();

    for (const f of data?.totp ?? []) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (error) {
        setBusy(null);
        console.error("[v2 sécurité] désinscription échouée :", error);
        setErreur(messageDErreur("mfa.desactivation_impossible"));
        return;
      }
    }

    await logV2Security({ action: "security.mfa_disabled" });

    setBusy(null);
    router.refresh();
  }

  async function deconnecterLesAutres() {
    setBusy("signout");
    setErreur(null);

    const res = await signOutOtherDevices();

    setBusy(null);
    setConfirmeArret(false);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }
    router.refresh();
  }

  return (
    <div className="v2-narrow-page">
      {!etat.totpActif && !qr && (
        <section className="v2-promo-card">
          <span className="v2-promo-icon">
            <Icon name="shield" />
          </span>
          <div>
            <h2>Renforcez l’accès à votre espace</h2>
            <p>
              La double authentification protège votre compte même si votre mot
              de passe est compromis. Une data room ouverte par un mot de passe
              volé n’a jamais l’air d’une intrusion.
            </p>
            <div className="v2-promo-actions">
              <button
                className="v2-btn"
                disabled={busy !== null}
                onClick={commencer}
                type="button"
              >
                {busy === "enroll" ? "…" : "Activer la double authentification"}
              </button>
            </div>
          </div>
        </section>
      )}

      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}

      {qr && (
        <section className="v2-content-card v2-mfa-setup">
          <div className="v2-nav-label">Application d’authentification</div>
          <p>
            Scannez ce code avec Google Authenticator, 1Password, Authy ou
            l’application de votre choix, puis saisissez le code à six chiffres
            qu’elle affiche.
          </p>
          <div className="v2-mfa-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Code à scanner" src={qr} />
            <div>
              <small>Si vous ne pouvez pas scanner, saisissez cette clé :</small>
              <code>{secret}</code>
            </div>
          </div>
          <label className="v2-field">
            <span>Code à six chiffres</span>
            <span className="v2-control">
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                value={code}
              />
            </span>
          </label>
          <div className="v2-mfa-actions">
            <button
              disabled={busy !== null}
              onClick={() => {
                setQr(null);
                setFactorId(null);
                setSecret(null);
              }}
              type="button"
            >
              Annuler
            </button>
            <button
              className="v2-btn"
              disabled={busy !== null || code.trim().length < 6}
              onClick={verifier}
              type="button"
            >
              {busy === "verify" ? "Vérification…" : "Activer"}
            </button>
          </div>
        </section>
      )}

      <section className="v2-content-card">
        <div className="v2-nav-label">Méthodes</div>

        <div className="v2-method-row">
          <div>
            <b>Application d’authentification</b>
            <small>Codes à usage unique (TOTP) — recommandé</small>
          </div>
          <span
            className="v2-status"
            data-tone={etat.totpActif ? "green" : "neutral"}
          >
            {etat.totpActif ? "Active" : "Non configurée"}
          </span>
          {etat.totpActif ? (
            <button
              className="v2-btn-mini"
              disabled={busy !== null}
              onClick={desactiver}
              type="button"
            >
              {busy === "disable" ? "…" : "Désactiver"}
            </button>
          ) : (
            <button
              className="v2-btn-mini"
              disabled={busy !== null || qr !== null}
              onClick={commencer}
              type="button"
            >
              Configurer
            </button>
          )}
        </div>

        {/* Les codes de récupération de la maquette ne sont pas ici, et c'est
            volontaire : les générer serait facile, les faire FONCTIONNER ne
            l'est pas. Un code de secours doit ouvrir la porte quand le
            téléphone est perdu — sans quoi on imprime dix lignes qui ne
            servent à rien le jour où elles comptent. */}
        <p className="v2-roles-note">
          <Icon name="shield" />
          Les codes de récupération n’existent pas encore. Si vous perdez votre
          téléphone, seul un administrateur de Sanza peut rouvrir votre compte —
          gardez votre application d’authentification sauvegardée.
        </p>
      </section>

      <section className="v2-content-card">
        <div className="v2-nav-label">Appareils connectés</div>
        {/* La maquette liste les sessions — appareil, ville, heure. Supabase ne
            les expose ni au client ni à l'API d'administration : il n'existe
            aucun point d'accès qui les énumère. Trois lignes plausibles
            valaient pire que rien. Le geste, lui, existe. */}
        <p>
          Vous êtes connecté avec <strong>{etat.email}</strong>
          {etat.niveau === "aal2" && " · session vérifiée en deux étapes"}.
        </p>
        <p className="v2-roles-note">
          <Icon name="eye" />
          La liste des appareils connectés n’est pas disponible : notre
          fournisseur d’authentification ne l’expose pas. Vous pouvez en
          revanche fermer toutes les autres sessions d’un geste.
        </p>
        {confirmeArret ? (
          <div className="v2-mfa-actions">
            <button
              disabled={busy !== null}
              onClick={() => setConfirmeArret(false)}
              type="button"
            >
              Annuler
            </button>
            <button
              className="v2-btn v2-danger-button"
              disabled={busy !== null}
              onClick={deconnecterLesAutres}
              type="button"
            >
              {busy === "signout" ? "…" : "Confirmer la déconnexion"}
            </button>
          </div>
        ) : (
          <button
            className="v2-btn"
            data-variant="secondary"
            disabled={busy !== null}
            onClick={() => setConfirmeArret(true)}
            type="button"
          >
            Déconnecter les autres appareils
          </button>
        )}
      </section>

      <section className="v2-content-card">
        <div className="v2-nav-label">Journal de sécurité</div>
        {journal.length === 0 ? (
          <p>
            Aucun événement pour l’instant. Les activations, désactivations et
            changements de rôle s’inscrivent ici — distincts de l’activité
            documentaire, qui se lit dans chaque opération.
          </p>
        ) : (
          <div className="v2-security-journal">
            {journal.map((e) => (
              <div key={e.id}>
                <span />
                <div>
                  <b>{e.libelle}</b>
                  <small>
                    {dateJournal(e.at)} · {heure(e.at)} · par {e.auteur}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
