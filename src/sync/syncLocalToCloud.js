import { KEYS } from "../lib/constants.js";
import { readJson } from "../lib/lunaStorage.js";
import { closetToApiCreate, localEventToApi, localSleepToApi, localSportToApi } from "../api/lunaMaps.js";
import { fingerprintMigratableData, setSyncState } from "./migrationState.js";

const MOOD_ENERGIES = new Set(["low", "ok", "good", "great"]);

const STEPS = ["closet", "outfits", "events", "sleep", "sport", "mood", "focusSessions"];

function normalizeFocusSession(row) {
  if (!row || typeof row !== "object") return null;
  const {
    room_type,
    planned_seconds,
    completed_seconds,
    completed,
    started_at,
    ended_at,
  } = row;
  if (!room_type || planned_seconds == null || started_at == null) return null;
  return {
    room_type: String(room_type),
    planned_seconds: parseInt(String(planned_seconds), 10) || 0,
    completed_seconds: parseInt(String(completed_seconds ?? 0), 10) || 0,
    completed: !!completed,
    started_at,
    ended_at: ended_at ?? null,
  };
}

/**
 * @param {typeof import("../api/client.js").api} apiFn
 * @param {object} opts
 * @param {string} opts.userEmail
 * @param {(e: { step: string, index: number, total: number, detail?: string }) => void} [opts.onProgress]
 * @returns {Promise<{ ok: boolean, errors: { step: string, message: string }[], counts: Record<string, number> }>}
 */
export async function syncLocalDataToCloud(apiFn, { userEmail, onProgress }) {
  const errors = [];
  const counts = Object.fromEntries(STEPS.map((s) => [s, 0]));
  const total = STEPS.length;

  const report = (step, index, detail) => {
    onProgress?.({ step, index, total, detail });
  };

  const closet = readJson(KEYS.closet, []);
  const outfits = readJson(KEYS.outfits, []);
  const events = readJson(KEYS.events, []);
  const sleep = readJson(KEYS.sleep, []);
  const sport = readJson(KEYS.sport, []);
  const focus = readJson(KEYS.focus, {});
  const focusSessions = readJson(KEYS.focusSessions, []);

  const idMap = new Map();

  let stepIdx = 0;
  report("closet", stepIdx, "Uploading wardrobe…");
  for (const item of closet) {
    try {
      const body = closetToApiCreate(item);
      const created = await apiFn("/closet", { method: "POST", body: JSON.stringify(body) });
      if (created && created.id != null) {
        idMap.set(String(item.id), created.id);
      }
      counts.closet += 1;
    } catch (e) {
      errors.push({ step: "closet", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("outfits", stepIdx, "Uploading outfits…");
  for (const o of outfits) {
    try {
      const rawIds = Array.isArray(o.itemIds) ? o.itemIds : [];
      const item_ids = rawIds
        .map((x) => idMap.get(String(x)))
        .filter((x) => typeof x === "number" && !Number.isNaN(x));
      const body = {
        name: o.name || "Outfit",
        occasion: o.occasion || "Other",
        weather: o.weather || "Spring-Fall",
        mood: o.mood?.trim() || null,
        item_ids,
      };
      await apiFn("/outfits", { method: "POST", body: JSON.stringify(body) });
      counts.outfits += 1;
    } catch (e) {
      errors.push({ step: "outfits", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("events", stepIdx, "Uploading calendar…");
  for (const ev of events) {
    try {
      const body = localEventToApi(ev);
      await apiFn("/wellness/events", { method: "POST", body: JSON.stringify(body) });
      counts.events += 1;
    } catch (e) {
      errors.push({ step: "events", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("sleep", stepIdx, "Uploading sleep logs…");
  for (const s of sleep) {
    try {
      const body = localSleepToApi(s);
      await apiFn("/wellness/sleep", { method: "POST", body: JSON.stringify(body) });
      counts.sleep += 1;
    } catch (e) {
      errors.push({ step: "sleep", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("sport", stepIdx, "Uploading movement…");
  for (const s of sport) {
    try {
      const body = localSportToApi(s);
      if (body.duration_min <= 0) continue;
      await apiFn("/wellness/sport", { method: "POST", body: JSON.stringify(body) });
      counts.sport += 1;
    } catch (e) {
      errors.push({ step: "sport", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("mood", stepIdx, "Uploading daily mood…");
  for (const [dateStr, energy] of Object.entries(focus)) {
    if (!MOOD_ENERGIES.has(energy)) continue;
    try {
      await apiFn("/wellness/mood", {
        method: "POST",
        body: JSON.stringify({ entry_date: dateStr, energy }),
      });
      counts.mood += 1;
    } catch (e) {
      errors.push({ step: "mood", message: e?.message || String(e) });
    }
  }
  stepIdx += 1;

  report("focusSessions", stepIdx, "Uploading focus sessions…");
  for (const row of focusSessions) {
    const body = normalizeFocusSession(row);
    if (!body) continue;
    try {
      await apiFn("/wellness/focus-sessions", { method: "POST", body: JSON.stringify(body) });
      counts.focusSessions += 1;
    } catch (e) {
      errors.push({ step: "focusSessions", message: e?.message || String(e) });
    }
  }

  const reallyOk = errors.length === 0;

  if (reallyOk && userEmail) {
    try {
      localStorage.removeItem(KEYS.closet);
      localStorage.removeItem(KEYS.outfits);
      localStorage.removeItem(KEYS.events);
      localStorage.removeItem(KEYS.sleep);
      localStorage.removeItem(KEYS.sport);
      localStorage.removeItem(KEYS.focus);
      localStorage.removeItem(KEYS.focusSessions);
      const fp = fingerprintMigratableData();
      setSyncState(userEmail, fp);
    } catch {
      /* ignore */
    }
  }

  return { ok: reallyOk, errors, counts };
}
