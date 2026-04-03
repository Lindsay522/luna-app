export function closetFromApi(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || "",
    category: row.category,
    season: row.season,
    styleTags: row.style_tags || "",
    price: row.price != null ? Math.round(Number(row.price)) : null,
    link: row.link || null,
    dupeNote: row.notes || null,
  };
}

/** Build API body from closet form / UI object */
export function closetToApiCreate(fields) {
  return {
    name: fields.name,
    brand: fields.brand || null,
    category: fields.category,
    season: fields.season,
    style_tags: fields.styleTags || null,
    price: fields.price != null ? Number(fields.price) : null,
    link: fields.link || null,
    notes: fields.dupeNote || null,
  };
}

export function outfitFromApi(row) {
  return {
    id: row.id,
    name: row.name,
    occasion: row.occasion,
    weather: row.weather,
    mood: row.mood || "",
    itemIds: Array.isArray(row.item_ids) ? row.item_ids.map(Number) : [],
  };
}

export function eventFromApi(row) {
  let time = "09:00";
  if (row.event_time) {
    const t = String(row.event_time);
    time = t.length >= 5 ? t.slice(0, 5) : t;
  }
  return {
    id: row.id,
    date: row.event_date,
    time,
    title: row.title,
    type: row.event_type,
  };
}

export function sleepFromApi(row) {
  return {
    id: row.id,
    date: row.log_date,
    start: row.bed_time,
    end: row.wake_time,
    hours: String(row.hours),
  };
}

export function sportFromApi(row) {
  return {
    id: row.id,
    type: row.activity,
    duration: row.duration_min,
    date: row.log_date,
  };
}

/** @typedef {{ date: string, start: string, end: string, hours?: string|number }} LocalSleepEntry */
/** @typedef {{ date: string, type?: string, duration?: number }} LocalSportEntry */
/** @typedef {{ date: string, time?: string, title?: string, type?: string }} LocalEventEntry */

function timeToApiField(t) {
  if (t == null || t === "") return null;
  const s = String(t).trim();
  if (s.length === 5) return `${s}:00`;
  return s;
}

/** Map local Planner sleep row → POST /wellness/sleep body */
export function localSleepToApi(entry) {
  const log_date = entry.date;
  const hours = parseFloat(String(entry.hours ?? "0"), 10);
  return {
    log_date,
    bed_time: timeToApiField(entry.start) || "00:00:00",
    wake_time: timeToApiField(entry.end) || "00:00:00",
    hours: Number.isFinite(hours) ? hours : 0,
  };
}

export function localSportToApi(entry) {
  return {
    log_date: entry.date,
    activity: entry.type || "Other",
    duration_min: Math.max(0, parseInt(String(entry.duration ?? 0), 10) || 0),
  };
}

export function localEventToApi(entry) {
  return {
    event_date: entry.date,
    event_time: timeToApiField(entry.time),
    title: entry.title || "Event",
    event_type: entry.type || "default",
  };
}
