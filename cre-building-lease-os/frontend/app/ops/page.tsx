"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";

export default function OpsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const r = await fetch("/api/ops/status", { cache: "no-store" })
      .then((x) => x.json())
      .catch(() => ({ ok: false, error: { message: "讀取失敗" } }));
    if (!r?.ok) {
      setError(r?.error?.message || "讀取失敗");
      return;
    }
    setData(r);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="pageWrap">
      <PageHeader
        title="系統儀表板 /ops"
        description="即時查看前後端可用性與基本系統資訊（30 秒自動更新）。"
        action={<button onClick={load}>立即刷新</button>}
      />

      {error ? <div className="errorBox">{error}</div> : null}

      {data ? (
        <>
          <SummaryCards
            items={[
              {
                label: "Frontend",
                value: data?.services?.frontend?.ok ? "正常" : "異常",
                hint: `status ${data?.services?.frontend?.status ?? "-"}`,
              },
              {
                label: "Backend API",
                value: data?.services?.backend?.ok ? "正常" : "異常",
                hint: `status ${data?.services?.backend?.status ?? "-"} / ${data?.services?.backend?.latencyMs ?? "-"}ms`,
              },
              {
                label: "Node Uptime",
                value: `${data?.system?.uptimeSec ?? 0}s`,
                hint: `node ${data?.system?.node ?? "-"}`,
              },
              {
                label: "Memory",
                value: `${data?.system?.memory?.rssMb ?? "-"}MB`,
                hint: `heap ${data?.system?.memory?.heapUsedMb ?? "-"}MB`,
              },
            ]}
          />

          <SectionBlock title="OpenClaw 狀態" description="Web runtime 無法直接讀取 gateway/cron/subagent host 狀態。">
            <div className="muted">{data?.openclaw?.note}</div>
          </SectionBlock>

          <SectionBlock title="更新時間" description="最後一次採樣時間">
            <div>{new Date(data.generatedAt).toLocaleString("zh-TW")}</div>
          </SectionBlock>
        </>
      ) : null}
    </main>
  );
}
