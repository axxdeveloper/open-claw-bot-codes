"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type SplitDraft = {
  c1: string;
  g1: string;
  c2: string;
  g2: string;
};

export default function FloorDetailPage() {
  const params = useParams<{ id: string; floorId: string }>();
  const id = params.id;
  const floorId = params.floorId;

  const [floor, setFloor] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [floorOwners, setFloorOwners] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Record<string, string>>({});
  const [splitDrafts, setSplitDrafts] = useState<Record<string, SplitDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    const [f, t, o, fo, r] = await Promise.all([
      apiFetch<any>(`/floors/${floorId}`),
      apiFetch<any[]>(`/buildings/${id}/tenants`),
      apiFetch<any[]>(`/buildings/${id}/owners`),
      apiFetch<any[]>(`/floors/${floorId}/owners`),
      apiFetch<any[]>(`/buildings/${id}/repairs?floorId=${floorId}`),
    ]);

    if (f.ok) {
      setFloor(f.data.floor);
      setUnits(f.data.units || []);
      const defaults: Record<string, SplitDraft> = {};
      for (const u of f.data.units || []) {
        defaults[u.id] = {
          c1: `${u.code}-1`,
          c2: `${u.code}-2`,
          g1: u.grossArea ? (Number(u.grossArea) / 2).toFixed(2) : "0",
          g2: u.grossArea ? (Number(u.grossArea) / 2).toFixed(2) : "0",
        };
      }
      setSplitDrafts(defaults);
    }
    if (t.ok) setTenants(t.data);
    if (o.ok) setOwners(o.data);
    if (fo.ok) setFloorOwners(fo.data);
    if (r.ok) setRepairs(r.data);
  };

  useEffect(() => {
    if (!id || !floorId) return;
    load();
  }, [id, floorId]);

  if (!id || !floorId) return null;

  const addUnit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/floors/${floorId}/units`, {
      method: "POST",
      body: JSON.stringify({
        code: String(fd.get("code") || ""),
        grossArea: Number(fd.get("grossArea") || 0),
        netArea: fd.get("netArea") ? Number(fd.get("netArea")) : null,
        balconyArea: fd.get("balconyArea") ? Number(fd.get("balconyArea")) : null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("單位已新增");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const splitUnit = async (unitId: string) => {
    const d = splitDrafts[unitId];
    if (!d) return;

    setError(null);
    setSuccess(null);

    const r = await apiFetch(`/units/${unitId}/split`, {
      method: "POST",
      body: JSON.stringify({
        parts: [
          { code: d.c1.trim(), grossArea: Number(d.g1) },
          { code: d.c2.trim(), grossArea: Number(d.g2) },
        ],
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("單位已切割");
    load();
  };

  const assignDraftOccupancy = async (unitId: string) => {
    const tenantId = selectedTenant[unitId];
    if (!tenantId) {
      setError("請先選擇租戶，再建立 DRAFT occupancy。");
      return;
    }

    const r = await apiFetch(`/occupancies`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        unitId,
        tenantId,
        status: "DRAFT",
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("DRAFT occupancy 建立完成");
  };

  const assignOwner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);

    const payload: any = {
      ownerId: String(fd.get("ownerId") || ""),
      sharePercent: Number(fd.get("sharePercent") || 0),
      notes: String(fd.get("notes") || "") || null,
    };
    if (fd.get("startDate")) payload.startDate = `${fd.get("startDate")}T00:00:00+08:00`;
    if (fd.get("endDate")) payload.endDate = `${fd.get("endDate")}T00:00:00+08:00`;

    const r = await apiFetch(`/floors/${floorId}/owners/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("業主持分已指派");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const createRepair = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/repairs`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        scopeType: "FLOOR",
        floorId,
        item: String(fd.get("item") || ""),
        vendorName: String(fd.get("vendorName") || ""),
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        status: "DRAFT",
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("樓層修繕紀錄已新增");
    (e.target as HTMLFormElement).reset();
    load();
  };

  return (
    <main className="page">
      <div className="card">
        <h1>Floor {floor?.label}</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          同步管理此樓層單位、DRAFT occupancy、業主持分與樓層修繕。
        </p>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="successBox">{success}</div>}

      <section className="card grid">
        <h2 className="cardTitle">Floor Owners</h2>
        <form onSubmit={assignOwner} className="split" aria-label="assign-owner-form">
          <label>
            Owner
            <select name="ownerId" required>
              <option value="">選擇業主</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Share Percent
            <input name="sharePercent" type="number" step="0.01" placeholder="例如 50" required />
          </label>
          <label>
            Start Date
            <input name="startDate" type="date" />
          </label>
          <label>
            End Date
            <input name="endDate" type="date" />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Notes
            <input name="notes" placeholder="備註" />
          </label>
          <button type="submit">Assign Owner</button>
        </form>

        {floorOwners.length === 0 ? (
          <div className="muted">尚未設定樓層持分。</div>
        ) : (
          floorOwners.map((fo) => (
            <div key={fo.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                <b>{fo.owner?.name || fo.ownerId}</b> / {fo.sharePercent}%
              </span>
              <button
                className="danger"
                onClick={async () => {
                  await apiFetch(`/floor-owners/${fo.id}`, { method: "DELETE" });
                  load();
                }}
              >
                delete
              </button>
            </div>
          ))
        )}
      </section>

      <section className="card grid">
        <h2 className="cardTitle">Floor Repairs</h2>
        <form onSubmit={createRepair} className="row" aria-label="create-floor-repair-form">
          <input name="item" placeholder="item" required />
          <input name="vendorName" placeholder="vendor" required />
          <input name="quoteAmount" type="number" step="0.01" placeholder="quote" required />
          <button type="submit">Add Repair</button>
        </form>

        {repairs.length === 0 ? (
          <div className="muted">尚無樓層修繕紀錄。</div>
        ) : (
          repairs.map((r) => (
            <div key={r.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                {r.item} / {r.status} / {r.vendorName}
              </span>
              <span className="badge">{r.quoteAmount}</span>
            </div>
          ))
        )}
      </section>

      <section className="card grid">
        <h2 className="cardTitle">Units</h2>
        <form onSubmit={addUnit} className="row" aria-label="add-unit-form">
          <input name="code" placeholder="code" required />
          <input name="grossArea" type="number" step="0.01" placeholder="gross" required />
          <input name="netArea" type="number" step="0.01" placeholder="net" />
          <input name="balconyArea" type="number" step="0.01" placeholder="balcony" />
          <button type="submit">Add Unit</button>
        </form>

        <table className="table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Area</th>
              <th>Split</th>
              <th>DRAFT Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id}>
                <td>{u.code}</td>
                <td>G {u.grossArea}</td>
                <td>
                  <div className="grid" style={{ minWidth: 220 }}>
                    <input
                      aria-label={`split-code-1-${u.id}`}
                      value={splitDrafts[u.id]?.c1 || ""}
                      onChange={(e) =>
                        setSplitDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...prev[u.id], c1: e.target.value },
                        }))
                      }
                      placeholder="code 1"
                    />
                    <input
                      aria-label={`split-gross-1-${u.id}`}
                      value={splitDrafts[u.id]?.g1 || ""}
                      onChange={(e) =>
                        setSplitDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...prev[u.id], g1: e.target.value },
                        }))
                      }
                      placeholder="gross 1"
                    />
                    <input
                      aria-label={`split-code-2-${u.id}`}
                      value={splitDrafts[u.id]?.c2 || ""}
                      onChange={(e) =>
                        setSplitDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...prev[u.id], c2: e.target.value },
                        }))
                      }
                      placeholder="code 2"
                    />
                    <input
                      aria-label={`split-gross-2-${u.id}`}
                      value={splitDrafts[u.id]?.g2 || ""}
                      onChange={(e) =>
                        setSplitDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...prev[u.id], g2: e.target.value },
                        }))
                      }
                      placeholder="gross 2"
                    />
                    <button className="secondary" onClick={() => splitUnit(u.id)}>
                      Split
                    </button>
                  </div>
                </td>
                <td>
                  <div className="grid" style={{ minWidth: 180 }}>
                    <select
                      value={selectedTenant[u.id] || ""}
                      onChange={(e) =>
                        setSelectedTenant((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                    >
                      <option value="">選擇租戶</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button className="secondary" onClick={() => assignDraftOccupancy(u.id)}>
                      Assign DRAFT
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
