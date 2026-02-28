"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function CommonAreaDetailPage() {
  const params = useParams<{ commonAreaId: string }>();
  const commonAreaId = params.commonAreaId;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!commonAreaId) return;
    apiFetch(`/common-areas/${commonAreaId}`).then((r) => r.ok && setData(r.data));
  }, [commonAreaId]);

  if (!data) return null;

  return (
    <main className="grid">
      <h1>{data.name}</h1>
      <div className="card">
        <div>Code: {data.code || "-"}</div>
        <div>Description: {data.description || "-"}</div>
      </div>
    </main>
  );
}
