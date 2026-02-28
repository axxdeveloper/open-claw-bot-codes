"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function NewBuildingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      name: String(fd.get("name") || "").trim(),
      code: String(fd.get("code") || "") || null,
      address: String(fd.get("address") || "") || null,
      managementFee: fd.get("managementFee") ? Number(fd.get("managementFee")) : null,
    };

    if (!payload.name) {
      setError("請輸入大樓名稱");
      setLoading(false);
      return;
    }

    const r = await apiFetch<any>("/buildings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      setLoading(false);
      return;
    }

    const floorGen = await apiFetch(`/buildings/${r.data.id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({ basementFloors: 5, aboveGroundFloors: 20 }),
    });

    if (!floorGen.ok) {
      setError(`大樓建立成功，但產生樓層失敗：${apiErrorMessage(floorGen.error)}`);
      setLoading(false);
      return;
    }

    router.push(`/buildings/${r.data.id}/floors`);
  };

  return (
    <main className="page">
      <section className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 10 }}>建立新大樓</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          建立後會自動產生預設樓層（B5~20F），可於下一頁再調整。
        </p>

        <form onSubmit={onSubmit} className="grid" aria-label="create-building-form">
          <label>
            大樓名稱
            <input name="name" placeholder="例如：宏盛國際金融中心" required />
          </label>
          <label>
            代碼
            <input name="code" placeholder="例如：HSIFC" />
          </label>
          <label>
            地址
            <input name="address" placeholder="例如：台北市信義區..." />
          </label>
          <label>
            預設管理費
            <input name="managementFee" type="number" step="0.01" placeholder="每坪管理費" />
          </label>

          {error && <div className="errorBox">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "建立中..." : "Create"}
          </button>
        </form>
      </section>
    </main>
  );
}
