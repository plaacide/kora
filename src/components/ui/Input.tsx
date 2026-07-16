import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, hint, id, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11.5px] font-medium text-ink-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field",
            "border border-line placeholder:text-ink-placeholder",
            "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent",
            className,
          )}
          {...props}
        />
        {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
      </div>
    );
  },
);
