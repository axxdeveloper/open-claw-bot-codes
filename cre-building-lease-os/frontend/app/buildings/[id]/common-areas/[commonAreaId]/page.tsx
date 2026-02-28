"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, SectionBlock } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function CommonAreaDetailPage() {
  const params = useParams<{ id: string; commonAreaId: string }>();
  const buildingId = params.id;
  const commonAreaId = params.commonAreaId;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commonAreaId) return;
    apiFetch(`/common-areas/${commonAreaId}`).then((r) => {
      if (r.ok) setData(r.data);
      else setError(apiErrorMessage(r.error));
    });
  }, [commonAreaId]);

  if (!data) return <main className="page">{error ? <div className="errorBox">{error}</div> : null}</main>;

  return (
    <main className="page">
      <PageHeader
        title={`公共區域｜${data.name}`}
        description="可在此確認區域基本資料，並回修繕頁建立相關案件。"
        action={
          <div className="row">
            <Link href={`/buildings/${buildingId}/common-areas`} className="btn secondary">回公共區域清單</Link>
            <Link href={`/buildings/${buildingId}/repairs`} className="btn">前往修繕管理</Link>
          </div>
        }
      />

      <SectionBlock title="區域資訊" description="建議保持名稱與代碼一致，方便跨部門溝通。">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>區域代碼</span>
          <b>{data.code || "未設定"}</b>
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>說明</span>
          <b>{data.description || "尚未填寫"}</b>
        </div>
      </SectionBlock>
    </main>
  );
}
