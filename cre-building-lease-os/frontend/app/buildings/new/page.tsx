"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type FormValues = {
  name: string;
  code: string;
  address: string;
  managementFee: string;
  basementFloors: string;
  aboveGroundFloors: string;
};

export default function NewBuildingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: "",
    code: "",
    address: "",
    managementFee: "",
    basementFloors: "5",
    aboveGroundFloors: "20",
  });

  const validation = useMemo(() => {
    const issues: string[] = [];
    if (!values.name.trim()) issues.push("請填寫大樓名稱");
    if (Number(values.aboveGroundFloors) <= 0) issues.push("地上層數需至少 1 層");
    if (Number(values.basementFloors) < 0) issues.push("地下層數不可小於 0");
    return issues;
  }, [values]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (validation.length > 0) {
      setError(validation[0]);
      return;
    }

    setLoading(true);

    const payload = {
      name: values.name.trim(),
      code: values.code.trim() || null,
      address: values.address.trim() || null,
      managementFee: values.managementFee ? Number(values.managementFee) : null,
    };

    const buildingRes = await apiFetch<any>("/buildings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!buildingRes.ok) {
      setError(apiErrorMessage(buildingRes.error));
      setLoading(false);
      return;
    }

    const floorRes = await apiFetch(`/buildings/${buildingRes.data.id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({
        basementFloors: Number(values.basementFloors) || 0,
        aboveGroundFloors: Number(values.aboveGroundFloors) || 1,
      }),
    });

    if (!floorRes.ok) {
      setError(`大樓已建立，但樓層建立失敗：${apiErrorMessage(floorRes.error)}`);
      setLoading(false);
      return;
    }

    setSuccess("建立完成！下一步：先配置主要樓層單位。\n系統將帶你前往樓層管理頁。\n");
    router.push(`/buildings/${buildingRes.data.id}/floors`);
  };

  return (
    <main className="page">
      <PageHeader
        title="建立新大樓｜三步驟"
        description="先填大樓基本資料，再設定地下/地上層數，完成後直接進入樓層配置。"
        action={<Link href="/buildings" className="btn secondary">回 Dashboard</Link>}
      />

      <SummaryCards
        items={[
          { label: "步驟 1", value: "基本資料", hint: "名稱、代碼、地址" },
          { label: "步驟 2", value: "樓層設定", hint: "地下層與地上層" },
          { label: "步驟 3", value: "開始配置", hint: "新增單位與住戶" },
          { label: "建立後", value: "自動導引", hint: "直接前往樓層管理" },
        ]}
      />

      <SectionBlock title="建立精靈" description="避免一次填太多，先完成必要資訊即可開始作業。">
        <form onSubmit={onSubmit} className="grid" aria-label="create-building-form">
          <div className="split">
            <label>
              大樓名稱（必填）
              <input
                name="name"
                placeholder="例如：宏盛國際金融中心"
                required
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
              />
            </label>
            <label>
              大樓代碼
              <input
                name="code"
                placeholder="例如：HSIFC"
                value={values.code}
                onChange={(e) => setValues((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              />
            </label>
          </div>

          <div className="split">
            <label>
              地址
              <input
                name="address"
                placeholder="例如：台北市信義區市府路 100 號"
                value={values.address}
                onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))}
              />
            </label>
            <label>
              預設管理費（每坪）
              <input
                name="managementFee"
                type="number"
                min={0}
                step="0.01"
                placeholder="例如：220"
                value={values.managementFee}
                onChange={(e) => setValues((p) => ({ ...p, managementFee: e.target.value }))}
              />
            </label>
          </div>

          <div className="split">
            <label>
              地下層數
              <input
                name="basementFloors"
                type="number"
                min={0}
                max={20}
                value={values.basementFloors}
                onChange={(e) => setValues((p) => ({ ...p, basementFloors: e.target.value }))}
              />
            </label>
            <label>
              地上層數
              <input
                name="aboveGroundFloors"
                type="number"
                min={1}
                max={200}
                value={values.aboveGroundFloors}
                onChange={(e) => setValues((p) => ({ ...p, aboveGroundFloors: e.target.value }))}
              />
            </label>
          </div>

          {validation.length > 0 ? <div className="infoBox">提醒：{validation[0]}</div> : null}
          {error ? <div className="errorBox">{error}</div> : null}
          {success ? <div className="successBox">{success}</div> : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted">完成後會自動前往「樓層與單位配置」頁。</span>
            <button type="submit" disabled={loading}>
              {loading ? "建立中..." : "建立並前往下一步"}
            </button>
          </div>
        </form>
      </SectionBlock>
    </main>
  );
}
