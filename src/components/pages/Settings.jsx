import { useState } from "react";
import { applyImportStores, clearAllLunaKeys, exportBackupFile } from "../../lib/lunaStorage.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getApiBase } from "../../api/client.js";

export function Settings() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const stores = data?.stores;
        if (!stores || typeof stores !== "object") {
          alert("This file doesn’t look like a Luna backup.");
          return;
        }
        if (!confirm("Replace all Luna data in this browser with the backup? This cannot be undone.")) return;
        applyImportStores(stores);
        window.location.reload();
      } catch {
        alert("Could not read that file. Check that it’s valid JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(f);
  };

  const onClear = () => {
    if (!confirm("Delete all Luna data on this device? Wardrobe, outfits, plans, and logs will be gone."))
      return;
    clearAllLunaKeys();
    window.location.reload();
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      await auth.login(email.trim(), password);
      setPassword("");
    } catch (err) {
      alert(err?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await auth.register(email.trim(), password);
      setPassword("");
    } catch (err) {
      alert(err?.message ?? "Could not register");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = () => {
    auth.logout();
  };

  return (
    <section className="page page-settings active">
      <div className="section-head">
        <h2 className="section-title">About Luna</h2>
        <p className="section-desc">A lifestyle app for wardrobe, planning, wellness, and focus.</p>
      </div>
      <div className="card">
        <div className="settings-row">
          <span>App</span>
          <span>Lunar app</span>
        </div>
        <div className="settings-row">
          <span>Version</span>
          <span>2.0 · React</span>
        </div>
        <div className="settings-row">
          <span>Data</span>
          <span>{auth.isCloud ? "Saving to my API when you’re signed in" : "Just this browser (localStorage)"}</span>
        </div>
        <div className="settings-row">
          <span>API base</span>
          <span style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{getApiBase()}</span>
        </div>
        <div className="settings-row">
          <span>Built with</span>
          <span>Vite + React</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Account</h3>
        <p className="card-hint">
          Optional: sign in if you’re running the FastAPI server and want data off this laptop. Everything still works
          offline without an account.
        </p>
        {auth.isCloud ? (
          <div className="settings-account">
            <p className="settings-email">
              Signed in as <strong>{auth.user?.email}</strong>
            </p>
            <button type="button" className="btn btn-soft" onClick={onLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <form className="form" onSubmit={onLogin}>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
              />
            </div>
            <div className="settings-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Sign in
              </button>
              <button type="button" className="btn btn-soft" disabled={busy} onClick={onRegister}>
                Create account
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Your data</h3>
        <p className="card-hint">
          Export a backup, restore on another device, or reset the app. Import replaces all Luna data in this browser.
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-soft" onClick={exportBackupFile}>
            Export backup
          </button>
          <label className="btn btn-soft settings-file-label">
            Import backup
            <input type="file" accept="application/json" className="visually-hidden" onChange={onImport} />
          </label>
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            Clear all data
          </button>
        </div>
      </div>
      <div className="settings-credit-block">
        <p className="settings-credit-text">Designed with care</p>
        <p className="settings-credit-name">Designed by Lindsay</p>
      </div>
    </section>
  );
}
