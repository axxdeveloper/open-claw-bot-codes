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
    const floorId = String(fd.get("floorId") || "").trim() || null;
    const applyAll = fd.get("applyAll") === "on";
    const targetFloorIds = applyAll
      ? floors.map((f) => f.id)
      : selectedFloorIds.length > 0
      ? selectedFloorIds
      : floorId
      ? [floorId]
      : [];

    if (!name) {
      setError("請先填寫區域名稱");
      return;
    }

    if (targetFloorIds.length === 0) {
      setError("請至少指定一個樓層（或勾選套用全部樓層）");
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

  const updateArea = async (areaId: string, patch: Record<string, any>) => {
    const res = await apiFetch(`/common-areas/${areaId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setError(apiErrorMessage(res.error));
      return;
    }
    setSuccess("公共區域已更新");
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

  const facilityDistribution = useMemo(() => {
    const floorLabelById = new Map<string, string>();
    sortedFloors.forEach((f) => floorLabelById.set(f.id, f.label));

    const grouped = new Map<string, string[]>();
    areas.forEach((a) => {
      const key = String(a.name || "未命名設施");
      const floorLabel = floorLabelById.get(a.floorId) || "未指定";
      const list = grouped.get(key) || [];
      if (!list.includes(floorLabel)) list.push(floorLabel);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries())
      .map(([name, floors]) => ({
        name,
        floors: floors.sort((x, y) => {
          const diff = floorOrder(x) - floorOrder(y);
          if (diff !== 0) return diff;
          return x.localeCompare(y, "zh-Hant", { numeric: true });
        }),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant", { numeric: true }));
  }, [areas, sortedFloors]);

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

          <label>
            單一樓層（快速指定）
            <select name="floorId" defaultValue="">
              <option value="">不指定（改用下方多樓層）</option>
              {sortedFloors.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>

          <div className="grid" style={{ gap: 8 }}>
            <span className="muted">指定樓層（可複選）</span>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {sortedFloors.map((f) => {
                const checked = selectedFloorIds.includes(f.id);
                return (
                  <label key={f.id} className="badge" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setSelectedFloorIds((prev) =>
                          e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                        )
                      }
                    />{" "}
                    {f.label}
                  </label>
                );
              })}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="applyAll" />
            套用到全部樓層（例如：廁所、管道間、樓梯、茶水室）
          </label>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">建立後可在下方直接調整名稱、代碼、樓層。</span>
            <button type="submit">建立公共區域</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="全棟樓層設施總覽" description="列出這棟大樓每一層目前有哪些公共設施。">
        {sortedFloors.length === 0 ? (
          <EmptyState title="尚無樓層資料" description="請先建立樓層後再管理設施。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>樓層</th>
                  <th>公共設施</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedFloors.map((f) => {
                  const floorAreas = areas.filter((a) => a.floorId === f.id);
                  return (
                    <tr key={f.id}>
                      <td>{f.label}</td>
                      <td>
                        {floorAreas.length === 0 ? (
                          <span className="muted">本層尚無公共設施</span>
                        ) : (
                          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                            {floorAreas.map((a) => (
                              <Link key={a.id} href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                                {a.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/common-areas?floorId=${f.id}`} className="badge">管理此樓層</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="公共設施分布（by 設施）" description="以公共設施為主軸，顯示目前分布在哪些樓層。">
        {facilityDistribution.length === 0 ? (
          <EmptyState title="尚無公共設施" description="先在上方建立設施後，這裡會顯示分布。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>公共設施</th>
                  <th>分布樓層</th>
                  <th>涵蓋層數</th>
                </tr>
              </thead>
              <tbody>
                {facilityDistribution.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                        {item.floors.map((f) => (
                          <span key={`${item.name}-${f}`} className="badge">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td>{item.floors.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="區域清單（CRUD）" description="可直接更新名稱、代碼、樓層；刪除請到詳情頁（避免誤刪）。">
        {areas.length === 0 ? (
          <EmptyState title="尚無公共區域" description="請先建立公共區域。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>區域名稱</th>
                  <th>代碼</th>
                  <th>樓層</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => {
                  const floor = floors.find((f) => f.id === a.floorId);
                  return (
                    <tr key={a.id}>
                      <td>
                        <input
                          defaultValue={a.name}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && value !== a.name) updateArea(a.id, { name: value });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={a.code || ""}
                          placeholder="未設定"
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value !== String(a.code || "")) updateArea(a.id, { code: value || null });
                          }}
                        />
                      </td>
                      <td>
                        <select
                          defaultValue={a.floorId || ""}
                          onChange={(e) => updateArea(a.id, { floorId: e.target.value || null })}
                        >
                          <option value="">未指定</option>
                          {sortedFloors.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                        <div className="muted" style={{ fontSize: 12 }}>{floor?.label || "未指定"}</div>
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                          詳情
                        </Link>
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
