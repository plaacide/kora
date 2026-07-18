import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-btn";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white border border-transparent shadow-[0_1px_2px_rgba(20,20,60,0.2)] hover:bg-primary-strong",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-card hover:bg-[oklch(0.975_0.003_260)]",
  ghost:
    "bg-transparent text-ink-secondary border border-transparent hover:bg-[oklch(0.955_0.004_260)]",
  danger:
    "bg-surface text-[oklch(0.42_0.1_40)] border border-[oklch(0.82_0.06_45)] hover:bg-[oklch(0.975_0.015_45)]",
};

const sizes: Record<Size, string> = {
  sm: "text-[11.5px] px-2.5 py-1.5",
  md: "text-[12.5px] px-3.5 py-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Affiche un spinner et désactive le bouton le temps d'une action. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "md", loading, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span
            className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin-slow"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  },
);
