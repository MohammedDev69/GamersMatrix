"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneBorder: Record<ToastTone, string> = {
  neutral: "border-[var(--gm-border)]",
  success: "border-[var(--gm-success)]",
  warning: "border-[var(--gm-warning)]",
  danger: "border-[var(--gm-danger)]",
  info: "border-[var(--gm-info)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "neutral") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-[var(--gm-radius-btn)] border bg-[var(--gm-surface-raised)] px-3 py-2.5 text-sm text-[var(--gm-text)] shadow-lg",
              toneBorder[item.tone],
            )}
            role="status"
          >
            <p className="min-w-0 flex-1">{item.message}</p>
            <IconButton
              label="Dismiss"
              className="h-8 w-8"
              onClick={() => dismiss(item.id)}
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
