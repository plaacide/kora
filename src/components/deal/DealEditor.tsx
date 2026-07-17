"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateDeal, deleteDeal } from "@/app/actions/crud";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PlainError } from "@/components/auth/FormError";
import { STAGES } from "@/lib/stages";

const TYPES = ["VC", "PE", "M&A", "Dette DFI"];
const CURRENCIES = ["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"];

export interface DealForm {
  id: string;
  name: string;
  type: string;
  currency: string;
  amount: number | null;
  stage: string;
  readiness: number;
}

export function DealEditor({
  deal,
  canDelete,
}: {
  deal: DealForm;
  canDelete: boolean;
}) {
  const t = useTranslations("deal");
  const tc = useTranslations("common");
  const ts = useTranslations("stages");
  const router = useRouter();

  const [form, setForm] = useState(deal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Comparaison à l'état initial : le bouton ne s'active que s'il y a un delta.
  const dirty = JSON.stringify(form) !== JSON.stringify(deal);

  async function save() {
    setBusy(true);
    setError(undefined);
    const res = await updateDeal({
      dealId: form.id,
      name: form.name,
      type: form.type,
      currency: form.currency,
      amount: form.amount,
      stage: form.stage,
      readiness: form.readiness,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await deleteDeal(form.id);
    setBusy(false);
    if (!res.ok) {
      setConfirmOpen(false);
      return setError(res.error);
    }
    router.push("/pipeline");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <PlainError message={error} />

      <Input
        label={t("name")}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">
            {t("type")}
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">
            {t("stage")}
          </label>
          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {ts(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">
            {t("currency")}
          </label>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={t("amount")}
          type="number"
          min="0"
          value={form.amount ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              amount: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11.5px] font-medium text-ink-secondary">
          {t("readiness")} — {form.readiness}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={form.readiness}
          onChange={(e) =>
            setForm({ ...form, readiness: Number(e.target.value) })
          }
          className="accent-[oklch(0.55_0.17_270)]"
        />
        <span className="text-[11px] text-ink-muted">
          {t("readinessHint")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={save}
          loading={busy}
          disabled={!dirty || busy || form.name.trim().length < 2}
        >
          {busy ? t("saving") : saved ? t("saved") : tc("save")}
        </Button>
        {canDelete && (
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            className="ml-auto"
          >
            {t("delete")}
          </Button>
        )}
      </div>

      {/* Suppression = data room entière. Elle mérite une confirmation. */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("deleteTitle")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] text-ink-secondary leading-relaxed">
            {t("deleteBody", { name: deal.name })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {t("deleteConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
