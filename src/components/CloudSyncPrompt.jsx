import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLuna } from "../hooks/useLuna.js";
import {
  dismissForSession,
  isSessionDismissed,
  shouldOfferCloudSync,
} from "../sync/migrationState.js";
import { syncLocalDataToCloud } from "../sync/syncLocalToCloud.js";

const STEPS = ["closet", "outfits", "events", "sleep", "sport", "mood", "focusSessions"];

export function CloudSyncPrompt() {
  const auth = useAuth();
  const luna = useLuna();
  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ step: "", index: 0, total: STEPS.length, detail: "" });
  const [result, setResult] = useState(null);

  const email = auth.user?.email ?? "";

  useEffect(() => {
    if (!auth.isCloud || !email || auth.loading) {
      setVisible(false);
      return;
    }
    const offer =
      shouldOfferCloudSync(email) && !isSessionDismissed();
    setVisible(offer);
    if (offer) setResult(null);
  }, [auth.isCloud, auth.loading, email, luna.version]);

  const invalidateAll = useCallback(async () => {
    await qc.invalidateQueries();
  }, [qc]);

  const onConfirm = async () => {
    if (!email) return;
    setBusy(true);
    setResult(null);
    setProgress({ step: "closet", index: 0, total: STEPS.length, detail: "Starting…" });
    try {
      const out = await syncLocalDataToCloud(api, {
        userEmail: email,
        onProgress: ({ step, index, total, detail }) => {
          setProgress({ step, index, total, detail: detail ?? "" });
        },
      });
      if (out.ok) {
        luna.bump();
        await invalidateAll();
        setVisible(false);
      } else {
        setResult(out);
      }
    } catch (e) {
      setResult({
        ok: false,
        errors: [{ step: "sync", message: e?.message || String(e) }],
        counts: {},
      });
    } finally {
      setBusy(false);
    }
  };

  const onLater = () => {
    dismissForSession();
    setVisible(false);
  };

  const onTryAgain = () => {
    setResult(null);
    setVisible(true);
  };

  const onDismissResult = () => {
    dismissForSession();
    setResult(null);
    setVisible(false);
  };

  const showPrompt = visible && !result;
  const showError = result && !result.ok;
  if (!showPrompt && !showError) return null;

  return (
    <>
      {showPrompt && (
        <div className="cloud-sync-overlay" role="dialog" aria-modal="true" aria-labelledby="cloud-sync-title">
          <div className="cloud-sync-modal">
            <h2 id="cloud-sync-title" className="cloud-sync-title">
              Upload this browser’s data?
            </h2>
            <p className="cloud-sync-desc">
              Looks like you still have Luna saved only on this device. Want to copy it to your account? This pops up
              again if your local data changes.
            </p>
            <ul className="cloud-sync-list">
              <li>Wardrobe &amp; outfits</li>
              <li>Planner events</li>
              <li>Sleep, movement, mood, focus sessions</li>
            </ul>
            {busy && (
              <div className="cloud-sync-progress" aria-live="polite">
                <div className="cloud-sync-progress-bar-wrap">
                  <div
                    className="cloud-sync-progress-bar"
                    style={{
                      width: `${Math.min(100, ((progress.index + 1) / progress.total) * 100)}%`,
                    }}
                  />
                </div>
                <p className="cloud-sync-progress-label">
                  {progress.detail || `Step ${progress.index + 1} / ${progress.total}`}
                </p>
              </div>
            )}
            <div className="cloud-sync-actions">
              <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
                {busy ? "Uploading…" : "Yes, upload"}
              </button>
              <button type="button" className="btn btn-soft" onClick={onLater} disabled={busy}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="cloud-sync-overlay" role="dialog" aria-modal="true" aria-labelledby="cloud-sync-result-title">
          <div className="cloud-sync-modal cloud-sync-modal--result">
            <h2 id="cloud-sync-result-title" className="cloud-sync-title">
              Didn’t all go through
            </h2>
            <p className="cloud-sync-desc">
              A few things failed on the server. Nothing was deleted here — you can fix whatever broke and try again.
            </p>
            <ul className="cloud-sync-errors">
              {result.errors.slice(0, 12).map((e, i) => (
                <li key={`${e.step}-${i}`}>
                  <strong>{e.step}</strong>: {e.message}
                </li>
              ))}
              {result.errors.length > 12 && <li>…and more</li>}
            </ul>
            <div className="cloud-sync-counts">
              {STEPS.map((k) => (
                <span key={k} className="cloud-sync-count-pill">
                  {k}: {result.counts[k] ?? 0}
                </span>
              ))}
            </div>
            <div className="cloud-sync-actions cloud-sync-actions--stack">
              <button type="button" className="btn btn-primary" onClick={onTryAgain}>
                Try again
              </button>
              <button type="button" className="btn btn-soft" onClick={onDismissResult}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
