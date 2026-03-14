"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateBuildingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    const payload = {
      name: String(form.get("name") || ""),
      code: String(form.get("code") || "") || undefined,
      address: String(form.get("address") || "") || undefined,
      managementFee: form.get("managementFee")
        ? Number(form.get("managementFee"))
        : undefined,
    };

    const res = await fetch("/api/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "建立失敗");
      return;
    }

    router.push(`/buildings/${json.data.id}/floors?wizard=1`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border bg-white p-4">
      <h2 className="font-semibold">建立大樓</h2>
      <input name="name" className="w-full rounded border px-3 py-2" placeholder="大樓名稱" required />
      <input name="code" className="w-full rounded border px-3 py-2" placeholder="代碼 (選填)" />
      <input name="address" className="w-full rounded border px-3 py-2" placeholder="地址 (選填)" />
      <input
        name="managementFee"
        type="number"
        step="0.01"
        className="w-full rounded border px-3 py-2"
        placeholder="管理費 (選填)"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-white">建立並進入樓層 wizard</button>
    </form>
  );
}
