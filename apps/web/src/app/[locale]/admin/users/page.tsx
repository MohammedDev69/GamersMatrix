"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await api.get<AdminUser[]>("/admin/users");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function setRole(id: string, role: "ADMIN" | "EDITOR") {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--gm-muted)]">
        إدارة أدوار المشرفين فقط. صلاحيات الـ API تُفرض على الخادم.
      </p>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3"
          >
            <div>
              <p className="font-medium text-white">{u.name}</p>
              <p className="text-xs text-[var(--gm-muted)]" dir="ltr">
                {u.email}
              </p>
            </div>
            <select
              className="gm-input w-auto"
              value={u.role}
              onChange={(e) =>
                setRole(u.id, e.target.value as "ADMIN" | "EDITOR")
              }
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
