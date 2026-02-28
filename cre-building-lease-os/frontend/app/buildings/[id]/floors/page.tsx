"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function FloorsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [floors, setFloors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (bid: string) => {
    const r = await apiFetch<any[]>(`/buildings/${bid}/floors`);
    if (r.ok) setFloors(r.data);
    else setError(apiErrorMessage(r.error));
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const regenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/buildings/${id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({
        basementFloors: Number(fd.get("basementFloors") || 5),
        aboveGroundFloors: Number(fd.get("aboveGroundFloors") || 20),
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    load(id);
  };

  if (!id) return null;

  return (
    <main className="page">
      <div className="card">
        <h1 style={{ marginBottom: 6 }}>Floors</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          樓層依 sortIndex 升冪（B 樓在前），點擊樓層可進入單位管理。
        </p>

        <form className="row" onSubmit={regenerate} aria-label="regenerate-floors-form">
          <label>
            Basement
            <input name="basementFloors" defaultValue={5} type="number" min={0} max={20} />
          </label>
          <label>
            Above Ground
            <input
              name="aboveGroundFloors"
              defaultValue={20}
              type="number"
              min={1}
              max={200}
            />
          </label>
          <button type="submit">Generate</button>
        </form>
      </div>

      {error && <div className="errorBox">{error}</div>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Sort</th>
            </tr>
          </thead>
          <tbody>
            {floors.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link href={`/buildings/${id}/floors/${f.id}`}>{f.label}</Link>
                </td>
                <td>{f.sortIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
