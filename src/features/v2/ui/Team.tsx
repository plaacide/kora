"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  inviteV2Member,
  removeV2Member,
  revokeV2Invitation,
  setV2MemberRole,
} from "@/app/v2/(workspace)/team/actions";
import {
  ROLES,
  dernierProprietaire,
  role as roleDe,
  type Membre,
  type RoleInterne,
} from "@/features/v2/domain/equipe";
import { messageDErreur } from "@/features/v2/domain/erreurs";
import { dateJournal } from "@/features/v2/domain/journal";
import type { InvitationEquipe } from "@/features/v2/server/equipe";

import { Icon } from "./Icon";

/**
 * Écran 33 — l'équipe interne.
 *
 * Ce tableau montrait quatre collaborateurs inventés. Il montre maintenant ceux
 * de l'organisation : `memberships` pour le rôle, `profiles` pour le nom,
 * `audit_log` pour la dernière trace.
 */
export function TeamTable({
  invitations,
  membres,
  monRole,
  organizationId,
}: {
  invitations: readonly InvitationEquipe[];
  membres: readonly Membre[];
  /** `null` si la personne connectée n'est pas interne — elle ne gère rien. */
  monRole: RoleInterne | null;
  organizationId: string;
}) {
  const [gere, setGere] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);
  const peutGerer = monRole === "owner" || monRole === "admin";
  const membre = membres.find((m) => m.id === gere) ?? null;

  return (
    <>
      {peutGerer && (
        <div className="v2-team-actions">
          <button
            className="v2-btn"
            onClick={() => setInvite(true)}
            type="button"
          >
            <Icon name="plus" />
            Inviter un collaborateur
          </button>
        </div>
      )}

      {invitations.length > 0 && (
        <PendingInvitations invitations={invitations} peutGerer={peutGerer} />
      )}

      <div className="v2-folder-card v2-table-wrap">
        <table className="v2-team-table">
          <thead>
            <tr>
              <th>Membre</th>
              <th>Rôle</th>
              <th>Périmètre</th>
              <th>Dernière activité</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {membres.map((m) => {
              const r = roleDe(m.role);
              return (
                <tr key={m.id}>
                  <td>
                    <div className="v2-member">
                      <span className="v2-member-avatar">{m.initiales}</span>
                      <div>
                        <b>
                          {m.nom}
                          {m.cestMoi && <small> — vous</small>}
                        </b>
                        <small>{m.email ?? "adresse inconnue"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="v2-status" data-tone={r.tone}>
                      {r.label}
                    </span>
                  </td>
                  {/* Le périmètre est le même pour tous, et c'est la vérité :
                      un collaborateur interne voit toutes les opérations de son
                      organisation. Écrire « Série A — Finance » sur une ligne
                      donnerait à croire à un cloisonnement qui n'existe pas. */}
                  <td className="v2-cell-2">Toutes les opérations</td>
                  <td className="v2-cell-3">
                    {m.derniereActivite
                      ? dateJournal(m.derniereActivite)
                      : "aucune"}
                  </td>
                  <td>
                    {peutGerer && !m.cestMoi ? (
                      <button
                        className="v2-btn-mini"
                        onClick={() => setGere(m.id)}
                        type="button"
                      >
                        Gérer
                      </button>
                    ) : (
                      <span className="v2-cell-3">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="v2-content-card">
        <div className="v2-nav-label">Rôles internes</div>
        <div className="v2-roles-grid">
          {ROLES.map((r) => (
            <div key={r.cle}>
              <b>{r.label}</b>
              <br />
              {r.pouvoir}
            </div>
          ))}
        </div>
        <p className="v2-roles-note">
          <Icon name="shield" />
          Le périmètre par opération n’existe pas encore : un collaborateur
          interne accède à toutes les opérations de l’organisation, quel que
          soit son rôle. Ce qui change d’un rôle à l’autre, c’est ce qu’il peut
          y faire.
        </p>
      </section>

      {membre && (
        <ManagePanel
          membre={membre}
          membres={membres}
          monRole={monRole}
          onClose={() => setGere(null)}
        />
      )}

      {invite && (
        <InvitePanel
          monRole={monRole}
          onClose={() => setInvite(false)}
          organizationId={organizationId}
        />
      )}
    </>
  );
}

/**
 * Les invitations envoyées, au-dessus du tableau.
 *
 * Séparées des collaborateurs à dessein : une personne invitée n'a rien
 * accepté. La mêler à l'équipe ferait compter un membre qui n'existe pas
 * encore, et laisserait croire qu'elle a déjà accès à la data room.
 */
function PendingInvitations({
  invitations,
  peutGerer,
}: {
  invitations: readonly InvitationEquipe[];
  peutGerer: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function revoquer(id: string) {
    setBusy(id);
    await revokeV2Invitation({ invitationId: id });
    setBusy(null);
    router.refresh();
  }

  return (
    <section className="v2-content-card v2-pending-invites">
      <div className="v2-nav-label">
        Invitations en attente ({invitations.length})
      </div>
      {invitations.map((i) => (
        <div key={i.id}>
          <div>
            <b>{i.email}</b>
            <small>
              {roleDe(i.role).label} · envoyée le {dateJournal(i.envoyeeLe)}
              {i.expiree
                ? " · lien expiré"
                : i.expireLe
                  ? ` · expire le ${dateJournal(i.expireLe)}`
                  : ""}
            </small>
          </div>
          {i.expiree && (
            <span className="v2-status" data-tone="red">
              Expirée
            </span>
          )}
          {peutGerer && (
            <button
              className="v2-btn-mini"
              disabled={busy === i.id}
              onClick={() => revoquer(i.id)}
              type="button"
            >
              {busy === i.id ? "…" : "Révoquer"}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * Inviter — écran 33.
 *
 * On envoie une invitation plutôt que d'ajouter directement : rattacher
 * quelqu'un à une organisation sans son accord lui ouvrirait toutes les data
 * rooms de l'entreprise. Dans un produit dont l'objet est le contrôle de qui
 * voit quoi, l'accord de la personne n'est pas une politesse.
 */
function InvitePanel({
  monRole,
  onClose,
  organizationId,
}: {
  monRole: RoleInterne | null;
  onClose: () => void;
  organizationId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [choisi, setChoisi] = useState<RoleInterne>("member");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);

  async function envoyer() {
    setBusy(true);
    setErreur(null);

    const res = await inviteV2Member({ organizationId, email, role: choisi });

    setBusy(false);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }

    // L'e-mail peut échouer sans que l'invitation soit perdue : on montre
    // alors le lien plutôt que d'annoncer un envoi qui n'a pas eu lieu.
    if (res.emailSkipped || res.emailError) {
      setLien(res.link ?? null);
      router.refresh();
      return;
    }

    onClose();
    router.refresh();
  }

  if (lien) {
    return (
      <>
        <button
          aria-label="Fermer"
          className="v2-scrim"
          onClick={onClose}
          type="button"
        />
        <aside className="v2-sidepanel">
          <header>
            <div>
              <span className="v2-panel-eyebrow">Invitation créée</span>
              <h2>L’e-mail n’est pas parti</h2>
            </div>
            <button aria-label="Fermer" onClick={onClose} type="button">
              ×
            </button>
          </header>
          <div className="v2-sidepanel-body">
            <p className="v2-panel-note">
              <Icon name="shield" />
              L’invitation existe et le lien fonctionne — seul l’envoi a échoué.
              Transmettez-le à {email} par le moyen de votre choix.
            </p>
            <label className="v2-field" data-wide="true">
              <span>Lien d’invitation</span>
              <span className="v2-control">
                <input onFocus={(e) => e.target.select()} readOnly value={lien} />
              </span>
              <small className="v2-field-helper">
                Il ne fonctionne qu’avec l’adresse {email}.
              </small>
            </label>
          </div>
          <footer className="v2-sidepanel-footer">
            <button className="v2-btn" onClick={onClose} type="button">
              Terminé
            </button>
          </footer>
        </aside>
      </>
    );
  }

  return (
    <>
      <button
        aria-label="Fermer"
        className="v2-scrim"
        onClick={onClose}
        type="button"
      />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-panel-eyebrow">Équipe</span>
            <h2>Inviter un collaborateur</h2>
          </div>
          <button aria-label="Fermer" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <label className="v2-field" data-wide="true">
            <span>Adresse e-mail</span>
            <span className="v2-control">
              <input
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@entreprise.com"
                type="email"
                value={email}
              />
            </span>
            <small className="v2-field-helper">
              Le lien ne fonctionnera qu’avec cette adresse.
            </small>
          </label>

          <fieldset className="v2-level-choice">
            <legend>Rôle proposé</legend>
            {ROLES.map((r) => (
              <label data-active={choisi === r.cle} key={r.cle}>
                <input
                  checked={choisi === r.cle}
                  disabled={r.cle === "owner" && monRole !== "owner"}
                  name="invite-role"
                  onChange={() => setChoisi(r.cle)}
                  type="radio"
                />
                <span>
                  <strong>{r.label}</strong>
                  <small>{r.pouvoir}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="v2-panel-note">
            <Icon name="users" />
            Un collaborateur interne accède à toutes les opérations de
            l’organisation. Pour ouvrir une seule data room à un tiers —
            investisseur, banque, auditeur — passez par Partage et accès.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <button disabled={busy} onClick={onClose} type="button">
            Annuler
          </button>
          <button
            className="v2-btn"
            disabled={busy || !email.includes("@")}
            onClick={envoyer}
            type="button"
          >
            {busy ? "Envoi…" : "Envoyer l’invitation"}
          </button>
        </footer>
      </aside>
    </>
  );
}

/** Changer le rôle d'un collaborateur, ou le retirer. */
function ManagePanel({
  membre,
  membres,
  monRole,
  onClose,
}: {
  membre: Membre;
  membres: readonly Membre[];
  monRole: RoleInterne | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [choisi, setChoisi] = useState<RoleInterne>(membre.role);
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);

  const bloque = dernierProprietaire(membre, membres);
  // Un admin ne nomme pas un propriétaire : il pourrait ensuite se promouvoir.
  const peutNommerProprietaire = monRole === "owner";

  async function enregistrer() {
    setBusy("save");
    setErreur(null);

    const res = await setV2MemberRole({ memberId: membre.id, role: choisi });

    setBusy(null);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }

    onClose();
    router.refresh();
  }

  async function retirer() {
    setBusy("remove");
    setErreur(null);

    const res = await removeV2Member({ memberId: membre.id });

    setBusy(null);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <>
      <button
        aria-label="Fermer"
        className="v2-scrim"
        onClick={onClose}
        type="button"
      />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-panel-eyebrow">Collaborateur</span>
            <h2>{membre.nom}</h2>
          </div>
          <button aria-label="Fermer" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <div className="v2-detail-grid">
            <div>
              <small>Adresse</small>
              <strong>{membre.email ?? "—"}</strong>
            </div>
            <div>
              <small>Dernière activité</small>
              <strong>
                {membre.derniereActivite
                  ? dateJournal(membre.derniereActivite)
                  : "aucune"}
              </strong>
            </div>
          </div>

          <fieldset className="v2-level-choice">
            <legend>Rôle</legend>
            {ROLES.map((r) => {
              const interdit =
                (r.cle === "owner" && !peutNommerProprietaire) ||
                (bloque && r.cle !== "owner");

              return (
                <label data-active={choisi === r.cle} key={r.cle}>
                  <input
                    checked={choisi === r.cle}
                    disabled={interdit}
                    name="role"
                    onChange={() => setChoisi(r.cle)}
                    type="radio"
                  />
                  <span>
                    <strong>{r.label}</strong>
                    <small>{r.pouvoir}</small>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {bloque && (
            <p className="v2-panel-note">
              <Icon name="shield" />
              {membre.nom} est le seul propriétaire. Nommez-en un autre avant de
              changer ce rôle — sinon plus personne ne pourrait administrer
              l’organisation.
            </p>
          )}

          <p className="v2-panel-note">
            <Icon name="users" />
            Retirer un collaborateur ferme son accès. Ses dépôts et ses lignes
            de journal restent : le journal doit rester une preuve.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          {confirme ? (
            <button
              className="v2-btn v2-danger-button"
              disabled={busy !== null || bloque}
              onClick={retirer}
              type="button"
            >
              {busy === "remove" ? "…" : "Confirmer le retrait"}
            </button>
          ) : (
            <button
              disabled={busy !== null || bloque}
              onClick={() => setConfirme(true)}
              type="button"
            >
              Retirer de l’équipe
            </button>
          )}
          <button
            className="v2-btn"
            disabled={busy !== null || choisi === membre.role}
            onClick={enregistrer}
            type="button"
          >
            {busy === "save" ? "…" : "Enregistrer le rôle"}
          </button>
        </footer>
      </aside>
    </>
  );
}
