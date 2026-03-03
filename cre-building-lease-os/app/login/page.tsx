"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error?.message ?? "登入失敗");
      setLoading(false);
      return;
    }

    router.push("/buildings");
    router.refresh();
  };

  return (
    <main className="mx-auto mt-20 max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">登入 CRE Lease OS</h1>
      <p className="mb-6 text-sm text-gray-500">MVP 測試帳號可由 seed 建立：admin@example.com / admin123</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="Email" className="w-full rounded border px-3 py-2" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50" disabled={loading}>
          {loading ? "登入中..." : "登入"}
        </button>
      </form>
    </main>
  );
}
