import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../hooks/useAuth.js";
import { useLuna } from "../../hooks/useLuna.js";
import { todayStr, getMonday } from "../../lib/dates.js";
import { api } from "../../api/client.js";

const ENERGY = [
  { key: "low", label: "Tired" },
  { key: "ok", label: "Okay" },
  { key: "good", label: "Good" },
  { key: "great", label: "Great" },
];

function pickInsight(mood) {
  const lines = [
    "A small step today is still progress. Be kind to yourself.",
    "You don’t have to do it all. Just the next right thing.",
    "Rest is part of the plan.",
    "Your best today might look different from yesterday. That’s okay.",
  ];
  if (mood === "low" || mood === "ok") lines.push("It’s okay to take things slow. You’re still moving.");
  if (mood === "good" || mood === "great") lines.push("You’re in a good place. Use it gently.");
  return lines[Math.floor(Math.random() * lines.length)];
}

export function Dashboard({ navigate }) {
  const luna = useLuna();
  const auth = useAuth();
  const qc = useQueryClient();
  const today = todayStr();

  const summaryQ = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api("/analytics/summary"),
    enabled: auth.isCloud,
  });

  const trendsQ = useQuery({
    queryKey: ["analytics-trends"],
    queryFn: () => api("/analytics/trends?weeks=8"),
    enabled: auth.isCloud,
  });

  const recOutfitsQ = useQuery({
    queryKey: ["rec-outfits"],
    queryFn: () => api("/recommendations/outfits?limit=5"),
    enabled: auth.isCloud,
  });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateLine = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const focus = luna.getFocus();
  const mood = typeof focus === "object" && focus[today] ? focus[today] : null;

  const insight = useMemo(() => pickInsight(mood), [mood]);

  const summary = summaryQ.data;

  const sleepList = luna.getSleep().slice();
  sleepList.sort((a, b) => {
    const da = (a.date || "").localeCompare(b.date || "");
    if (da !== 0) return -da;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
  const lastSleep = sleepList[0];

  let sleepLabel = "—";
  if (auth.isCloud && summary && summary.sleep_avg_hours != null) {
    sleepLabel = `${summary.sleep_avg_hours} hrs avg (30d)`;
  } else if (lastSleep) {
    sleepLabel = `${lastSleep.hours || "—"} hrs`;
  }

  const sportList = luna.getSport();
  const mon = getMonday(new Date());
  const weekSport = sportList.filter((s) => getMonday(new Date(s.date)).getTime() === mon.getTime());
  const mins = weekSport.reduce((sum, s) => sum + (s.duration || 0), 0);

  let moveLabel = "—";
  if (auth.isCloud && summary && summary.sport_total_minutes != null) {
    moveLabel = `${summary.sport_total_minutes} min total (30d)`;
  } else if (weekSport.length === 0 && mins === 0) {
    moveLabel = "—";
  } else {
    moveLabel = `${weekSport.length} sessions · ${mins} min`;
  }

  const setEnergy = async (key) => {
    const o = luna.getFocus();
    const next = typeof o === "object" && o ? { ...o } : {};
    next[todayStr()] = key;
    luna.setFocus(next);
    if (auth.isCloud) {
      try {
        await api("/wellness/mood", {
          method: "POST",
          body: JSON.stringify({ entry_date: today, energy: key }),
        });
        await qc.invalidateQueries({ queryKey: ["analytics-summary"] });
      } catch {
        /* offline or validation */
      }
    }
  };

  const trendData = trendsQ.data?.series ?? [];
  const chartReady = auth.isCloud && trendData.length > 0;

  return (
    <section className="page page-dashboard active">
      <div className="dashboard-hero">
        <p className="dashboard-greeting">{greeting}</p>
        <p className="dashboard-date">{dateLine}</p>
        <p className="dashboard-subline">Here’s what matters today.</p>
      </div>
      <div className="dashboard-cards">
        <div className="card dashboard-card-mini card-sleep">
          <h3 className="card-label">{auth.isCloud ? "Sleep (30d)" : "Last night"}</h3>
          <p className="card-value">{sleepLabel}</p>
          <p className="card-hint">Sleep</p>
        </div>
        <div className="card dashboard-card-mini card-movement">
          <h3 className="card-label">{auth.isCloud ? "Movement (30d)" : "This week"}</h3>
          <p className="card-value">{moveLabel}</p>
          <p className="card-hint">Movement</p>
        </div>
      </div>
      {auth.isCloud && summaryQ.isPending && <p className="hint">Loading analytics…</p>}
      {auth.isCloud && summary && (
        <div className="card card-focus" style={{ marginTop: 12 }}>
          <h3 className="card-label">Focus sessions (30d)</h3>
          <p className="card-value" style={{ fontSize: "1.25rem", marginTop: 8 }}>
            {summary.focus_completed_sessions ?? 0}
          </p>
          {summary.corr_sleep_vs_focus_minutes != null && (
            <p className="card-hint" style={{ marginTop: 8 }}>
              Sleep ↔ focus correlation: {summary.corr_sleep_vs_focus_minutes.toFixed(2)}
            </p>
          )}
          {Array.isArray(summary.top_outfits_worn) && summary.top_outfits_worn.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p className="card-hint">Top worn outfits</p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: "0.9rem" }}>
                {summary.top_outfits_worn.map((row) => (
                  <li key={row.outfit_id}>
                    {row.name} · {row.count}×
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {chartReady && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 className="card-label">Sleep trend (weekly avg)</h3>
          <div style={{ width: "100%", height: 220, marginTop: 12 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--ink-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--ink-muted)" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)" }}
                  labelStyle={{ color: "var(--ink)" }}
                />
                <Line type="monotone" dataKey="hours" stroke="var(--accent, #7c6cf0)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {auth.isCloud && recOutfitsQ.data?.suggestions?.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 className="card-label">Suggested outfits</h3>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: "0.9rem" }}>
            {recOutfitsQ.data.suggestions.map((s) => (
              <li key={s.outfit_id ?? s.name}>{s.name}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="card card-focus">
        <h3 className="card-label">How are you feeling?</h3>
        <div className="focus-options">
          {ENERGY.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`focus-btn${mood === key ? " active" : ""}`}
              onClick={() => setEnergy(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="dashboard-insight">
        <span>{insight}</span>
      </div>
      <div className="card card-tomorrow">
        <h3 className="card-label">First thing tomorrow</h3>
        <p className="card-hint">One small win to make the morning easier.</p>
        <input
          key={`tomorrow-${luna.version}`}
          type="text"
          className="input input-inline"
          defaultValue={luna.getTomorrow()}
          onBlur={(e) => luna.setTomorrow(e.target.value.trim())}
          placeholder="e.g. Drink water, then open my notes"
        />
      </div>
      <div className="dashboard-actions">
        <button type="button" className="btn btn-soft" onClick={() => navigate("planner")}>
          Today’s plan
        </button>
        <button type="button" className="btn btn-soft" onClick={() => navigate("closet")}>
          Wardrobe
        </button>
        <button type="button" className="btn btn-soft" onClick={() => navigate("rooms")}>
          Focus space
        </button>
      </div>
      <p className="dashboard-copy">You’re doing enough.</p>
      <footer className="app-footer">
        <p className="app-footer-credit">
          Designed by <strong>Lindsay</strong>
        </p>
      </footer>
    </section>
  );
}
