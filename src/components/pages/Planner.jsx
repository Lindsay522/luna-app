import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { useLuna } from "../../hooks/useLuna.js";
import { newId } from "../../lib/newId.js";
import { MONTH_NAMES, WEEKDAYS } from "../../lib/constants.js";
import { todayStr } from "../../lib/dates.js";
import { api } from "../../api/client.js";
import { eventFromApi, sleepFromApi, sportFromApi } from "../../api/lunaMaps.js";

function buildCalendarCells(calYear, calMonth) {
  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);
  const startDay = first.getDay();
  const days = last.getDate();
  const prevMonth = new Date(calYear, calMonth, 0);
  const prevDays = prevMonth.getDate();
  const cells = [];

  for (let i = 0; i < startDay; i++) {
    const d = prevDays - startDay + i + 1;
    const dateStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, dateStr, other: true });
  }
  for (let d = 1; d <= days; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, dateStr, other: false });
  }
  const nextY = calMonth === 11 ? calYear + 1 : calYear;
  const nextM = calMonth === 11 ? 0 : calMonth + 1;
  const total = startDay + days;
  const nextCount = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 0; i < nextCount; i++) {
    const d = i + 1;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, dateStr, other: true });
  }
  return cells;
}

function timeToApi(evTime) {
  if (!evTime) return null;
  const s = String(evTime).trim();
  if (s.length === 5) return `${s}:00`;
  return s;
}

export function Planner() {
  const luna = useLuna();
  const auth = useAuth();
  const qc = useQueryClient();
  const today = todayStr();

  const eventsQ = useQuery({
    queryKey: ["wellness-events"],
    queryFn: async () => {
      const rows = await api("/wellness/events");
      return rows.map(eventFromApi);
    },
    enabled: auth.isCloud,
  });

  const sleepQ = useQuery({
    queryKey: ["wellness-sleep"],
    queryFn: async () => {
      const rows = await api("/wellness/sleep?limit=60");
      return rows.map(sleepFromApi);
    },
    enabled: auth.isCloud,
  });

  const sportQ = useQuery({
    queryKey: ["wellness-sport"],
    queryFn: async () => {
      const rows = await api("/wellness/sport?limit=60");
      return rows.map(sportFromApi);
    },
    enabled: auth.isCloud,
  });

  const addEventMut = useMutation({
    mutationFn: (body) => api("/wellness/events", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness-events"] }),
  });

  const delEventMut = useMutation({
    mutationFn: (id) => api(`/wellness/events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness-events"] }),
  });

  const logSleepMut = useMutation({
    mutationFn: (body) => api("/wellness/sleep", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness-sleep", "analytics-summary"] }),
  });

  const logSportMut = useMutation({
    mutationFn: (body) => api("/wellness/sport", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness-sport", "analytics-summary"] }),
  });

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [evTime, setEvTime] = useState("09:00");
  const [evTitle, setEvTitle] = useState("");
  const [evType, setEvType] = useState("default");

  const [reflectionDraft, setReflectionDraft] = useState("");

  const events = useMemo(() => {
    if (auth.isCloud) return eventsQ.data ?? [];
    return luna.getEvents();
  }, [auth.isCloud, eventsQ.data, luna]);

  const cells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, selectedDate]);

  const openDay = (dateStr) => {
    setSelectedDate(dateStr);
    const o = luna.getReflections();
    const t = typeof o === "object" && o[dateStr] != null ? o[dateStr] : "";
    setReflectionDraft(t);
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    const title = evTitle.trim();
    if (!title) return;
    if (auth.isCloud) {
      addEventMut.mutate(
        {
          event_date: selectedDate,
          event_time: timeToApi(evTime),
          title,
          event_type: evType,
        },
        {
          onSuccess: () => setEvTitle(""),
          onError: (err) => alert(err.message),
        }
      );
      return;
    }
    luna.setEvents([...events, { id: newId(), date: selectedDate, time: evTime, title, type: evType }]);
    setEvTitle("");
  };

  const removeEvent = (eid) => {
    if (!confirm("Remove this event?")) return;
    if (auth.isCloud) {
      delEventMut.mutate(eid, { onError: (err) => alert(err.message) });
      return;
    }
    luna.setEvents(events.filter((x) => x.id !== eid));
  };

  const saveReflection = () => {
    if (!selectedDate) return;
    const o = luna.getReflections();
    const next = typeof o === "object" && o ? { ...o } : {};
    next[selectedDate] = reflectionDraft.trim();
    luna.setReflections(next);
  };

  const calPrev = () => {
    let m = calMonth - 1;
    let y = calYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  const calNext = () => {
    let m = calMonth + 1;
    let y = calYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  const [sportType, setSportType] = useState("Yoga");
  const [sportDuration, setSportDuration] = useState("");
  const [sportDate, setSportDate] = useState(todayStr());

  const logSport = (e) => {
    e.preventDefault();
    const duration = parseInt(sportDuration, 10) || 0;
    if (!sportDate || duration <= 0) return;
    if (auth.isCloud) {
      logSportMut.mutate(
        { log_date: sportDate, activity: sportType, duration_min: duration },
        {
          onSuccess: () => {
            setSportDuration("");
            setSportDate(todayStr());
          },
          onError: (err) => alert(err.message),
        }
      );
      return;
    }
    luna.setSport([...luna.getSport(), { id: newId(), type: sportType, duration, date: sportDate }]);
    setSportDuration("");
    setSportDate(todayStr());
  };

  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");
  const [sleepDate, setSleepDate] = useState(todayStr());

  const logSleep = (e) => {
    e.preventDefault();
    if (!sleepStart || !sleepEnd || !sleepDate) return;
    const s = sleepStart.split(":").map(Number);
    const e2 = sleepEnd.split(":").map(Number);
    let mins = e2[0] * 60 + e2[1] - (s[0] * 60 + s[1]);
    if (mins <= 0) mins += 24 * 60;
    const hours = parseFloat((mins / 60).toFixed(1));
    if (auth.isCloud) {
      logSleepMut.mutate(
        {
          log_date: sleepDate,
          bed_time: sleepStart.length === 5 ? `${sleepStart}:00` : sleepStart,
          wake_time: sleepEnd.length === 5 ? `${sleepEnd}:00` : sleepEnd,
          hours,
        },
        {
          onSuccess: () => {
            setSleepStart("");
            setSleepEnd("");
            setSleepDate(todayStr());
          },
          onError: (err) => alert(err.message),
        }
      );
      return;
    }
    luna.setSleep([
      ...luna.getSleep(),
      { id: newId(), date: sleepDate, start: sleepStart, end: sleepEnd, hours: String(hours) },
    ]);
    setSleepStart("");
    setSleepEnd("");
    setSleepDate(todayStr());
  };

  const sportList = auth.isCloud
    ? (sportQ.data ?? []).slice().reverse().slice(0, 20)
    : luna.getSport().slice().reverse().slice(0, 20);
  const sleepList = auth.isCloud
    ? (sleepQ.data ?? []).slice().reverse().slice(0, 14)
    : luna.getSleep().slice().reverse().slice(0, 14);

  const cloudBusy = auth.isCloud && (eventsQ.isPending || sleepQ.isPending || sportQ.isPending);

  return (
    <section className="page page-planner active">
      <div className="section-head">
        <h2 className="section-title">Plan &amp; wellness</h2>
        <p className="section-desc">Your day, your rhythm. Schedule, reflect, and track what supports you.</p>
      </div>
      {cloudBusy && (
        <p className="hint" style={{ marginBottom: "1rem" }}>
          Syncing planner…
        </p>
      )}

      <div className="card card-calendar">
        <div className="cal-header">
          <h3 className="cal-title">
            {MONTH_NAMES[calMonth]} {calYear}
          </h3>
          <div className="cal-nav">
            <button type="button" className="btn-icon" aria-label="Previous month" onClick={calPrev}>
              ‹
            </button>
            <button type="button" className="btn-icon" aria-label="Next month" onClick={calNext}>
              ›
            </button>
          </div>
        </div>
        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">
              {w}
            </div>
          ))}
        </div>
        <div className="cal-days">
          {cells.map(({ d, dateStr, other }) => {
            const hasEv = events.some((ev) => ev.date === dateStr);
            let cls = "cal-day";
            if (other) cls += " other-month";
            if (dateStr === today) cls += " today";
            if (hasEv) cls += " has-events";
            return (
              <button key={`${dateStr}-${d}`} type="button" className={cls} onClick={() => openDay(dateStr)}>
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="card day-detail">
          <h3 className="card-title">
            {MONTH_NAMES[parseInt(selectedDate.split("-")[1], 10) - 1]} {parseInt(selectedDate.split("-")[2], 10)}
          </h3>
          <div className="day-events">
            {dayEvents.length === 0 ? (
              <p className="hint">Nothing scheduled yet. Add something above.</p>
            ) : (
              dayEvents.map((ev) => (
                <div key={ev.id} className="day-event">
                  <span className="day-event-main">
                    <span className="day-event-time">{ev.time}</span> <span className="day-event-title">{ev.title}</span>
                  </span>
                  <button
                    type="button"
                    className="day-event-del"
                    onClick={() => removeEvent(ev.id)}
                    disabled={auth.isCloud && delEventMut.isPending}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <form className="form form-inline" onSubmit={addEvent}>
            <input
              type="time"
              className="input input-sm"
              value={evTime}
              onChange={(e) => setEvTime(e.target.value)}
              required
            />
            <input
              type="text"
              className="input input-sm"
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="Event"
              required
            />
            <select className="input input-sm" value={evType} onChange={(e) => setEvType(e.target.value)}>
              <option value="default">General</option>
              <option value="yoga">Yoga</option>
              <option value="gym">Workout</option>
              <option value="study">Study</option>
              <option value="sleep">Rest</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={auth.isCloud && addEventMut.isPending}>
              Add
            </button>
          </form>
          <div className="form-row">
            <label>Today’s reflection</label>
            <textarea
              className="input"
              value={reflectionDraft}
              onChange={(e) => setReflectionDraft(e.target.value)}
              placeholder="How did today go? A few lines is enough."
              rows={3}
            />
          </div>
          <button type="button" className="btn btn-soft" onClick={saveReflection}>
            Save reflection
          </button>
          <p className="hint" style={{ marginTop: 8 }}>
            Reflections stay on this device until we add a notes API.
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Movement</h3>
        <p className="card-hint">Log sessions to see your week at a glance on Home.</p>
        <form className="form form-row-inline" onSubmit={logSport}>
          <select className="input input-sm" value={sportType} onChange={(e) => setSportType(e.target.value)}>
            <option value="Yoga">Yoga</option>
            <option value="Run">Run</option>
            <option value="Gym">Gym</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="number"
            className="input input-sm"
            value={sportDuration}
            onChange={(e) => setSportDuration(e.target.value)}
            placeholder="min"
            min="1"
          />
          <input
            type="date"
            className="input input-sm"
            value={sportDate}
            onChange={(e) => setSportDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={auth.isCloud && logSportMut.isPending}>
            Log
          </button>
        </form>
        <ul className="log-list">
          {sportList.length === 0 ? (
            <li className="hint">No sessions yet. Log one above.</li>
          ) : (
            sportList.map((s) => (
              <li key={s.id}>
                {s.type} {s.duration || 0} min · {s.date}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="card">
        <h3 className="card-title">Sleep</h3>
        <p className="card-hint">Track rest to spot patterns and protect your energy.</p>
        <form className="form form-row-inline" onSubmit={logSleep}>
          <input
            type="time"
            className="input input-sm"
            value={sleepStart}
            onChange={(e) => setSleepStart(e.target.value)}
          />
          <input
            type="time"
            className="input input-sm"
            value={sleepEnd}
            onChange={(e) => setSleepEnd(e.target.value)}
          />
          <input
            type="date"
            className="input input-sm"
            value={sleepDate}
            onChange={(e) => setSleepDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={auth.isCloud && logSleepMut.isPending}>
            Save
          </button>
        </form>
        <ul className="log-list">
          {sleepList.length === 0 ? (
            <li className="hint">No entries yet. Log last night above.</li>
          ) : (
            sleepList.map((s) => (
              <li key={s.id}>
                {s.start} → {s.end} · {s.hours} hrs · {s.date}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
