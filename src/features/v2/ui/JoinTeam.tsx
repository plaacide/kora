"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { acceptV2TeamInvitation } from "@/app/v2/rejoindre-equipe/actions";
import { v2Routes } from "@/features/v2/navigation/routes";

import { Icon } from "./Icon";
import { SanzaWordmark } from "./Logo";

export type EtatInvitation =
  | "valide"
  | "expiree"
  | "revoquee"
  | "acceptee"
  | "introuvable";

/**
 * Rejoindre l'équipe — la contrepartie de l'écran 33.
 *
 * L'écran dit d'abord CE QU'ON ACCEPTE : quelle organisation, quel rôle, quelle
 * adresse. Un bouton « Rejoindre » seul ferait signer à l'aveugle une entrée
 * dans une entreprise dont on ne saurait ni le nom ni les droits qu'on y aura.
 */
export function JoinTeam({
  adresseAttendue,
  adresseConnectee,
  etat,
  organisation,
  roleLabel,
  token,
}: {
  adresseAttendue: string | null;
  /** `null` si personne n'est connecté : il faudra d'abord un compte. */
  adresseConnectee: string | null;
  etat: EtatInvitation;
  organisation: string | null;
  roleLabel: string | null;
  token: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // La bonne adresse est la condition d'acceptation, côté base comme ici. La
  // dire AVANT le clic évite un échec qu'on ne saurait pas expliquer.
  const bonneAdresse =
    adresseConnectee !== null &&
    adresseAttendue !== null &&
    adresseConnectee.toLowerCase() === adresseAttendue.toLowerCase();

  async function rejoindre() {
    setBusy(true);
    setErreur(null);

    const res = await acceptV2TeamInvitation({ token });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "L’invitation n’a pas pu être acceptée.");
      return;
    }

    router.push(v2Routes.operations.list);
    router.refresh();
  }

  const message: Record<Exclude<EtatInvitation, "valide">, string> = {
    expiree:
      "Ce lien a expiré. Demandez à l’organisation de vous en envoyer un nouveau.",
    revoquee: "Cette invitation a été révoquée.",
    acceptee:
      "Cette invitation a déjà été acceptée. Connectez-vous pour accéder à l’espace.",
    introuvable: "Ce lien ne correspond à aucune invitation.",
  };

  return (
    <main className="v2-auth-page">
      <section className="v2-auth-card">
        <SanzaWordmark height={26} />

        {etat !== "valide" ? (
          <>
            <h1>Invitation indisponible</h1>
            <p>{message[etat]}</p>
            <Link className="v2-btn" href={v2Routes.auth.login}>
              Aller à la connexion
            </Link>
          </>
        ) : (
          <>
            <h1>Rejoindre {organisation}</h1>
            <p>
              Vous êtes invité à rejoindre l’équipe de{" "}
              <strong>{organisation}</strong> en tant que{" "}
              <strong>{roleLabel}</strong>.
            </p>

            {erreur && (
              <p className="v2-auth-error" role="alert">
                {erreur}
              </p>
            )}

            <div className="v2-detail-grid">
              <div>
                <small>Adresse invitée</small>
                <strong>{adresseAttendue}</strong>
              </div>
              <div>
                <small>Rôle</small>
                <strong>{roleLabel}</strong>
              </div>
            </div>

            {adresseConnectee === null ? (
              <>
                <p className="v2-panel-note">
                  <Icon name="shield" />
                  Connectez-vous — ou créez votre compte — avec l’adresse{" "}
                  <strong>{adresseAttendue}</strong>, puis rouvrez ce lien.
                </p>
                <div className="v2-auth-actions">
                  <Link className="v2-btn" href={v2Routes.auth.login}>
                    Se connecter
                  </Link>
                  <Link
                    className="v2-btn"
                    data-variant="secondary"
                    href={v2Routes.auth.signup}
                  >
                    Créer un compte
                  </Link>
                </div>
              </>
            ) : !bonneAdresse ? (
              <p className="v2-panel-note">
                <Icon name="shield" />
                Vous êtes connecté avec <strong>{adresseConnectee}</strong>,
                mais cette invitation est adressée à{" "}
                <strong>{adresseAttendue}</strong>. Déconnectez-vous et
                reconnectez-vous avec la bonne adresse.
              </p>
            ) : (
              <>
                <p className="v2-panel-note">
                  <Icon name="users" />
                  En rejoignant cette équipe, vous accédez aux opérations de
                  l’organisation selon votre rôle. Vos actions y sont
                  journalisées, comme celles de tous les collaborateurs.
                </p>
                <button
                  className="v2-btn"
                  disabled={busy}
                  onClick={rejoindre}
                  type="button"
                >
                  {busy ? "…" : `Rejoindre ${organisation}`}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
