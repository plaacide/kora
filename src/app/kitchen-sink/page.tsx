"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { Table, TableHead, TableRow, Mono } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[10.5px] font-[650] uppercase tracking-[0.06em] text-ink-muted">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function Demo() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  return (
    <main className="max-w-3xl mx-auto px-7 py-10 flex flex-col gap-9">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          Design system Sanza
        </h1>
        <p className="text-[12.5px] text-ink-secondary">
          Primitives dérivées des tokens du prototype — couleurs OKLCH,
          Instrument Sans, IBM Plex Mono.
        </p>
      </header>

      <Section title="Boutons">
        <Button variant="primary">Nouveau deal</Button>
        <Button variant="secondary">Inviter un investisseur</Button>
        <Button variant="ghost">Annuler</Button>
        <Button variant="danger">Prolonger les accès</Button>
        <Button variant="primary" size="sm">
          Compact
        </Button>
      </Section>

      <Section title="Chips sémantiques">
        <Chip tone="success">Signé</Chip>
        <Chip tone="amber">Filigrané</Chip>
        <Chip tone="error">3 en retard</Chip>
        <Chip tone="indigo">Comité (IC)</Chip>
        <Chip tone="neutral">Screening</Chip>
        <Chip tone="outline">Aucun</Chip>
      </Section>

      <Section title="Badge sécurité">
        <EncryptionBadge />
      </Section>

      <Section title="Champs">
        <div className="w-64">
          <Input
            label="Email de l'investisseur"
            name="email"
            type="email"
            placeholder="prenom@fonds.com"
            hint="Une invitation NDA lui sera envoyée."
          />
        </div>
      </Section>

      <Section title="Carte">
        <Card className="w-72">
          <CardHeader>Volume en cours</CardHeader>
          <CardBody>
            <div className="font-mono text-[24px] tracking-[-0.03em]">
              42,6 M$
            </div>
            <div className="mt-1 text-[12px] text-ink-secondary">
              +18 % ce trimestre
            </div>
          </CardBody>
        </Card>
      </Section>

      <Section title="Table (aperçu data room)">
        <Table className="w-full">
          <TableHead>
            <div className="grid grid-cols-[1.6fr_90px_110px] gap-2.5 px-4 py-2">
              <span>Document</span>
              <span>Version</span>
              <span>Permission</span>
            </div>
          </TableHead>
          {[
            ["Projections financières 2026-2029.xlsx", "v4", "amber", "Voir filigrané"],
            ["Rapport d'audit 2025.pdf", "v1", "success", "Télécharger"],
            ["Hypothèses de croissance.pdf", "v1", "indigo", "Voir"],
          ].map(([name, ver, tone, perm]) => (
            <TableRow key={name as string}>
              <div className="grid grid-cols-[1.6fr_90px_110px] gap-2.5 items-center px-4 py-2.5">
                <span className="text-[12.5px] font-semibold truncate">
                  {name}
                </span>
                <Mono>{ver}</Mono>
                <span>
                  <Chip tone={tone as "amber" | "success" | "indigo"}>
                    {perm}
                  </Chip>
                </span>
              </div>
            </TableRow>
          ))}
        </Table>
      </Section>

      <Section title="Overlays">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Ouvrir une modale
        </Button>
        <Button
          variant="primary"
          onClick={() => toast("Accès prolongé jusqu'à vendredi.")}
        >
          Déclencher un toast
        </Button>
      </Section>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau deal">
        <div className="flex flex-col gap-4">
          <Input label="Nom du deal" name="deal" placeholder="Kalyx Foods" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast("Deal créé.");
              }}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

export default function KitchenSinkPage() {
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}
