import type { ReactNode } from "react";

/**
 * Cadre « chrome de navigateur » autour des aperçus produit — la seule ombre
 * douce autorisée du site (brief). L'URL affichée change selon l'onglet, ce qui
 * ancre l'aperçu dans le produit réel.
 */
export function Chrome({
  url,
  children,
  dark = false,
}: {
  url: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden border shadow-[0_18px_50px_-24px_rgba(20,22,31,0.45)]"
      style={{
        borderColor: dark ? "rgba(255,255,255,0.10)" : "#ECEBE6",
        background: dark ? "#14161F" : "#FFFFFF",
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 h-9 border-b"
        style={{
          borderColor: dark ? "rgba(255,255,255,0.08)" : "#F1F0EC",
          background: dark ? "#181A24" : "#FAFAF8",
        }}
      >
        <span className="flex gap-1.5">
          {["#E4E2DC", "#E4E2DC", "#E4E2DC"].map((c, i) => (
            <span
              key={i}
              className="w-[9px] h-[9px] rounded-full"
              style={{ background: dark ? "rgba(255,255,255,0.14)" : c }}
            />
          ))}
        </span>
        <span
          className="ml-1.5 flex-1 truncate rounded-[5px] px-2.5 py-1 font-mono text-[11px]"
          style={{
            background: dark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
            border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#ECEBE6"}`,
            color: dark ? "#9DA0A8" : "#6E727A",
          }}
        >
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}
