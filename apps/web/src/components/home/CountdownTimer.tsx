"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  endsAt?: Date | string;
  className?: string;
};

function getParts(target: number) {
  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[40px] flex-col items-center">
      <span className="text-sm font-bold tabular-nums text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-[var(--gm-muted)]">{label}</span>
    </div>
  );
}

export function CountdownTimer({ endsAt, className = "" }: CountdownTimerProps) {
  const [target] = useState(() => {
    if (endsAt) return new Date(endsAt).getTime();
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  });
  const [parts, setParts] = useState(() => getParts(target));

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Unit value={parts.days} label="يوم" />
      <span className="text-[var(--gm-muted)]">:</span>
      <Unit value={parts.hours} label="ساعة" />
      <span className="text-[var(--gm-muted)]">:</span>
      <Unit value={parts.minutes} label="دقيقة" />
      <span className="text-[var(--gm-muted)]">:</span>
      <Unit value={parts.seconds} label="ثانية" />
    </div>
  );
}
