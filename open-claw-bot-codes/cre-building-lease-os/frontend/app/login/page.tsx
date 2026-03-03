"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/buildings");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) setNextPath(next);
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "").trim();

    if (!password) {
      setError("請輸入密碼");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error?.message || "登入失敗");
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("登入失敗，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <main className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1>系統登入</h1>
      <p className="muted" style={{ marginTop: 6 }}>請輸入存取密碼</p>

      <form onSubmit={onSubmit} className="grid" aria-label="password-login-form">
        <input name="password" placeholder="密碼" type="password" autoFocus />
        {error ? <div className="errorBox">{error}</div> : null}
        <button type="submit" disabled={loading}>{loading ? "登入中..." : "登入"}</button>
      </form>

      <p style={{ color: "#666", fontSize: 12, marginTop: 10 }}>
        上線前請在環境變數設定 <code>AUTH_PAGE_PASSWORD</code> 取代預設密碼。
      </p>
    </main>
  );
}
