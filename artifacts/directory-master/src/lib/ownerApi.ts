// Owner credentials stay in an HttpOnly, SameSite cookie. Local storage keeps
// only a non-sensitive marker so the shell can render the dashboard shortcut.
const SESSION_MARKER = "colrest.ownerSession";

export function getOwnerToken(): string | null {
  try { return localStorage.getItem(SESSION_MARKER); } catch { return null; }
}

export function setOwnerToken(value: string | null) {
  try {
    if (value) localStorage.setItem(SESSION_MARKER, "1");
    else localStorage.removeItem(SESSION_MARKER);
  } catch { /* storage may be unavailable */ }
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
  const response = await fetch(`/api/owner${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new OwnerApiError(response.status, data.error || "Request failed", data.upgradeRequired);
  return data as T;
}

type SessionResponse = {
  owner: { id: number; name: string; email: string };
  authenticated: true;
  token?: string;
};

export const ownerApi = {
  claim: (body: { entryId: number; name: string; email: string; password: string; phone?: string; message?: string; company?: string }) =>
    call<SessionResponse & { claim: { id: number; status: string; method: string } }>("POST", "/claim", body),
  login: (email: string, password: string) =>
    call<SessionResponse>("POST", "/login", { email, password }),
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
