import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import type { DealRef } from "@/lib/current-deal";

export function AppShell({
  children,
  orgName,
  userEmail,
  deals,
  currentDealId,
}: {
  children: React.ReactNode;
  orgName: string;
  userEmail: string;
  deals: DealRef[];
  currentDealId: string | null;
}) {
  return (
    <div className="min-h-screen">
      <Topbar orgName={orgName} userEmail={userEmail} />
      <div className="flex">
        <Sidebar deals={deals} currentDealId={currentDealId} />
        <main className="flex-1 min-w-0 px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
