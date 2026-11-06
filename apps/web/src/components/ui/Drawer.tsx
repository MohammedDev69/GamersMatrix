"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { trapTabKey } from "@/lib/focus-trap";
import { IconButton } from "./IconButton";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "start" | "end";
  closeLabel?: string;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "end",
  closeLabel = "Close",
  className,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      trapTabKey(e, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-[min(100%,320px)] flex-col border-[var(--gm-border)] bg-[var(--gm-bg-raised)] p-4 shadow-xl outline-none",
          side === "end"
            ? "end-0 border-s"
            : "start-0 border-e",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id={titleId} className="font-bold text-[var(--gm-text)]">
            {title}
          </h2>
          <IconButton label={closeLabel} onClick={onClose} className="h-9 w-9">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
