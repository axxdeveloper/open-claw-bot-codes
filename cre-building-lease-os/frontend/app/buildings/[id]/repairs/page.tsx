"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { API_BASE, apiErrorMessage, apiFetch } from "@/lib/api";

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

function pickDate(row: any) {
  const source = row.reportedAt || row.createdAt || row.updatedAt;
  if (!source) return null;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function RepairsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rows, setRows] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [attachmentsByRepair, setAttachmentsByRepair] = useState<Record<string, any[]>>({});

  const [createStatus, setCreateStatus] = useState("DRAFT");
  const [acceptanceResult, setAcceptanceResult] = useState("");
  const [inspectorName, setInspectorName] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    scopeType: "",
    floorId: "",
    commonAreaId: "",
    vendorId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [acceptanceDraft, setAcceptanceDraft] = useState<Record<string, { acceptanceResult: string; inspectorName: string }>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (bid: string) => {
    const [r, f, a, v] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/repairs`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
      apiFetch<any[]>(`/buildings/${bid}/common-areas`),
      apiFetch<any[]>(`/buildings/${bid}/vendors`),
    ]);

    if (r.ok) {
      setRows(r.data);
      const attachmentEntries = await Promise.all(
        r.data.map(async (repair) => {
          const fileRes = await apiFetch<any[]>(`/repairs/${repair.id}/attachments`);
          return [repair.id, fileRes.ok ? fileRes.data : []] as const;
        }),
      );
      setAttachmentsByRepair(Object.fromEntries(attachmentEntries));
    } else {
      setError(apiErrorMessage(r.error));
    }

    if (f.ok) setFloors(f.data);
    if (a.ok) setAreas(a.data);
    if (v.ok) setVendors(v.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.scopeType && r.scopeType !== filters.scopeType) return false;
      if (filters.floorId && r.floorId !== filters.floorId) return false;
      if (filters.commonAreaId && r.commonAreaId !== filters.commonAreaId) return false;
      if (filters.vendorId && r.vendorId !== filters.vendorId) return false;

      const rowDate = pickDate(r);
      if (filters.dateFrom) {
        const from = new Date(`${filters.dateFrom}T00:00:00+08:00`);
        if (!rowDate || rowDate < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(`${filters.dateTo}T23:59:59+08:00`);
        if (!rowDate || rowDate > to) return false;
      }

      return true;
    });
  }, [rows, filters]);

  const quickFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
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

    if (createStatus === "ACCEPTED") {
      if (!acceptanceResult || !inspectorName.trim()) {
        setError("選擇 ACCEPTED 時，驗收結果與驗收人員必填。");
        return;
      }
    }

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
        status: createStatus,
        acceptanceResult: createStatus === "ACCEPTED" ? acceptanceResult : null,
        inspectorName: createStatus === "ACCEPTED" ? inspectorName.trim() : null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("修繕案件已建立。");
    setCreateStatus("DRAFT");
    setAcceptanceResult("");
    setInspectorName("");
    (e.target as HTMLFormElement).reset();
    load(id);
  };

  const markAccepted = async (repairId: string) => {
    const draft = acceptanceDraft[repairId] || { acceptanceResult: "", inspectorName: "" };
    if (!draft.acceptanceResult || !draft.inspectorName.trim()) {
      setError("標記驗收時，驗收結果與驗收人員必填。");
      return;
    }

    setError(null);
    const r = await apiFetch(`/repairs/${repairId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "ACCEPTED",
        acceptanceResult: draft.acceptanceResult,
        inspectorName: draft.inspectorName.trim(),
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("案件已標記為 ACCEPTED。");
    load(id);
  };

  const uploadAttachment = async (repairId: string, file: File | null) => {
    if (!file) return;
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("file", file);

    const resp = await fetch(`${API_BASE}/repairs/${repairId}/attachments`, {
      method: "POST",
      body: fd,
    });

    const json = await resp.json();
    if (!json.ok) {
      setError(apiErrorMessage(json.error));
      return;
    }

    setSuccess("附件已上傳。");

    const listRes = await apiFetch<any[]>(`/repairs/${repairId}/attachments`);
    if (listRes.ok) {
      setAttachmentsByRepair((prev) => ({ ...prev, [repairId]: listRes.data }));
    }
  };

  const summary = useMemo(() => {
    const inProgress = filteredRows.filter((r) => r.status === "IN_PROGRESS").length;
    const completed = filteredRows.filter((r) => r.status === "COMPLETED" || r.status === "ACCEPTED").length;
    const floorScope = filteredRows.filter((r) => r.scopeType === "FLOOR").length;

    return {
      total: filteredRows.length,
      inProgress,
      completed,
      floorScope,
    };
  }, [filteredRows]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="修繕管理"
        description="集中追蹤樓層與公共區域的修繕進度，並補齊驗收與附件紀錄。"
      />

      <SummaryCards
        items={[
          { label: "案件總數", value: summary.total, hint: "目前清單" },
          { label: "進行中", value: summary.inProgress, hint: "需追蹤進度" },
          { label: "已完成", value: summary.completed, hint: "可驗收結案" },
          { label: "樓層範圍", value: summary.floorScope, hint: "其餘為公共區域" },
        ]}
      />

      <SectionBlock title="快速篩選" description="支援範圍/廠商/日期，便於稽核追蹤。" className="taskCard">
        <div className="row">
          <button type="button" className="secondary" onClick={() => quickFilter("")}>全部</button>
          <button type="button" className="secondary" onClick={() => quickFilter("IN_PROGRESS")}>僅進行中</button>
          <button type="button" className="secondary" onClick={() => quickFilter("DRAFT")}>僅草稿</button>
          <button type="button" className="secondary" onClick={() => quickFilter("COMPLETED")}>僅已完成</button>
        </div>

        <form
          className="grid"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setFilters({
              status: String(fd.get("status") || ""),
              scopeType: String(fd.get("scopeType") || ""),
              floorId: String(fd.get("floorId") || ""),
              commonAreaId: String(fd.get("commonAreaId") || ""),
              vendorId: String(fd.get("vendorId") || ""),
              dateFrom: String(fd.get("dateFrom") || ""),
              dateTo: String(fd.get("dateTo") || ""),
            });
          }}
          data-testid="repairs-filter-form"
        >
          <div className="split">
            <label>
              狀態
              <select name="status" defaultValue={filters.status} data-testid="repairs-filter-status">
                <option value="">全部狀態</option>
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              範圍
              <select name="scopeType" defaultValue={filters.scopeType} data-testid="repairs-filter-scope">
                <option value="">全部範圍</option>
                <option value="FLOOR">樓層</option>
                <option value="COMMON_AREA">公共區域</option>
              </select>
            </label>
          </div>

          <div className="split">
            <label>
              樓層
              <select name="floorId" defaultValue={filters.floorId}>
                <option value="">全部樓層</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
            <label>
              公共區域
              <select name="commonAreaId" defaultValue={filters.commonAreaId}>
                <option value="">全部公共區域</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="split">
            <label>
              廠商
              <select name="vendorId" defaultValue={filters.vendorId} data-testid="repairs-filter-vendor">
                <option value="">全部廠商</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </label>
            <div className="split">
              <label>
                日期起
                <input name="dateFrom" type="date" defaultValue={filters.dateFrom} data-testid="repairs-filter-date-from" />
              </label>
              <label>
                日期迄
                <input name="dateTo" type="date" defaultValue={filters.dateTo} data-testid="repairs-filter-date-to" />
              </label>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit" data-testid="repairs-filter-submit">套用篩選</button>
          </div>
        </form>
      </SectionBlock>

      <div className="split">
        <SectionBlock title="新增廠商" description="先建立廠商，再選用於修繕案件。">
          <form className="row" onSubmit={createVendor} aria-label="create-vendor-form" id="quick-add-vendor" data-testid="create-vendor-form">
            <input name="name" placeholder="廠商名稱" required data-testid="vendor-name-input" />
            <button type="submit" data-testid="vendor-submit">新增廠商</button>
          </form>
        </SectionBlock>

        <SectionBlock title="新增修繕案件" description="可選樓層或公共區域，建立後即可追蹤。">
          <form className="grid" onSubmit={createRepair} aria-label="create-repair-form" id="quick-add-repair" data-testid="create-repair-form">
            <div className="split">
              <label>
                範圍
                <select name="scopeType" defaultValue="FLOOR" data-testid="repair-scope-select">
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
                <select
                  name="status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  data-testid="repair-status-select"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="split">
              <input name="item" placeholder="修繕項目" required data-testid="repair-item-input" />
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

            {createStatus === "ACCEPTED" ? (
              <div className="split" data-testid="repair-acceptance-fields">
                <label>
                  驗收結果
                  <select value={acceptanceResult} onChange={(e) => setAcceptanceResult(e.target.value)}>
                    <option value="">選擇驗收結果</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </label>
                <label>
                  驗收人員
                  <input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="請填姓名" />
                </label>
              </div>
            ) : null}

            <button type="submit" data-testid="repair-submit">建立修繕案件</button>
          </form>
        </SectionBlock>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="修繕清單" description="狀態、驗收、附件都在此追蹤。">
        {filteredRows.length === 0 ? (
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
                  <th>驗收 / 附件</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const draft = acceptanceDraft[r.id] || { acceptanceResult: "", inspectorName: "" };

                  return (
                    <tr key={r.id} id={`repair-${r.id}`} data-testid="repair-row">
                      <td>{r.item}</td>
                      <td>{r.scopeType === "FLOOR" ? "樓層" : "公共區域"}</td>
                      <td>{r.vendorName}</td>
                      <td>
                        <StatusChip tone={statusTone(r.status)}>{r.status}</StatusChip>
                      </td>
                      <td>{r.quoteAmount}</td>
                      <td>
                        <div className="grid" style={{ minWidth: 300 }}>
                          {r.status === "COMPLETED" ? (
                            <>
                              <div className="split">
                                <select
                                  value={draft.acceptanceResult}
                                  onChange={(e) =>
                                    setAcceptanceDraft((prev) => ({
                                      ...prev,
                                      [r.id]: { ...draft, acceptanceResult: e.target.value },
                                    }))
                                  }
                                  data-testid={`acceptance-result-${r.id}`}
                                >
                                  <option value="">驗收結果</option>
                                  <option value="PASS">PASS</option>
                                  <option value="FAIL">FAIL</option>
                                </select>
                                <input
                                  value={draft.inspectorName}
                                  onChange={(e) =>
                                    setAcceptanceDraft((prev) => ({
                                      ...prev,
                                      [r.id]: { ...draft, inspectorName: e.target.value },
                                    }))
                                  }
                                  placeholder="驗收人員"
                                  data-testid={`inspector-name-${r.id}`}
                                />
                              </div>
                              <button type="button" className="secondary" onClick={() => markAccepted(r.id)} data-testid={`accept-repair-${r.id}`}>
                                標記 ACCEPTED
                              </button>
                            </>
                          ) : (
                            <span className="muted">{r.status === "ACCEPTED" ? "已完成驗收" : "尚未到驗收階段"}</span>
                          )}

                          <div className="grid" data-testid={`attachment-block-${r.id}`}>
                            <input
                              type="file"
                              onChange={(e) => uploadAttachment(r.id, e.target.files?.[0] || null)}
                              data-testid={`attachment-upload-${r.id}`}
                            />
                            {(attachmentsByRepair[r.id] || []).length === 0 ? (
                              <span className="muted">尚無附件</span>
                            ) : (
                              <div className="row" style={{ gap: 6 }}>
                                {(attachmentsByRepair[r.id] || []).map((file) => (
                                  <a key={file.id} href={file.fileUrl} target="_blank" className="badge" data-testid={`attachment-item-${r.id}`}>
                                    {file.fileName}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </main>
  );
}
