import { badge, initiales, quand } from "@/features/v2/domain/questions";
import { destinataires, lireFil } from "@/features/v2/server/questions";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";

import { envoyerMessage } from "./actions";

const MESSAGES_ERREUR: Readonly<Record<string, string>> = {
  corps: "Écrivez votre message avant de l’envoyer.",
  entreprise: "Choisissez l’entreprise à qui vous écrivez.",
  envoi: "Le message n’est pas parti. Réessayez.",
};

/** Une couleur stable par entreprise, tirée du nom et non du rang. */
const TONS = ["orange", "blue", "green", "amber", "neutral"] as const;
function ton(nom: string): (typeof TONS)[number] {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return TONS[somme % TONS.length]!;
}

/**
 * Écran 08 — questions & suggestions.
 *
 * Ce n'est pas un chat, et l'écran le dit deux fois : « une question attend
 * une réponse, une suggestion n'en attend pas » en tête, « l'entreprise répond
 * quand elle le souhaite, pas de relance automatique » en pied. Ni saisie en
 * cours, ni présence, ni accusé de lecture.
 */
export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohorteId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ cohorteId }, { erreur }] = await Promise.all([params, searchParams]);
  const [fils, entreprises] = await Promise.all([
    lireFil(cohorteId),
    destinataires(cohorteId),
  ]);

  // UNE seule lecture de l'heure pour toute la page : deux appels séparés
  // pourraient tomber de part et d'autre d'une minute et dater deux messages
  // simultanés différemment.
  const maintenant = new Date();

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Questions &amp; suggestions</h1>
          <p>Une question attend une réponse. Une suggestion n’en attend pas.</p>
        </div>
      </div>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {MESSAGES_ERREUR[erreur] ?? "L’envoi n’a pas abouti. Réessayez."}
        </p>
      )}

      <div className="v2-fil">
        <div className="v2-card v2-fil-liste">
          {fils.length === 0 ? (
            <article className="v2-fil-item">
              <p>
                Aucun message pour l’instant. Posez une question à une entreprise
                de la cohorte, ou laissez-lui une suggestion.
              </p>
            </article>
          ) : (
            fils.map((message) => {
              const etat = badge(message);
              return (
                <article className="v2-fil-item" key={message.id}>
                  <header>
                    <span className="v2-pastille" data-ton={ton(message.nom)}>
                      {initiales(message.nom)}
                    </span>
                    <b>{message.nom}</b>
                    <span className="v2-spacer" />
                    <span className="v2-badge" data-tone={etat.ton}>
                      <span className="v2-dot" />
                      {etat.texte}
                    </span>
                    <small>{quand(message, maintenant)}</small>
                  </header>
                  <p>{message.corps}</p>
                  {message.reponse && (
                    <div className="v2-fil-reponse">
                      <b>Réponse de {message.nom}.</b> {message.reponse}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <form action={envoyerMessage} className="v2-card v2-fil-envoi">
          <input name="cohorte" type="hidden" value={cohorteId} />
          <b>Nouveau message</b>

          {/* DEUX BOUTONS RADIO, ET NON DEUX `span`. La bascule d'origine était
              décorative : le type ne partait pas avec le formulaire, et tout
              serait parti en « question » — y compris les suggestions, qui
              auraient alors attendu une réponse. */}
          <div className="v2-bascule">
            <label>
              <input defaultChecked name="type" type="radio" value="question" />
              <span>Question</span>
            </label>
            <label>
              <input name="type" type="radio" value="suggestion" />
              <span>Suggestion</span>
            </label>
          </div>

          <div className="v2-field">
            <span>Entreprise</span>
            {/* PAS de chevron ici : `.v2-control select` porte déjà le sien en
                image de fond. La maquette place l'icône à côté du champ parce
                que le sien n'en a pas — reprendre les deux en donnait deux,
                exactement le défaut corrigé dans les maquettes elles-mêmes. */}
            <div className="v2-control" style={{ height: 44 }}>
              <select
                disabled={entreprises.length === 0}
                name="entreprise"
                required
              >
                {entreprises.map((e) => (
                  <option key={e.org} value={e.org}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="v2-field">
            <span>Message</span>
            <div
              className="v2-control"
              style={{ height: 96, padding: "12px 14px" }}
            >
              <textarea
                name="corps"
                placeholder="Formulez une question précise…"
                required
                rows={3}
              />
            </div>
          </div>

          {entreprises.length === 0 ? (
            <p>
              Aucune entreprise n’a encore rejoint cette cohorte. Invitez-en une
              pour pouvoir lui écrire.
            </p>
          ) : (
            <BoutonEnvoi className="v2-btn" enCours="Envoi…">
              Envoyer
            </BoutonEnvoi>
          )}

          <p>
            L’entreprise répond quand elle le souhaite. Pas de relance
            automatique.
          </p>
        </form>
      </div>
    </>
  );
}
