"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplitUnitForm({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parts = String(form.get("parts") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [code, gross, net, balcony] = line.split(",").map((x) => x.trim());
        return {
          code,
          grossArea: Number(gross),
          netArea: net ? Number(net) : null,
          balconyArea: balcony ? Number(balcony) : null,
        };
      });

    const res = await fetch(`/api/units/${unitId}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts }),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "分割失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded border bg-white p-3">
      <div className="text-xs font-semibold">切割</div>
      <textarea
        name="parts"
        rows={3}
        placeholder="每行: code,gross,net,balcony\nA1-1,50,40,5\nA1-2,50,40,5"
        className="w-full rounded border px-2 py-1 text-xs"
        required
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button className="rounded border px-2 py-1 text-xs">執行切割</button>
    </form>
  );
}
