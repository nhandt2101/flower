export const ADMIN_SESSION_KEY = "flower-admin-session";

export type AdminSession = {
  token: string;
  email: string;
  name: string;
};

function hasWindow() {
  return typeof window !== "undefined";
}

export function getAdminSession(): AdminSession | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAdminAuthenticated() {
  const s = getAdminSession();
  return Boolean(s && s.token);
}
