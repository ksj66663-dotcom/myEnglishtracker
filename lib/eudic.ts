import { getSetting } from '@/lib/db';

export const EUDIC_BASE = 'https://api.frdic.com/api/open/v1';

const DEFAULT_USER_AGENT = 'Mozilla/5.0';

export type EudicErrorCode =
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'ACCESS_DENIED'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR'
  | 'ROUTE_ERROR';

export async function getEudicToken(): Promise<string | null> {
  const token = (await getSetting('eudic_token'))?.trim() ?? '';
  console.log({ tokenExists: !!token, tokenLength: token.length });
  return token || null;
}

export function buildEudicHeaders(token: string): HeadersInit {
  return {
    Authorization: `NIS ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': DEFAULT_USER_AGENT,
  };
}

export function mapEudicStatus(status: number): { code: EudicErrorCode; message: string } {
  if (status === 401) return { code: 'TOKEN_INVALID', message: 'Token invalid (401)' };
  if (status === 403) return { code: 'ACCESS_DENIED', message: 'Eudic API access denied (403)' };
  if (status >= 500) return { code: 'UPSTREAM_ERROR', message: `Eudic server error (${status})` };
  return { code: 'UPSTREAM_ERROR', message: `Eudic API request failed (${status})` };
}

export function extractCategoryCount(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'result', 'items', 'categories', 'studylists', 'list']) {
      if (Array.isArray(record[key])) return (record[key] as unknown[]).length;
    }
  }
  return 0;
}
