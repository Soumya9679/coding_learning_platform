const SESSION_TOKEN_KEY = "pulsepy-dev-session";

export function persistSessionToken(token) {
  if (!token) return;
  try { localStorage.setItem(SESSION_TOKEN_KEY, token); } catch {}
}

export function clearSessionToken() {
  try { localStorage.removeItem(SESSION_TOKEN_KEY); } catch {}
}

export function readSessionToken() {
  try { return localStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

export function applyAuthHeaders(headers = {}) {
  const token = readSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
