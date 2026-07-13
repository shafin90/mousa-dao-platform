/**
 * Normalizes list responses regardless of backend shape.
 *
 * The backend's `respondPaginated` helper returns `{ data: [...], pagination }`,
 * while some deployments/endpoints return `{ data: { <key>: [...], total } }`.
 * This helper accepts the raw axios response body and returns a consistent
 * `{ items, total }` pair.
 */
export function extractList<T>(
  responseBody: { data: unknown; pagination?: { total?: number } },
  key: string,
): { items: T[]; total: number } {
  const payload = responseBody?.data;

  if (Array.isArray(payload)) {
    return { items: payload as T[], total: responseBody.pagination?.total ?? payload.length };
  }

  const obj = (payload || {}) as Record<string, unknown>;
  const items = Array.isArray(obj[key]) ? (obj[key] as T[]) : [];
  const total = typeof obj.total === "number" ? obj.total : items.length;
  return { items, total };
}
