"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PatchLeaseForm({
  leaseId,
  currentStatus,
}: {
  leaseId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      status: String(form.get("status") || currentStatus),
    };

    const res = await fetch(`/api/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "更新失敗");
      return;
    }

    router.refresh();
  };

  return (
    <form className="flex items-end gap-2" onSubmit={onSubmit}>
      <label className="text-sm">
        狀態
        <select
          name="status"
          defaultValue={currentStatus}
          className="ml-2 rounded border px-2 py-1"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
      </label>
      <button className="rounded border px-3 py-1 text-sm">更新</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
