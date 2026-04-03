import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { useLuna } from "../../hooks/useLuna.js";
import { newId } from "../../lib/newId.js";
import { OUTFIT_PROMPTS } from "../../lib/constants.js";
import { api } from "../../api/client.js";
import { closetFromApi, outfitFromApi } from "../../api/lunaMaps.js";
import { todayStr } from "../../lib/dates.js";

const OCCASIONS = ["Class", "Date", "Cafe", "Interview", "Workout", "Travel", "Other"];
const WEATHER = ["Spring-Fall", "Summer", "Winter"];

export function Outfits() {
  const luna = useLuna();
  const auth = useAuth();
  const qc = useQueryClient();

  const closetQ = useQuery({
    queryKey: ["closet"],
    queryFn: async () => {
      const rows = await api("/closet");
      return rows.map(closetFromApi);
    },
    enabled: auth.isCloud,
  });

  const outfitsQ = useQuery({
    queryKey: ["outfits"],
    queryFn: async () => {
      const rows = await api("/outfits");
      return rows.map(outfitFromApi);
    },
    enabled: auth.isCloud,
  });

  const createOutfitMut = useMutation({
    mutationFn: (body) => api("/outfits", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
  });

  const deleteOutfitMut = useMutation({
    mutationFn: (id) => api(`/outfits/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
  });

  const wearMut = useMutation({
    mutationFn: (body) => api("/wellness/outfit-worn", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    },
  });

  const closet = auth.isCloud ? closetQ.data ?? [] : luna.getCloset();
  const outfits = auth.isCloud ? outfitsQ.data ?? [] : luna.getOutfits();

  const [name, setName] = useState("");
  const [namePh, setNamePh] = useState("e.g. Monday meetings");
  const [occasion, setOccasion] = useState("Class");
  const [weather, setWeather] = useState("Spring-Fall");
  const [mood, setMood] = useState("");
  const [picked, setPicked] = useState({});
  const [onePieceId, setOnePieceId] = useState("");

  const idToName = {};
  closet.forEach((c) => {
    idToName[c.id] = c.name;
  });

  let suggestion = "";
  if (onePieceId) {
    const item = closet.find((c) => String(c.id) === String(onePieceId));
    if (item) {
      const matches = closet.filter(
        (c) => String(c.id) !== String(onePieceId) && (c.season === item.season || c.category !== item.category)
      );
      suggestion = "Pair with pieces from other categories (e.g. top + bottom) and similar season. ";
      if (matches.length) suggestion += `Try: ${matches.slice(0, 5).map((m) => m.name).join(", ")}`;
    }
  }

  const togglePick = (id) => {
    const key = String(id);
    setPicked((p) => ({ ...p, [key]: !p[key] }));
  };

  const onSaveOutfit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const itemIds = Object.keys(picked).filter((id) => picked[id]);
    if (auth.isCloud) {
      createOutfitMut.mutate(
        {
          name: n,
          occasion,
          weather,
          mood: mood.trim() || null,
          item_ids: itemIds.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x)),
        },
        {
          onSuccess: () => {
            setName("");
            setMood("");
            setPicked({});
          },
          onError: (err) => alert(err.message),
        }
      );
      return;
    }
    luna.setOutfits([
      ...outfits,
      {
        id: newId(),
        name: n,
        occasion,
        weather,
        mood: mood.trim(),
        itemIds,
      },
    ]);
    setName("");
    setMood("");
    setPicked({});
  };

  const removeOutfit = (id) => {
    if (!confirm("Remove this outfit?")) return;
    if (auth.isCloud) {
      deleteOutfitMut.mutate(id, { onError: (err) => alert(err.message) });
      return;
    }
    luna.setOutfits(outfits.filter((o) => o.id !== id));
  };

  const logWear = (outfitId) => {
    wearMut.mutate(
      { outfit_id: outfitId, worn_date: todayStr(), notes: null },
      { onError: (err) => alert(err.message) }
    );
  };

  const applyPrompt = (key) => {
    const p = OUTFIT_PROMPTS[key];
    if (!p) return;
    setNamePh(p.name);
    setOccasion(p.occasion);
  };

  const cloudLoading = auth.isCloud && (closetQ.isPending || outfitsQ.isPending);
  const cloudErr = auth.isCloud && (closetQ.isError || outfitsQ.isError);

  return (
    <section className="page page-outfit active">
      <div className="section-head">
        <h2 className="section-title">Outfits</h2>
        <p className="section-desc">Save looks, get pairing ideas, and plan what to wear.</p>
      </div>
      {cloudLoading && (
        <p className="hint" style={{ marginBottom: "1rem" }}>
          Loading outfits…
        </p>
      )}
      {cloudErr && (
        <p className="hint" style={{ marginBottom: "1rem", color: "var(--danger, #c0392b)" }}>
          Could not sync outfits. Check your connection and account.
        </p>
      )}
      <div className="card">
        <h3 className="card-title">Quick prompts</h3>
        <div className="outfit-prompts">
          {Object.keys(OUTFIT_PROMPTS).map((key) => (
            <button key={key} type="button" className="chip" onClick={() => applyPrompt(key)}>
              {key === "today" && "What to wear today"}
              {key === "onepiece" && "Build around one piece"}
              {key === "campus" && "Campus look"}
              {key === "interview" && "Interview ready"}
              {key === "weekend" && "Weekend reset"}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="card-title">New outfit</h3>
        <form className="form" onSubmit={onSaveOutfit}>
          <div className="form-row">
            <label>Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePh}
              required
            />
          </div>
          <div className="form-row form-row-half">
            <label>Occasion</label>
            <select className="input" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row form-row-half">
            <label>Season</label>
            <select className="input" value={weather} onChange={(e) => setWeather(e.target.value)}>
              <option value="Spring-Fall">Spring / Fall</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
            </select>
          </div>
          <div className="form-row">
            <label>Items</label>
            <div className="outfit-picker">
              {closet.length === 0 ? (
                <p className="hint">Add pieces in Wardrobe first.</p>
              ) : (
                closet.map((c) => (
                  <label key={c.id}>
                    <input type="checkbox" checked={!!picked[String(c.id)]} onChange={() => togglePick(c.id)} /> {c.name}{" "}
                    ({c.category})
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="form-row">
            <label>Vibe or notes</label>
            <input
              type="text"
              className="input"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g. Confident, minimal, cozy"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={auth.isCloud && createOutfitMut.isPending}>
            Save outfit
          </button>
        </form>
      </div>
      <div className="card">
        <h3 className="card-title">Style one piece</h3>
        <p className="hint">Pick an item and we’ll suggest pairings from your wardrobe.</p>
        <select className="input" value={onePieceId} onChange={(e) => setOnePieceId(e.target.value)}>
          <option value="">Choose a piece…</option>
          {closet.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.category}
            </option>
          ))}
        </select>
        <div className="one-piece-suggestions">{suggestion}</div>
      </div>
      {outfits.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No outfits yet</p>
          <p className="empty-state-desc">Create one above. Your future self will thank you on busy mornings.</p>
        </div>
      ) : (
        <div className="outfit-list">
          {outfits.map((o) => {
            const ids = o.itemIds || [];
            const names = ids.map((id) => idToName[id] || id);
            return (
              <div key={o.id} className="outfit-card" data-outfit-id={o.id}>
                <div className="outfit-card-head">
                  <div className="outfit-card-name">{o.name}</div>
                  <div className="outfit-card-actions">
                    {auth.isCloud && (
                      <button
                        type="button"
                        className="btn btn-soft btn-sm"
                        onClick={() => logWear(o.id)}
                        disabled={wearMut.isPending}
                      >
                        Wore today
                      </button>
                    )}
                    <button
                      type="button"
                      className="outfit-card-del"
                      aria-label="Remove outfit"
                      onClick={() => removeOutfit(o.id)}
                      disabled={auth.isCloud && deleteOutfitMut.isPending}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="outfit-card-meta">
                  {o.occasion} · {o.weather}
                  {o.mood ? ` · ${o.mood}` : ""}
                </div>
                <div className="outfit-card-items">{names.length ? names.join(", ") : "—"}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
