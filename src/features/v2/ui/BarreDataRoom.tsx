"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { messageDErreur, type Resultat } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";

/**
 * Les actions de la data room, au-dessus du contenu.
 *
 * TROIS, ET PAS QUATRE. La référence en montre une quatrième — « Request
 * files », demander des pièces à quelqu'un. Le fondateur l'a écartée, et c'est
 * la bonne décision pour aujourd'hui : réclamer un document est une
 * fonctionnalité entière — à qui, avec quelle relance, quel suivi de ce qui
 * manque — pas un bouton. La poser à moitié aurait produit un envoi sans
 * retour, c'est-à-dire un e-mail que personne ne suit.
 *
 * « Créer un dossier » ouvre une fenêtre, contrairement au renommage qui se
 * fait sur place : il n'y a rien à modifier ici, tout est à saisir. Une
 * fenêtre pour changer un mot est de trop ; pour en écrire un qui n'existe
 * pas, elle est à sa place.
 */
export function BarreDataRoom({
  hrefAjouter,
  hrefPartager,
  onCreerDossier,
}: {
  hrefAjouter: string;
  hrefPartager: string;
  onCreerDossier: (nom: string) => Promise<Resultat>;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer() {
    setEnvoi(true);
    setErreur(null);
    const resultat = await onCreerDossier(nom);
    setEnvoi(false);

    if (!resultat.ok) {
      setErreur(messageDErreur(resultat.code));
      return;
    }

    setNom("");
    setOuvert(false);
    router.refresh();
  }

  return (
    <>
      <div className="v2-dataroom-actions">
        <Link className="v2-btn" href={hrefAjouter}>
          <Icon name="upload" />
          Ajouter du contenu
        </Link>
        <Link className="v2-btn v2-btn-grey" href={hrefPartager}>
          <Icon name="users" />
          Partager
        </Link>
        <button
          className="v2-btn v2-btn-grey"
          onClick={() => {
            setNom("");
            setErreur(null);
            setOuvert(true);
          }}
          type="button"
        >
          <Icon name="folder-plus" />
          Créer un dossier
        </button>
      </div>

      {ouvert && (
        <>
          <button
            aria-label="Fermer"
            className="v2-scrim"
            onClick={() => setOuvert(false)}
            type="button"
          />
          <div aria-modal="true" className="v2-dialog" role="dialog">
            <h2>Nouveau dossier</h2>
            <p>
              Les accès se donnent par dossier : ce que vous rangez ici pourra
              être partagé d’un seul geste.
            </p>
            <label className="v2-field" data-wide="true">
              <span>Nom du dossier</span>
              <span className="v2-control">
                <input
                  autoFocus
                  onChange={(event) => setNom(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && nom.trim()) {
                      event.preventDefault();
                      void creer();
                    }
                  }}
                  placeholder="Juridique, Finances, Équipe…"
                  value={nom}
                />
              </span>
            </label>

            {erreur && (
              <p className="v2-auth-error" role="alert">
                {erreur}
              </p>
            )}

            <footer>
              <button
                className="v2-btn"
                disabled={envoi || !nom.trim()}
                onClick={creer}
                type="button"
              >
                {envoi ? "Création…" : "Créer"}
              </button>
              <button
                className="v2-btn v2-btn-grey"
                disabled={envoi}
                onClick={() => setOuvert(false)}
                type="button"
              >
                Annuler
              </button>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
