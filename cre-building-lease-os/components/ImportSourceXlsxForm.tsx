"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  importBatchId: string;
  includedSheets: Array<{ name: string; rowCount: number }>;
};

export default function ImportSourceXlsxForm({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      filePath: String(form.get("filePath") || "").trim(),
      notes: String(form.get("notes") || "").trim() || undefined,
    };

    try {
      const res = await fetch(`/api/buildings/${buildingId}/import/source-xlsx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "匯入失敗");
        return;
      }

      setResult(json.data as ImportResult);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "匯入失敗";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded border bg-white p-4">
      <h2 className="font-semibold">多 Tab 原始資料匯入（XLSX）</h2>
      <input
        name="filePath"
        placeholder="server local path，例如 /Users/openclaw-user/.openclaw/workspace/tmp-tenant.xlsx"
        className="w-full rounded border px-3 py-2 text-sm"
        required
      />
      <input name="notes" placeholder="備註（可選）" className="w-full rounded border px-3 py-2 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="rounded border bg-gray-50 p-2 text-xs">
          批次 {result.importBatchId}，已匯入 {result.includedSheets.length} 個 tabs。
        </div>
      )}
      <button disabled={loading} className="rounded border px-3 py-2 text-sm disabled:opacity-60">
        {loading ? "匯入中..." : "開始匯入"}
      </button>
    </form>
  );
}
