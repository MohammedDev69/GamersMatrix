"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint && !error ? `${inputId}-hint` : undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--gm-text-secondary)]"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "gm-input",
            error && "border-[var(--gm-danger)]",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-sm text-[var(--gm-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {hint && !error ? (
          <p id={hintId} className="text-sm text-[var(--gm-text-muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
