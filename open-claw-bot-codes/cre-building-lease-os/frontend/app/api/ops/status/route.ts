import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function probe(url: string, timeoutMs = 2500) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    return {
      ok: r.ok,
      status: r.status,
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const apiBase = process.env.API_BASE_URL || "http://cre-backend:8080/api";
  const backendProbe = await probe(`${apiBase}/buildings`);

  const mem = process.memoryUsage();

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    openclaw: {
      status: "unavailable-from-web-runtime",
      note: "OpenClaw gateway/cron/subagent/process 狀態需由 agent 或 host 指令取得。",
    },
    services: {
      frontend: {
        ok: true,
        status: 200,
      },
      backend: backendProbe,
    },
    system: {
      uptimeSec: Math.round(process.uptime()),
      platform: process.platform,
      node: process.version,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    },
  });
}
