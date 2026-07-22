"use client";

import { useState } from "react";
import { Chrome } from "./Chrome";
import { AUDIENCES, CHECKLISTS, type AudienceId } from "@/lib/site-content";

type TabId = "dataroom" | "diligence" | "nda" | "signal";

const TABS: { id: TabId; label: string; url: string }[] = [
  { id: "dataroom", label: "Data room & droits", url: "sanza.africa/app/data-room" },
  { id: "diligence", label: "Diligence adaptée", url: "sanza.africa/app/diligence" },
  { id: "nda", label: "NDA & signatures", url: "sanza.africa/app/nda" },
  { id: "signal", label: "Signal de lecture", url: "sanza.africa/app/signal" },
];

const DOSSIERS = [
  { ref: "1.", nom: "Juridique & corporate", droit: "Restreint", visible: false },
  { ref: "2.", nom: "Financier", droit: "DFI + VC", visible: true },
  { ref: "2.1", nom: "États SYSCOHADA", droit: "DFI + VC", visible: true },
  { ref: "3.", nom: "Commercial", droit: "VC", visible: true },
  { ref: "4.", nom: "Impact & E&S", droit: "DFI", visible: true },
];

const SIGNATAIRES = [
  { nom: "Amani Capital", role: "VC · lead", quand: "signé le 12/07" },
  { nom: "Proparco", role: "DFI · co-investisseur", quand: "signé le 14/07" },
  { nom: "Orange Ventures", role: "VC", quand: "en attente" },
];

const LECTURES = [4, 7, 3, 9, 6, 11, 5];

export function ProductTabs() {
  const [tab, setTab] = useState<TabId>("dataroom");
  const [aud, setAud] = useState<AudienceId>("dfi");
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      {/* Onglets */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="rounded-[7px] px-3.5 py-2 text-[13px] font-[600] transition-colors border"
              style={{
                borderColor: on ? "#E85C2B" : "#E4E2DC",
                background: on ? "#E85C2B" : "#FFFFFF",
                color: on ? "#FFFFFF" : "#4A4E63",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <Chrome url={current.url}>
        <div className="bg-white p-4 sm:p-6 min-h-[300px]">
          {tab === "dataroom" && <DataRoomPane />}
          {tab === "diligence" && (
            <DiligencePane aud={aud} setAud={setAud} />
          )}
          {tab === "nda" && <NdaPane />}
          {tab === "signal" && <SignalPane />}
        </div>
      </Chrome>
    </div>
  );
}

function DataRoomPane() {
  return (
    <div>
      <PaneTitle>Arborescence indexée · droits par dossier</PaneTitle>
      <div className="border border-[#ECEBE6] rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 px-4 py-2 bg-[#FAFAF8] border-b border-[#F1F0EC] text-[11px] font-[600] text-[#8B8E96] uppercase tracking-[0.04em]">
          <span>Index</span>
          <span>Dossier</span>
          <span>Droits</span>
          <span>Visible</span>
        </div>
        {DOSSIERS.map((d) => (
          <div
            key={d.ref + d.nom}
            className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center px-4 py-2.5 border-b border-[#F1F0EC] last:border-0"
          >
            <span className="font-mono text-[12px] text-[#9DA0A8] w-8">{d.ref}</span>
            <span className="text-[13px] text-[#1A1B1F]">{d.nom}</span>
            <span className="font-mono text-[11.5px] text-[#6E727A]">{d.droit}</span>
            <Toggle on={d.visible} />
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#6E727A] mt-3">
        Les droits s&apos;appliquent par dossier : vous ouvrez « Financier » à un
        DFI sans exposer « Juridique ». Tout est journalisé.
      </p>
    </div>
  );
}

function DiligencePane({
  aud,
  setAud,
}: {
  aud: AudienceId;
  setAud: (a: AudienceId) => void;
}) {
  const items = CHECKLISTS[aud];
  const done = items.filter((i) => i.done).length;
  return (
    <div>
      <PaneTitle>La checklist s&apos;adapte au financeur visé</PaneTitle>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {AUDIENCES.map((a) => {
          const on = a.id === aud;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAud(a.id)}
              className="rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] transition-colors border"
              style={{
                borderColor: on ? "#E85C2B" : "#E4E2DC",
                background: on ? "#FBEDE6" : "#FFFFFF",
                color: on ? "#C24619" : "#4A4E63",
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[12.5px] text-[#6E727A]">
          Pièces exigées par ce financeur
        </span>
        <span className="font-mono text-[12px] text-[#C24619]">
          {Math.round((done / items.length) * 100)} % · {done}/{items.length}
        </span>
      </div>

      <div className="border border-[#ECEBE6] rounded-[8px] overflow-hidden">
        {items.map((it) => (
          <div
            key={it.ref + it.label}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F1F0EC] last:border-0"
          >
            <StatusDot done={it.done} />
            <span className="font-mono text-[11px] text-[#9DA0A8] w-8">{it.ref}</span>
            <span className="flex-1 text-[13px] text-[#1A1B1F]">{it.label}</span>
            <span
              className="text-[11px] font-[600] rounded-[4px] px-2 py-0.5"
              style={{
                background: it.done ? "#E4F3EC" : "#FEF8F4",
                color: it.done ? "#147A5C" : "#C24619",
              }}
            >
              {it.done ? "Fait" : "À fournir"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NdaPane() {
  return (
    <div>
      <PaneTitle>NDA e-signé avant tout accès · preuve horodatée</PaneTitle>
      <div className="border border-[#ECEBE6] rounded-[8px] overflow-hidden">
        {SIGNATAIRES.map((s) => {
          const signed = s.quand.startsWith("signé");
          return (
            <div
              key={s.nom}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F0EC] last:border-0"
            >
              <StatusDot done={signed} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-[600] text-[#1A1B1F]">{s.nom}</span>
                <span className="block text-[11.5px] text-[#9DA0A8]">{s.role}</span>
              </span>
              <span className="font-mono text-[11.5px] text-[#6E727A]">{s.quand}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-[#6E727A]">
        <span className="text-[#147A5C]">●</span>
        empreinte SHA-256 · a3f1…9c2e · preuve PDF générée
      </div>
    </div>
  );
}

function SignalPane() {
  const max = Math.max(...LECTURES);
  return (
    <div>
      <PaneTitle>Qui a lu quoi · 7 derniers jours</PaneTitle>
      <div className="flex items-end gap-2 h-[120px] mb-4 px-1">
        {LECTURES.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t-[3px] bg-[#E85C2B]"
              style={{ height: `${(v / max) * 100}%`, opacity: 0.35 + (v / max) * 0.65 }}
            />
            <span className="font-mono text-[10px] text-[#9DA0A8]">J{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="rounded-[8px] bg-[#FEF8F4] border border-[#F6E0D3] px-4 py-3">
        <div className="text-[12px] font-[650] text-[#C24619] mb-0.5">Signal</div>
        <p className="text-[12.5px] text-[#6E727A] leading-[1.5]">
          Proparco a consulté « États SYSCOHADA » 3 fois cette semaine — un
          intérêt qui mérite une relance.
        </p>
      </div>
    </div>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-[650] text-[#1A1B1F] mb-4">{children}</div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full w-[34px] h-[19px] px-[2px] transition-colors"
      style={{ background: on ? "#E85C2B" : "#D8D6CE", justifyContent: on ? "flex-end" : "flex-start" }}
      aria-hidden
    >
      <span className="w-[15px] h-[15px] rounded-full bg-white" />
    </span>
  );
}

function StatusDot({ done }: { done: boolean }) {
  return (
    <span
      className="w-[16px] h-[16px] rounded-full grid place-items-center flex-none"
      style={{ background: done ? "#E4F3EC" : "#F1F0EC" }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full"
        style={{ background: done ? "#147A5C" : "#C9C6BD" }}
      />
    </span>
  );
}
