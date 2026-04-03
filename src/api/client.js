const BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

const TOKEN_KEY = "luna_access_token";

export function getApiBase() {
  return BASE.replace(/\/$/, "");
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function detailMessage(body) {
  const d = body?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join(", ");
  return "Request failed";
}

/**
 * @template T
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<T>}
 */
export async function api(path, init = {}) {
  const headers = new Headers(init.headers);
  const isForm = init.body instanceof FormData;
  if (!isForm) headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const res = await fetch(`${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(detailMessage(body) || res.statusText);
  }
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  return JSON.parse(text);
}
