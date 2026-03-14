"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    if (!email || !password) {
      setError("請輸入帳密");
      return;
    }

    localStorage.setItem("cre_logged_in", "1");
    router.push("/buildings");
  };

  return (
    <main className="card" style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit} className="grid">
        <input name="email" placeholder="Email" type="email" />
        <input name="password" placeholder="Password" type="password" />
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit">登入</button>
      </form>
      <p style={{ color: "#666", fontSize: 12 }}>MVP UI：登入僅作本地 session 標記。</p>
    </main>
  );
}
