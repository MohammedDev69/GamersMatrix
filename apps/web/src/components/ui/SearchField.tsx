"use client";

import { FormEvent, InputHTMLAttributes, useId } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  clearLabel?: string;
  loading?: boolean;
  onClear?: () => void;
  onSubmitSearch?: (value: string) => void;
};

export function SearchField({
  label,
  clearLabel = "Clear",
  loading = false,
  onClear,
  onSubmitSearch,
  className,
  value,
  id,
  ...props
}: SearchFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const showClear = Boolean(value) && Boolean(onClear);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeof value === "string" && onSubmitSearch) {
      onSubmitSearch(value.trim());
    }
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]"
        aria-hidden
      />
      <input
        id={inputId}
        type="search"
        value={value}
        className={cn(
          "gm-input gm-search pe-10 ps-10",
          showClear || loading ? "pe-20" : "pe-10",
        )}
        {...props}
      />
      <div className="absolute top-1/2 end-1 flex -translate-y-1/2 items-center gap-0.5">
        {loading ? (
          <Loader2
            className="me-2 h-4 w-4 animate-spin text-[var(--gm-text-muted)]"
            aria-hidden
          />
        ) : null}
        {showClear ? (
          <IconButton
            label={clearLabel}
            className="h-9 w-9"
            onClick={onClear}
            type="button"
          >
            <X className="h-4 w-4" />
          </IconButton>
        ) : null}
      </div>
    </form>
  );
}
