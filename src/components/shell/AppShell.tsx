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
    <div className="min-h-screen">
      <Topbar orgName={orgName} userEmail={userEmail} />
      <div className="flex">
        <Sidebar
          deals={deals}
          currentDealId={currentDealId}
          role={role}
          persona={persona}
        />
        <main className="flex-1 min-w-0 px-7 py-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
