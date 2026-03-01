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

    if (!name) {
      setError("請先填寫區域名稱");
      return;
    }

    if (applyAll) {
      if (floors.length === 0) {
        setError("目前沒有樓層可套用");
        return;
      }

      const results = await Promise.all(
        floors.map((f) =>
          apiFetch(`/buildings/${id}/common-areas`, {
            method: "POST",
            body: JSON.stringify({
              name,
              code,
              floorId: f.id,
            }),
          }),
        ),
      );

      const okCount = results.filter((x) => x.ok).length;
      if (okCount === 0) {
        setError("套用全部樓層失敗，請稍後重試");
        return;
      }

      setSuccess(`已套用「${name}」到 ${okCount} 個樓層`);
      (e.target as HTMLFormElement).reset();
      load(id);
      return;
    }

    const res = await apiFetch(`/buildings/${id}/common-areas`, {
      method: "POST",
      body: JSON.stringify({
        name,
        code,
        floorId,
      }),
    });

    if (!res.ok) {
      setError(apiErrorMessage(res.error));
      return;
    }

    setSuccess("公共區域已建立。");
    (e.target as HTMLFormElement).reset();
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

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="公共區域管理"
        description="管理梯廳、機房、會議區等公共區域，方便修繕與責任劃分。"
        action={<Link href={`/buildings/${id}/repairs`} className="btn">前往修繕管理</Link>}
      />

      <SectionBlock title="新增公共區域" description="可建立單層設施，或一次套用到全棟所有樓層。" className="taskCard">
        <form className="split" onSubmit={createArea} aria-label="create-common-area-form">
          <label>
            區域名稱
            <input name="name" placeholder="例如：B1 停車場" required />
          </label>
          <label>
            區域代碼
            <input name="code" placeholder="例如：PARK-B1" />
          </label>
          <label>
            所屬樓層
            <select name="floorId" defaultValue="">
              <option value="">未指定</option>
              {sortedFloors.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="applyAll" />
            套用到全部樓層（例如：廁所、管道間、樓梯、茶水室）
          </label>
          <div className="row" style={{ alignItems: "end" }}>
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

      <SectionBlock title="區域清單" description="點擊可查看區域細節與後續維運資訊。">
        {areas.length === 0 ? (
          <EmptyState title="尚無公共區域" description="建議先建立常用區域，修繕追蹤會更清楚。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>區域名稱</th>
                  <th>代碼</th>
                  <th>樓層</th>
                  <th>詳情</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => {
                  const floor = floors.find((f) => f.id === a.floorId);
                  return (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.code || "-"}</td>
                      <td>{floor?.label || "未指定"}</td>
                      <td>
                        <Link href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                          查看
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
