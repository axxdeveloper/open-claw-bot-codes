"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, SectionBlock } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function displayAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function CommonAreaDetailPage() {
  const params = useParams<{ id: string; commonAreaId: string }>();
  const buildingId = params.id;
  const commonAreaId = params.commonAreaId;

  const [data, setData] = useState<any>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commonAreaId || !buildingId) return;

    Promise.all([
      apiFetch(`/common-areas/${commonAreaId}`),
      apiFetch<any[]>(`/buildings/${buildingId}/repairs?commonAreaId=${commonAreaId}`),
    ]).then(([areaRes, repairRes]) => {
      if (areaRes.ok) setData(areaRes.data);
      else setError(apiErrorMessage(areaRes.error));

      if (repairRes.ok) setRepairs(repairRes.data);
      else setError(apiErrorMessage(repairRes.error));
    });
  }, [buildingId, commonAreaId]);

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

      <SectionBlock title="公共區域修繕" description="在此快速檢視此區域案件，核對廠商資訊與結案金額。">
        {repairs.length === 0 ? (
          <div className="muted">目前尚無此公共區域修繕紀錄。</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th>廠商</th>
                  <th>廠商統編</th>
                  <th>預估金額</th>
                  <th>結案金額</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.item}</td>
                    <td>{r.vendorName}</td>
                    <td>{r.vendorTaxId || "-"}</td>
                    <td>{displayAmount(r.quoteAmount)}</td>
                    <td>{displayAmount(r.finalAmount)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </main>
  );
}
