"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

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
    const res = await apiFetch(`/buildings/${id}/common-areas`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || "").trim(),
        code: String(fd.get("code") || "").trim() || null,
        floorId: String(fd.get("floorId") || "").trim() || null,
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

  const summary = useMemo(() => {
    const boundToFloor = areas.filter((a) => a.floorId).length;
    return {
      total: areas.length,
      boundToFloor,
      noFloor: Math.max(areas.length - boundToFloor, 0),
    };
  }, [areas]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="公共區域管理"
        description="管理梯廳、機房、會議區等公共區域，方便修繕與責任劃分。"
        action={<Link href={`/buildings/${id}/repairs`} className="btn">前往修繕管理</Link>}
      />

      <SummaryCards
        items={[
          { label: "公共區域數", value: summary.total, hint: "本棟已建檔" },
          { label: "已綁定樓層", value: summary.boundToFloor, hint: "可直接定位" },
          { label: "未綁定樓層", value: summary.noFloor, hint: "建議補齊" },
          { label: "下一步", value: "串接修繕", hint: "可在修繕頁篩選" },
        ]}
      />

      <SectionBlock title="新增公共區域" description="簡化建立流程，先建主檔再補細節。" className="taskCard">
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
              {floors.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <div className="row" style={{ alignItems: "end" }}>
            <button type="submit">建立公共區域</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

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
