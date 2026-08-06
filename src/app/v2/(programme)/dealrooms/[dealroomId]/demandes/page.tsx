import { ListeDemandes } from "@/features/v2/ui/ListeDemandes";

/** Écran 40 — les demandes d'une Dealroom. Même liste, même grille que le 35. */
export default function DealroomDemandesPage() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Demandes</h1>
          <p>6 en attente · la décision d’ouvrir reste à chaque entreprise</p>
        </div>
      </div>
      <ListeDemandes />
    </>
  );
}
