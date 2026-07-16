import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  orgName,
  userEmail,
}: {
  children: React.ReactNode;
  orgName: string;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen">
      <Topbar orgName={orgName} userEmail={userEmail} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
