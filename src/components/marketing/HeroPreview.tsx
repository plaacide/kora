"use client";

import { useState } from "react";
import { Chrome } from "./Chrome";
import { AUDIENCES, KPIS, type AudienceId } from "@/lib/site-content";

/**
 * Aperçu du hero — la bande « En bref » de l'app, avec le sélecteur
 * VC/DFI/Banque qui change les 5 indicateurs. Fidèle à `Sanza App v5`.
 */
export function HeroPreview() {
  const [aud, setAud] = useState<AudienceId>("vc");
  const kpis = KPIS[aud];

  return (
    <Chrome url="sanza.africa/app/ma-levee">
      <div className="bg-white p-4 sm:p-5">
        {/* Sélecteur d'audience */}
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

        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="text-[13.5px] font-[700] text-[#1A1B1F]">En bref</span>
          <span className="text-[11.5px] text-[#9DA0A8]">
            ce qu&apos;un financeur voit avant d&apos;ouvrir vos documents
          </span>
        </div>

        {/* 5 tuiles — lignes de grille par gap 1px (propre en 2 ou 5 colonnes). */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#ECEBE6] border border-[#ECEBE6] rounded-[8px] overflow-hidden">
          {kpis.map((k) => (
            <div key={k.label} className="p-3.5 bg-white">
              <div className="text-[10.5px] font-[600] text-[#8B8E96] mb-1.5 leading-tight">
                {k.label}
              </div>
              <div className="font-mono text-[18px] font-[600] tracking-[-0.02em] text-[#1A1B1F] leading-none">
                {k.value}
              </div>
              <div
                className="text-[10.5px] mt-1.5 leading-tight"
                style={{ color: k.good ? "#147A5C" : "#6E727A", fontWeight: k.good ? 600 : 400 }}
              >
                {k.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}
