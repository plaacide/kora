import * as React from "react";
import { cn } from "@/lib/cn";

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-card shadow-card overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted",
        "bg-bg border-b border-separator-soft",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-separator last:border-b-0 hover:bg-[oklch(0.985_0.002_260)]",
        className,
      )}
      {...props}
    />
  );
}

/** Monospace cell for amounts, refs, hashes, timestamps. */
export function Mono({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-[11.5px] text-ink-secondary", className)}
      {...props}
    />
  );
}
