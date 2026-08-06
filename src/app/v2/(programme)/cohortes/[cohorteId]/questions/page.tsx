import { MESSAGES } from "@/features/v2/fixtures/programme";

/**
 * Écran 08 — questions & suggestions.
 *
 * Ce n'est pas un chat, et l'écran le dit deux fois : « une question attend
 * une réponse, une suggestion n'en attend pas » en tête, « l'entreprise répond
 * quand elle le souhaite, pas de relance automatique » en pied. Ni saisie en
 * cours, ni présence, ni accusé de lecture.
 */
export default function QuestionsPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Questions &amp; suggestions</h1>
          <p>Une question attend une réponse. Une suggestion n’en attend pas.</p>
        </div>
      </div>

      <div className="v2-fil">
        <div className="v2-card v2-fil-liste">
          {MESSAGES.map((message) => (
            <article className="v2-fil-item" key={message.corps}>
              <header>
                <span className="v2-pastille" data-ton={message.ton}>
                  {message.initiales}
                </span>
                <b>{message.nom}</b>
                <span className="v2-spacer" />
                <span className="v2-badge" data-tone={message.statutTon}>
                  <span className="v2-dot" />
                  {message.statut}
                </span>
                <small>{message.quand}</small>
              </header>
              <p>{message.corps}</p>
              {message.reponse && (
                <div className="v2-fil-reponse">
                  <b>Réponse de {message.nom}.</b> {message.reponse}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="v2-card v2-fil-envoi">
          <b>Nouveau message</b>
          <div className="v2-bascule">
            <span data-active>Question</span>
            <span>Suggestion</span>
          </div>
          <div className="v2-field">
            <span>Entreprise</span>
            {/* PAS de chevron ici : `.v2-control select` porte déjà le sien en
                image de fond. La maquette place l'icône à côté du champ parce
                que le sien n'en a pas — reprendre les deux en donnait deux,
                exactement le défaut corrigé dans les maquettes elles-mêmes. */}
            <div className="v2-control" style={{ height: 44 }}>
              <select defaultValue="CoolBricks">
                <option>CoolBricks</option>
              </select>
            </div>
          </div>
          <div className="v2-field">
            <span>Message</span>
            <div
              className="v2-control"
              style={{ alignItems: "flex-start", height: 96, paddingTop: 12 }}
            >
              <span style={{ color: "var(--text-4)" }}>
                Formulez une question précise…
              </span>
            </div>
          </div>
          <span className="v2-btn" data-bloc="true">
            Envoyer
          </span>
          <p>
            L’entreprise répond quand elle le souhaite. Pas de relance
            automatique.
          </p>
        </div>
      </div>
    </>
  );
}
