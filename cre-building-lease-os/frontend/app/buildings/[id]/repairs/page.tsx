"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

const STATUS_LIST = [
  "DRAFT",
  "QUOTED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "ACCEPTED",
  "REJECTED",
];

function statusTone(status: string): "neutral" | "active" | "draft" | "risk" {
  if (status === "COMPLETED" || status === "ACCEPTED") return "active";
  if (status === "REJECTED") return "risk";
  if (status === "IN_PROGRESS" || status === "APPROVED" || status === "QUOTED") return "draft";
  return "neutral";
}

export default function RepairsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rows, setRows] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (bid: string, q = "") => {
    const [r, f, a, v] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/repairs${q}`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
      apiFetch<any[]>(`/buildings/${bid}/common-areas`),
      apiFetch<any[]>(`/buildings/${bid}/vendors`),
    ]);

    if (r.ok) setRows(r.data);
    else setError(apiErrorMessage(r.error));

    if (f.ok) setFloors(f.data);
    if (a.ok) setAreas(a.data);
    if (v.ok) setVendors(v.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const filter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = new URLSearchParams();
    ["status", "scopeType", "floorId", "commonAreaId"].forEach((k) => {
      const v = String(fd.get(k) || "");
      if (v) q.set(k, v);
    });
    load(id, q.toString() ? `?${q.toString()}` : "");
  };

  const quickFilter = (status: string) => {
    if (!status) {
      load(id);
      return;
    }
    load(id, `?status=${status}`);
  };

  const createVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/buildings/${id}/vendors`, {
      method: "POST",
      body: JSON.stringify({ name: String(fd.get("name") || "").trim() }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("廠商已新增，可直接建立修繕案件。");
    (e.target as HTMLFormElement).reset();
    load(id);
  };

  const createRepair = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const scopeType = String(fd.get("scopeType") || "FLOOR");

    const r = await apiFetch(`/repairs`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        scopeType,
        floorId: scopeType === "FLOOR" ? String(fd.get("floorId") || "") || null : null,
        commonAreaId:
          scopeType === "COMMON_AREA" ? String(fd.get("commonAreaId") || "") || null : null,
        item: String(fd.get("item") || "").trim(),
        vendorId: String(fd.get("vendorId") || "") || null,
        vendorName: String(fd.get("vendorName") || "").trim(),
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        status: String(fd.get("status") || "DRAFT"),
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("修繕案件已建立。");
    (e.target as HTMLFormElement).reset();
    load(id);
  };

  const summary = useMemo(() => {
    const inProgress = rows.filter((r) => r.status === "IN_PROGRESS").length;
    const completed = rows.filter((r) => r.status === "COMPLETED" || r.status === "ACCEPTED").length;
    const floorScope = rows.filter((r) => r.scopeType === "FLOOR").length;

    return {
      total: rows.length,
      inProgress,
      completed,
      floorScope,
    };
  }, [rows]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="修繕管理"
        description="集中追蹤樓層與公共區域的修繕進度，避免工務資訊散落。"
      />

      <SummaryCards
        items={[
          { label: "案件總數", value: summary.total, hint: "目前清單" },
          { label: "進行中", value: summary.inProgress, hint: "需追蹤進度" },
          { label: "已完成", value: summary.completed, hint: "可驗收結案" },
          { label: "樓層範圍", value: summary.floorScope, hint: "其餘為公共區域" },
        ]}
      />

      <SectionBlock title="快速篩選" description="一鍵聚焦當下要處理的狀態。" className="taskCard">
        <div className="row">
          <button type="button" className="secondary" onClick={() => quickFilter("")}>全部</button>
          <button type="button" className="secondary" onClick={() => quickFilter("IN_PROGRESS")}>僅進行中</button>
          <button type="button" className="secondary" onClick={() => quickFilter("DRAFT")}>僅草稿</button>
          <button type="button" className="secondary" onClick={() => quickFilter("COMPLETED")}>僅已完成</button>
        </div>

        <form className="row" onSubmit={filter}>
          <select name="status" defaultValue="">
            <option value="">全部狀態</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="scopeType" defaultValue="">
            <option value="">全部範圍</option>
            <option value="FLOOR">樓層</option>
            <option value="COMMON_AREA">公共區域</option>
          </select>
          <select name="floorId" defaultValue="">
            <option value="">全部樓層</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <select name="commonAreaId" defaultValue="">
            <option value="">全部公共區域</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button type="submit">套用篩選</button>
        </form>
      </SectionBlock>

      <div className="split">
        <SectionBlock title="新增廠商" description="先建立廠商，再選用於修繕案件。">
          <form className="row" onSubmit={createVendor} aria-label="create-vendor-form">
            <input name="name" placeholder="廠商名稱" required />
            <button type="submit">新增廠商</button>
          </form>
        </SectionBlock>

        <SectionBlock title="新增修繕案件" description="可選樓層或公共區域，建立後即可追蹤。">
          <form className="grid" onSubmit={createRepair} aria-label="create-repair-form">
            <div className="split">
              <label>
                範圍
                <select name="scopeType" defaultValue="FLOOR">
                  <option value="FLOOR">樓層</option>
                  <option value="COMMON_AREA">公共區域</option>
                </select>
              </label>
              <label>
                樓層
                <select name="floorId" defaultValue="">
                  <option value="">未指定</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="split">
              <label>
                公共區域
                <select name="commonAreaId" defaultValue="">
                  <option value="">未指定</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>
              <label>
                狀態
                <select name="status" defaultValue="DRAFT">
                  <option value="DRAFT">DRAFT</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </label>
            </div>

            <div className="split">
              <input name="item" placeholder="修繕項目" required />
              <input name="quoteAmount" type="number" step="0.01" placeholder="預估金額" required />
            </div>

            <div className="split">
              <select name="vendorId" defaultValue="">
                <option value="">選擇既有廠商（可略）</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <input name="vendorName" placeholder="廠商名稱（必填）" required />
            </div>

            <button type="submit">建立修繕案件</button>
          </form>
        </SectionBlock>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="修繕清單" description="狀態以色塊標示，快速辨識。">
        {rows.length === 0 ? (
          <EmptyState title="目前沒有修繕案件" description="可先新增一筆草稿案件，後續再補完整資訊。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th>範圍</th>
                  <th>廠商</th>
                  <th>狀態</th>
                  <th>金額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.item}</td>
                    <td>{r.scopeType === "FLOOR" ? "樓層" : "公共區域"}</td>
                    <td>{r.vendorName}</td>
                    <td>
                      <StatusChip tone={statusTone(r.status)}>{r.status}</StatusChip>
                    </td>
                    <td>{r.quoteAmount}</td>
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
