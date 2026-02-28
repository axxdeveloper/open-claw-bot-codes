export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export type ApiEnvelope<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: any } };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  return res.json();
}

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cre_logged_in') === '1';
}
