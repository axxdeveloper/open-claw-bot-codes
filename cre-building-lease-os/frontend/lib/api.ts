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

  const data = await res.json();
  return data as ApiEnvelope<T>;
}

export function apiErrorMessage(error: {
  code?: string;
  message?: string;
  details?: any;
}) {
  if (!error) return '操作失敗，請稍後再試。';

  const reasonCode = error?.details?.reasonCode;
  if (reasonCode === 'OVERLAPPING_ACTIVE_LEASE') {
    return '該單位已有重疊中的 ACTIVE 租約，請調整期間。';
  }
  if (reasonCode === 'INVALID_DATE_RANGE') {
    return '日期區間無效，結束日不可早於開始日。';
  }
  if (reasonCode === 'OWNER_SHARE_OVER_ALLOCATED') {
    return '同時段持分超過 100%，請調整 sharePercent。';
  }

  return error.message || '操作失敗，請稍後再試。';
}

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cre_logged_in') === '1';
}
