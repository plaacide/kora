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
