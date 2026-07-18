// Fetch client for the owner-facing API (/api/owner/*). Token kept in
// localStorage under its own key — completely separate from the admin session.

const TOKEN_KEY = "colrest.ownerToken";

export function getOwnerToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setOwnerToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export class OwnerApiError extends Error {
  status: number;
  upgradeRequired?: string;
  constructor(status: number, message: string, upgradeRequired?: string) {
    super(message);
    this.status = status;
    this.upgradeRequired = upgradeRequired;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getOwnerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/owner${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new OwnerApiError(res.status, data.error || "Request failed", data.upgradeRequired);
  return data as T;
}

export const ownerApi = {
  claim: (body: { entryId: number; name: string; email: string; password: string; phone?: string; message?: string }) =>
    call<{ owner: { id: number; name: string; email: string }; token: string; claim: { id: number; status: string; method: string } }>("POST", "/claim", body),
  login: (email: string, password: string) =>
    call<{ owner: { id: number; name: string; email: string }; token: string }>("POST", "/login", { email, password }),
  logout: () => call<{ success: boolean }>("POST", "/logout"),
  me: () => call<{ id: number; name: string; email: string }>("GET", "/me"),
  listing: () => call<{
    listing: any | null;
    tier?: "free" | "basic" | "pro" | "premium";
    limits?: { photos: number; menuUrl: boolean; analytics: boolean; featured: boolean };
    pendingClaims: Array<{ id: number; entryId: number; status: string; method: string; createdAt: string }>;
  }>("GET", "/listing"),
  updateListing: (patch: { hours?: string; ownerDescription?: string; menuUrl?: string; photos?: string[] }) =>
    call<{ success: boolean; customFields: Record<string, unknown> }>("PATCH", "/listing", patch),
  requestUpgrade: (requestedTier: string, message?: string) =>
    call<{ id: number; status: string; requestedTier: string }>("POST", "/upgrade-request", { requestedTier, message }),
};
