import * as React from "react";
import { cn } from "@/lib/cn";

export type ChipTone =
  | "success"
  | "amber"
  | "error"
  | "indigo"
  | "neutral"
  | "outline";

const tones: Record<ChipTone, string> = {
  success: "bg-chip-success-bg text-chip-success-fg",
  amber: "bg-chip-amber-bg text-chip-amber-fg",
  error: "bg-chip-error-bg text-chip-error-fg",
  indigo: "bg-chip-indigo-bg text-chip-indigo-fg",
  neutral: "bg-chip-neutral-bg text-chip-neutral-fg",
  outline: "bg-surface text-ink-secondary border border-line",
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
}

export function Chip({
  className,
  tone = "neutral",
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-block text-[10.5px] font-semibold rounded-chip px-2 py-[3px] whitespace-nowrap leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
