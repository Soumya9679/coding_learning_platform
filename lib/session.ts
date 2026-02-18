// Client-side session helpers (browser only)

const TOKEN_KEY = "pulsepy_session_token";

export function persistSessionToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearSessionToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function readSessionToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function applyAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = readSessionToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
