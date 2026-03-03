"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UnitLite = { id: string; code: string };

export default function MergeUnitsForm({ units }: { units: UnitLite[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (selected.length < 2) {
      setError("至少選 2 個單位");
      return;
    }

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/units/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitIds: selected,
        code: String(form.get("code") || ""),
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "合併失敗");
      return;
    }
    setSelected([]);
    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded border bg-white p-4">
      <h3 className="font-semibold">合併單位</h3>
      <div className="grid grid-cols-3 gap-1 text-xs">
        {units.map((u) => (
          <label key={u.id} className="flex items-center gap-1 rounded border px-2 py-1">
            <input
              type="checkbox"
              checked={selected.includes(u.id)}
              onChange={() => toggle(u.id)}
            />
            {u.code}
          </label>
        ))}
      </div>
      <input name="code" placeholder="合併後代號" className="w-full rounded border px-3 py-2 text-sm" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-sm text-white">執行合併</button>
    </form>
  );
}
