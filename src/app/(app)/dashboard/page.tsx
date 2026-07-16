import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

const kpis = [
  { label: "Volume en cours", value: "42,6 M$", delta: "+18 %" },
  { label: "Deals actifs", value: "8", delta: "+2" },
  { label: "Readiness moyen", value: "71 %", delta: "+6 pts" },
  { label: "Q&A ouvertes", value: "12", delta: "3 en retard" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            Bonjour, Aminata
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            Mercredi 16 juillet · 8 deals actifs · 3 actions requises
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Inviter un investisseur</Button>
          <Button variant="primary">Nouveau deal</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-[550] text-ink-secondary">
                  {k.label}
                </span>
                <Chip tone="success">{k.delta}</Chip>
              </div>
              <div className="mt-2 font-mono text-[24px] tracking-[-0.03em]">
                {k.value}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>Socle E0 — squelette applicatif</CardHeader>
        <CardBody>
          <p className="text-[12.5px] text-ink-secondary leading-relaxed">
            Shell, design system et tokens en place. Les écrans métier
            (data room, permissions, audit…) seront branchés aux phases
            suivantes, une fois l&apos;authentification et la base de données
            connectées.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
