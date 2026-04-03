import { KEYS, SYNC_STATE_KEY } from "../lib/constants.js";
import { readJson } from "../lib/lunaStorage.js";

/** Session-only: dismiss "Import to cloud?" until tab closes */
export const SESSION_DISMISS_KEY = "luna_cloud_sync_dismiss_session";

function isNonEmpty(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

export function migratablePayload() {
  return {
    closet: readJson(KEYS.closet, []),
    outfits: readJson(KEYS.outfits, []),
    events: readJson(KEYS.events, []),
    sleep: readJson(KEYS.sleep, []),
    sport: readJson(KEYS.sport, []),
    focus: readJson(KEYS.focus, {}),
    focusSessions: readJson(KEYS.focusSessions, []),
  };
}

export function hasMigratableLocalData() {
  const p = migratablePayload();
  if (isNonEmpty(p.closet)) return true;
  if (isNonEmpty(p.outfits)) return true;
  if (isNonEmpty(p.events)) return true;
  if (isNonEmpty(p.sleep)) return true;
  if (isNonEmpty(p.sport)) return true;
  if (isNonEmpty(p.focus)) return true;
  if (isNonEmpty(p.focusSessions)) return true;
  return false;
}

export function fingerprintMigratableData() {
  const s = JSON.stringify(migratablePayload());
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return String(h >>> 0);
}

export function getSyncState() {
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Offer sync when there is local data and (wrong account or data changed since last successful sync).
 */
export function shouldOfferCloudSync(userEmail) {
  if (!userEmail || !hasMigratableLocalData()) return false;
  const fp = fingerprintMigratableData();
  const st = getSyncState();
  if (!st || st.email !== userEmail) return true;
  return st.lastFingerprint !== fp;
}

export function setSyncState(email, fingerprint) {
  localStorage.setItem(
    SYNC_STATE_KEY,
    JSON.stringify({
      version: 1,
      email,
      lastFingerprint: fingerprint,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function clearSessionDismiss() {
  try {
    sessionStorage.removeItem(SESSION_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

export function isSessionDismissed() {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissForSession() {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
