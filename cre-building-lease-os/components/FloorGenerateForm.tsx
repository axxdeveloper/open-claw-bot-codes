"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function FloorGenerateForm({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      basementFloors: Number(form.get("basementFloors") || 5),
      aboveGroundFloors: Number(form.get("aboveGroundFloors") || 20),
    };

    const res = await fetch(`/api/buildings/${buildingId}/floors/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "產生樓層失敗");
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="rounded border bg-white p-4">
      <h2 className="mb-3 font-semibold">樓層產生 Wizard</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-sm">
          地下樓層數
          <input
            name="basementFloors"
            type="number"
            defaultValue={5}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          地上樓層數
          <input
            name="aboveGroundFloors"
            type="number"
            defaultValue={20}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button className="mt-3 rounded bg-black px-3 py-2 text-white">重新產生樓層</button>
      <p className="mt-2 text-xs text-gray-500">規則：B5=-5 ... B1=-1, 1F=1</p>
    </form>
  );
}
