"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function floorOrder(label: string) {
  const normalized = String(label || "").trim().toUpperCase();

  const basement = normalized.match(/^B\s*(\d+)(?:F)?$/);
  if (basement) return -Number(basement[1]);

  const above = normalized.match(/^(\d+)(?:F)?$/);
  if (above) return Number(above[1]);

  if (normalized === "RF") return 1000;

  return Number.MAX_SAFE_INTEGER;
}

export default function CommonAreasPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [areas, setAreas] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFloorIds, setSelectedFloorIds] = useState<string[]>([]);

  const load = async (bid: string) => {
    const [a, f] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/common-areas`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);

    if (a.ok) setAreas(a.data);
    else setError(apiErrorMessage(a.error));

    if (f.ok) setFloors(f.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const createArea = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const code = String(fd.get("code") || "").trim() || null;
    const targetFloorIds = selectedFloorIds.length > 0 ? selectedFloorIds : [];

    if (!name) {
      setError("請先填寫區域名稱");
      return;
    }

    if (targetFloorIds.length === 0) {
      setError("請先在下方「全棟樓層設施總覽」勾選至少一個樓層");
      return;
    }

    const results = await Promise.all(
      targetFloorIds.map((fid) =>
        apiFetch(`/buildings/${id}/common-areas`, {
          method: "POST",
          body: JSON.stringify({
            name,
            code,
            floorId: fid,
          }),
        }),
      ),
    );

    const okCount = results.filter((x) => x.ok).length;
    if (okCount === 0) {
      setError("建立失敗，請稍後重試");
      return;
    }

    setSuccess(`已建立「${name}」到 ${okCount} 個樓層`);
    (e.target as HTMLFormElement).reset();
    setSelectedFloorIds([]);
    load(id);
  };

  const deleteArea = async (areaId: string, name: string) => {
    if (!confirm(`確定刪除「${name}」？`)) return;
    setError(null);
    setSuccess(null);

    const res = await apiFetch(`/common-areas/${areaId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(apiErrorMessage(res.error));
      return;
    }

    setSuccess(`已刪除「${name}」`);
    load(id);
  };

  const sortedFloors = useMemo(
    () =>
      [...floors].sort((a, b) => {
        const diff = floorOrder(a.label) - floorOrder(b.label);
        if (diff !== 0) return diff;
        return String(a.label || "").localeCompare(String(b.label || ""), "zh-Hant", { numeric: true });
      }),
    [floors],
  );

  const allFloorIds = useMemo(() => sortedFloors.map((f) => f.id), [sortedFloors]);
  const allSelected = allFloorIds.length > 0 && allFloorIds.every((fid) => selectedFloorIds.includes(fid));

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="公共區域管理"
        description="針對各樓層管理公共區域，重點是設施配置與分布。"
      />

      <SectionBlock title="新增公共區域" description="可套用到單層、多層或全部樓層。" className="taskCard">
        <form className="grid" onSubmit={createArea} aria-label="create-common-area-form">
          <div className="split">
            <label>
              區域名稱
              <input name="name" placeholder="例如：廁所" required />
            </label>
            <label>
              區域代碼
              <input name="code" placeholder="例如：WC" />
            </label>
          </div>

          <div className="muted">樓層勾選已整合到下方「全棟樓層設施總覽」（含全選）。</div>

          <span className="muted">建立後可在下方直接調整名稱、代碼、樓層。</span>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit">建立公共區域</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="全棟樓層設施總覽" description="在這裡勾選要套用新設施的樓層（可全選）。">
        {sortedFloors.length === 0 ? (
          <EmptyState title="尚無樓層資料" description="請先建立樓層後再管理設施。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => setSelectedFloorIds(e.target.checked ? allFloorIds : [])}
                      />
                      全選
                    </label>
                  </th>
                  <th>樓層</th>
                  <th>公共設施</th>
                </tr>
              </thead>
              <tbody>
                {sortedFloors.map((f) => {
                  const floorAreas = areas.filter((a) => a.floorId === f.id);
                  return (
                    <tr key={f.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedFloorIds.includes(f.id)}
                          onChange={(e) =>
                            setSelectedFloorIds((prev) =>
                              e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                            )
                          }
                        />
                      </td>
                      <td>{f.label}</td>
                      <td>
                        {floorAreas.length === 0 ? (
                          <span className="muted">本層尚無公共設施</span>
                        ) : (
                          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                            {floorAreas.map((a) => (
                              <span key={a.id} className="row" style={{ gap: 4 }}>
                                <Link href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                                  {a.name}
                                </Link>
                                <button
                                  type="button"
                                  className="secondary"
                                  style={{ padding: "2px 8px", minWidth: 0 }}
                                  title={`刪除 ${a.name}`}
                                  onClick={() => deleteArea(a.id, a.name)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
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
