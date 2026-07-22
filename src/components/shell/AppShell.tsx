import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
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
}: {
  children: React.ReactNode;
  orgName: string;
  userEmail: string;
  deals: DealRef[];
  currentDealId: string | null;
  role: string | null;
  persona?: Persona;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Topbar orgName={orgName} userEmail={userEmail} persona={persona} />
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
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
