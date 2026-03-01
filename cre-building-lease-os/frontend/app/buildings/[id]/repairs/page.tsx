"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip } from "@/components/TaskLayout";
import { API_BASE, apiErrorMessage, apiFetch } from "@/lib/api";

const REPAIR_STATUS_LIST = [
  "DRAFT",
  "QUOTED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "ACCEPTED",
  "REJECTED",
];

const REPAIR_STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  QUOTED: "已報價",
  APPROVED: "已核准",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完工",
  ACCEPTED: "已驗收",
  REJECTED: "已退回",
  DONE: "已完工＋已驗收",
};

function statusLabel(status: string) {
  return REPAIR_STATUS_LABEL[status] || status;
}

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

function displayAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function normalizeStatusFilter(raw: string | null) {
  if (!raw) return "";
  if (raw === "DONE") return "DONE";
  if (REPAIR_STATUS_LIST.includes(raw)) return raw;
  return "";
}

export default function RepairsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

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
    search: "",
  });

  const [acceptanceDraft, setAcceptanceDraft] = useState<Record<string, { acceptanceResult: string; inspectorName: string }>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFilters({
      status: normalizeStatusFilter(searchParams.get("status")),
      scopeType: searchParams.get("scope") || "",
      floorId: searchParams.get("floorId") || "",
      commonAreaId: searchParams.get("commonAreaId") || "",
      vendorId: searchParams.get("vendorId") || "",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      search: searchParams.get("search") || "",
    });
  }, [searchParams]);

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
      if (filters.status) {
        if (filters.status === "DONE") {
          if (!(r.status === "COMPLETED" || r.status === "ACCEPTED")) return false;
        } else if (r.status !== filters.status) {
          return false;
        }
      }
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

      const term = filters.search.trim().toLowerCase();
      if (term) {
        const floorLabel = floors.find((f) => f.id === r.floorId)?.label || "";
        const text = `${r.item || ""} ${r.vendorName || ""} ${r.status || ""} ${r.scopeType || ""} ${floorLabel}`;
        if (!text.toLowerCase().includes(term)) return false;
      }

      return true;
    });
  }, [rows, filters, floors]);

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
        vendorTaxId: String(fd.get("vendorTaxId") || "").trim() || null,
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        finalAmount: String(fd.get("finalAmount") || "").trim()
          ? Number(fd.get("finalAmount"))
          : null,
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


  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="修繕管理"
        description="集中追蹤樓層與公共區域的修繕進度，並補齊驗收與附件紀錄。"
      />

      <SectionBlock title="修繕作業" description="先建立案件，再在每筆案件裡追蹤與驗收；先暫時不做集中報表篩選。" className="taskCard">
        <span className="muted">已先簡化頁面：移除集中式統計與複雜篩選。</span>
      </SectionBlock>

      <SectionBlock
        title="新增修繕案件"
        description="維修提報先建案件，再指派既有廠商。若要新增/維護廠商，請用獨立廠商管理。"
        action={<Link href={`/buildings/${id}/vendors`} className="btn secondary">前往廠商管理</Link>}
      >
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
                  {REPAIR_STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
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

            <div className="split">
              <input name="vendorTaxId" placeholder="廠商統編（選填）" />
              <input name="finalAmount" type="number" step="0.01" placeholder="結案金額（選填）" />
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

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="修繕清單" description="狀態、驗收、附件都在此追蹤。">
        {filteredRows.length === 0 ? (
          <EmptyState
            title="目前沒有修繕案件"
            description="可先新增一筆草稿案件，後續再補完整資訊。"
            action={
              <>
                <Link href={`/buildings/${id}/repairs`} className="btn secondary" data-testid="drilldown-link-repairs-reset-filter">清除篩選</Link>
                <Link href="#quick-add-repair" className="btn" data-testid="drilldown-link-repairs-create-first">新增修繕案件</Link>
              </>
            }
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th>範圍</th>
                  <th>廠商</th>
                  <th>廠商統編</th>
                  <th>狀態</th>
                  <th>預估金額</th>
                  <th>結案金額</th>
                  <th>驗收 / 附件</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const draft = acceptanceDraft[r.id] || { acceptanceResult: "", inspectorName: "" };
                  const floorLabel = floors.find((f) => f.id === r.floorId)?.label;
                  const areaName = areas.find((a) => a.id === r.commonAreaId)?.name;

                  return (
                    <tr key={r.id} id={`repair-${r.id}`} data-testid="repair-row">
                      <td>
                        <Link
                          href={`/buildings/${id}/repairs?search=${encodeURIComponent(r.item)}#repair-${r.id}`}
                          data-testid={`drilldown-link-repair-item-${r.id}`}
                        >
                          {r.item}
                        </Link>
                      </td>
                      <td>
                        {r.scopeType === "FLOOR" ? (
                          <Link href={`/buildings/${id}/floors/${r.floorId}`} data-testid={`drilldown-link-repair-floor-${r.id}`}>
                            樓層{floorLabel ? ` (${floorLabel})` : ""}
                          </Link>
                        ) : (
                          <Link href={`/buildings/${id}/common-areas/${r.commonAreaId}`} data-testid={`drilldown-link-repair-common-area-${r.id}`}>
                            公共區域{areaName ? ` (${areaName})` : ""}
                          </Link>
                        )}
                      </td>
                      <td>{r.vendorName}</td>
                      <td>{r.vendorTaxId || "-"}</td>
                      <td>
                        <Link href={`/buildings/${id}/repairs?status=${r.status}`} data-testid={`drilldown-link-repair-status-${r.id}`}>
                          <StatusChip tone={statusTone(r.status)}>{statusLabel(r.status)}</StatusChip>
                        </Link>
                      </td>
                      <td>{displayAmount(r.quoteAmount)}</td>
                      <td>{displayAmount(r.finalAmount)}</td>
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
                                  <option value="PASS">通過</option>
                                  <option value="FAIL">不通過</option>
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
                                標記為已驗收
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
