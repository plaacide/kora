import { Icon } from "./Icon";
import { Standalone } from "./Shell";

/**
 * Écran 34 — Sécurité et activation 2FA.
 * Repris de `sanza_handoff/maquettes/screens/34-securite-2fa.html`.
 */

const METHODS = [
  {
    title: "Application d’authentification",
    detail: "Codes à usage unique (TOTP) — recommandé",
    status: "Non configurée",
    action: "Configurer",
  },
  {
    title: "Codes de récupération",
    detail: "10 codes à conserver hors ligne",
    status: "Non générés",
    action: "Générer",
  },
];

const SESSIONS = [
  {
    device: "MacBook Pro · Chrome",
    place: "Dakar, Sénégal · session courante",
    when: "maintenant",
    current: true,
  },
  {
    device: "iPhone 14 · Safari",
    place: "Dakar, Sénégal",
    when: "il y a 3 h",
    current: false,
  },
  {
    device: "Windows · Edge",
    place: "Thiès, Sénégal",
    when: "25-07-2026",
    current: false,
  },
];

export function SecurityScreen() {
  return (
    <Standalone search={false} title="Sécurité">
      <div className="v2-narrow-page">
        <section className="v2-promo-card">
          <span className="v2-promo-icon">
            <Icon name="shield" />
          </span>
          <div>
            <h2>Renforcez l’accès à votre espace</h2>
            <p>
              La double authentification protège votre compte même si votre mot
              de passe est compromis. Elle sera requise avant votre premier
              partage externe.
            </p>
            <div className="v2-promo-actions">
              <button className="v2-btn" type="button">
                Activer la double authentification
              </button>
              <button className="v2-btn-quiet" type="button">Plus tard</button>
            </div>
          </div>
        </section>

        <section className="v2-folder-card">
          <header>
            <strong>Méthodes</strong>
          </header>
          {METHODS.map((method) => (
            <div className="v2-setting-row" key={method.title}>
              <span className="v2-setting-icon">
                <Icon name="key" />
              </span>
              <div>
                <b>{method.title}</b>
                <small>{method.detail}</small>
              </div>
              <span className="v2-status">{method.status}</span>
              <button className="v2-btn-mini" type="button">{method.action}</button>
            </div>
          ))}
        </section>

        <section className="v2-folder-card">
          <header className="v2-folder-head-action">
            <strong>Sessions actives</strong>
            <button className="v2-btn-quiet" data-tone="red" type="button">
              Tout déconnecter sauf ici
            </button>
          </header>
          {SESSIONS.map((session) => (
            <div className="v2-setting-row" key={session.device}>
              <div>
                <b>
                  {session.device}
                  {session.current && (
                    <span className="v2-status" data-tone="green">Cet appareil</span>
                  )}
                </b>
                <small>{session.place}</small>
              </div>
              <span className="v2-setting-when">{session.when}</span>
              {!session.current && (
                <button className="v2-btn-mini" type="button">Révoquer</button>
              )}
            </div>
          ))}
        </section>

        <p className="v2-footnote">
          Le journal de sécurité (connexions, révocations, 2FA) est distinct de
          l’activité documentaire. <a href="#">Consulter le journal de sécurité →</a>
        </p>
      </div>
    </Standalone>
  );
}

/**
 * Écran 33 — Équipe et rôles.
 * Repris de `sanza_handoff/maquettes/screens/33-equipe-roles.html`.
 */

const MEMBERS = [
  {
    initials: "AD",
    name: "Amara Diallo",
    email: "amara@nimbasolar.com",
    role: "Propriétaire",
    owner: true,
    scope: "Toutes les opérations",
    last: "maintenant",
  },
  {
    initials: "IS",
    name: "Ibrahima Sy",
    email: "ibrahima@nimbasolar.com",
    role: "Contributeur",
    owner: false,
    scope: "Série A 2026 — Finance",
    last: "il y a 3 h",
  },
  {
    initials: "FN",
    name: "Fatou Ndiaye",
    email: "fatou@nimbasolar.com",
    role: "Administrateur",
    owner: false,
    scope: "Toutes les opérations",
    last: "hier",
  },
  {
    initials: "ME",
    name: "Me Ousmane Ba",
    email: "o.ba@cabinet-ba.sn",
    role: "Conseil — Lecteur interne",
    owner: false,
    scope: "Série A 2026 — Juridique",
    last: "24-07",
  },
];

const ROLES = [
  ["Propriétaire", "Tout, y compris partage externe et clôture."],
  ["Administrateur", "Prépare, dépose, gère l’équipe — pas de partage externe."],
  ["Contributeur", "Dépose et met à jour les pièces de son périmètre."],
  ["Lecteur interne", "Consulte sans modifier — pour les conseils."],
];

export function TeamScreen() {
  return (
    <Standalone
      action={<button className="v2-btn" type="button">Inviter un collaborateur</button>}
      search="Rechercher un membre…"
      title="Équipe"
    >
      <div className="v2-wide-page">
        <p className="v2-page-intro">
          Les collaborateurs participent à la préparation selon leur rôle. Les
          invités externes (investisseurs, banques, auditeurs) ne figurent jamais
          ici — ils se gèrent dans <a href="#">Partage et accès</a>{" "}
          <a href="#">Lever</a>.
        </p>

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
              {MEMBERS.map((member) => (
                <tr key={member.email}>
                  <td>
                    <div className="v2-member">
                      <span className="v2-member-avatar">{member.initials}</span>
                      <div>
                        <b>{member.name}</b>
                        <small>{member.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="v2-status"
                      data-tone={member.owner ? "orange" : undefined}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="v2-cell-2">{member.scope}</td>
                  <td className="v2-cell-3">{member.last}</td>
                  <td>
                    <button className="v2-btn-mini" type="button">Gérer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="v2-content-card">
          <div className="v2-nav-label">Rôles internes</div>
          <div className="v2-roles-grid">
            {ROLES.map(([name, description]) => (
              <div key={name}>
                <b>{name}</b>
                <br />
                {description}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Standalone>
  );
}
