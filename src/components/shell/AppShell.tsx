import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { RoomTabs, type RoomCounts } from "./RoomTabs";
import { PageTransition } from "./PageTransition";
import type { DealRef } from "@/lib/current-deal";
import type { Persona } from "@/lib/persona";

export function AppShell({
  children,
  orgName,
  userEmail,
  deals,
  currentDealId,
  role,
  persona,
  roomCounts,
}: {
  children: React.ReactNode;
  orgName: string;
  userEmail: string;
  deals: DealRef[];
  currentDealId: string | null;
  role: string | null;
  persona?: Persona;
  roomCounts?: RoomCounts;
}) {
  const currentDealName =
    deals.find((d) => d.id === currentDealId)?.name ?? deals[0]?.name ?? orgName;

  return (
    <div className="min-h-screen bg-white">
      <Topbar orgName={orgName} userEmail={userEmail} persona={persona} dealId={currentDealId ?? deals[0]?.id ?? ""} />
      <div className="flex">
        <Sidebar
          deals={deals}
          currentDealId={currentDealId}
          role={role}
          persona={persona}
        />
        {/* Fond BLANC (handoff) : la zone de contenu est blanche, la sidebar
            crème. Pas de fond papier. */}
        <main className="flex-1 min-w-0 bg-white px-8 py-7 max-w-[1720px]">
          {/* La data room à 6 onglets : l'en-tête + les onglets s'affichent sur
              les routes de la salle (RoomTabs se masque ailleurs), pour l'équipe
              interne seulement — l'invité garde sa nav. */}
          {(persona === "founder" || persona === "fund") && (
            <RoomTabs dealName={currentDealName} dealId={currentDealId ?? deals[0]?.id ?? ""} counts={roomCounts} />
          )}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
