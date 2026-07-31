import { requireV2Workspace } from "@/features/v2/server/session";
import { securityJournal, securityState } from "@/features/v2/server/securite";
import { Standalone } from "@/features/v2/ui/Shell";
import { SecurityScreen } from "@/features/v2/ui/Security";

/**
 * Écran 34 — sécurité du compte.
 *
 * L'écran est dans le rail et affichait des méthodes et des sessions
 * inventées. Ce qu'il montre désormais est lu : les facteurs viennent de
 * Supabase, le journal d'`audit_log`.
 */
export default async function SecurityPage() {
  const { organization } = await requireV2Workspace();

  const [etat, journal] = await Promise.all([
    securityState(),
    securityJournal(organization.id),
  ]);

  return (
    <Standalone search={false} title="Sécurité">
      <SecurityScreen etat={etat} journal={journal} />
    </Standalone>
  );
}
