export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL_BROWSER || '/api-proxy';

export type ApiEnvelope<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: any } };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : { ok: false, error: { code: 'INTERNAL', message: '空白回應' } };
    return data as ApiEnvelope<T>;
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || '連線失敗，請稍後再試。',
      },
    };
  }
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

  if (error.code === 'NETWORK_ERROR') {
    return '目前連線異常，請確認後端服務是否啟動。';
  }

  return error.message || '操作失敗，請稍後再試。';
}

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cre_logged_in') === '1';
}
