import { DEMANDES } from "@/features/v2/fixtures/programme";
import { ListeDemandes } from "@/features/v2/ui/ListeDemandes";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écran 35 — les demandes d'accès, toutes Dealrooms confondues. */
export default function DemandesPage() {
  const enAttente = DEMANDES.length;

  return (
    <Standalone search="Rechercher une demande" title="Demandes">
      <div className="v2-prog-head">
        <div>
          <h1>Demandes</h1>
          <p>{enAttente} en attente · toutes Dealrooms confondues</p>
        </div>
      </div>

      <div className="v2-prog-segments">
        <span className="v2-tag" data-active>
          En attente · {enAttente}
        </span>
        <span className="v2-tag">Traitées · 18</span>
      </div>

      <ListeDemandes />
    </Standalone>
  );
}
