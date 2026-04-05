# Luna — Lifestyle, Wardrobe & Wellness

**Luna** is a calm, mobile-first web app for **wardrobe**, **daily planning**, **wellness logs** (sleep, movement, mood), and **short focus sessions** with timers.  
The UI brand is *Luna*; the npm package name is `lunar-app`.

| For reviewers | Link |
|----------------|------|
| **Live demo** | [lindsay522.github.io/luna-app](https://lindsay522.github.io/luna-app/) |
| **Source (this repo)** | [github.com/Lindsay522/luna-app](https://github.com/Lindsay522/luna-app) |
| **Backend (FastAPI)** | Optional companion API (`luna-platform/backend` in a monorepo, or your own deployed copy). The SPA uses `VITE_API_URL`; see the **Luna Platform** README in the same portfolio tree if you have it. |

---

## What it does

- **Dashboard** — greeting, sleep/movement snapshot, mood check-in, optional analytics when signed in  
- **Wardrobe** — add/filter clothing items by category and season  
- **Outfits** — save looks, quick prompts, “wear today” log when using the API  
- **Plan & wellness** — month calendar, events, reflections (stored locally), movement and sleep logs  
- **Focus spaces** — room-themed overlays with **10 / 25 minute** timers; completed sessions can sync to the API  
- **Settings** — export/import JSON backup, clear local data, **sign in** to connect a FastAPI backend  
- **Cloud mode** — after login, data reads/writes go to the API; you can **import prior local-only data** via the on-screen prompt (fingerprinted to avoid duplicate uploads)

---

## Tech stack

- **React 19** + **Vite 8**
- **TanStack Query** for server state
- **Recharts** for analytics charts (when signed in)
- **Hash routing** (no server rewrite needed on GitHub Pages)
- **localStorage** for offline-first keys (`luna_*_en`) + **sessionStorage** for JWT when using the API

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (dev uses base path `/`).

```bash
npm run build   # output: dist/
npm run preview # optional: test production build
npm run lint
```

---

## Environment variables

| Variable | When | Example |
|----------|------|---------|
| `VITE_API_URL` | Point the app at your API | `http://127.0.0.1:8000/api/v1` |

For local development, create **`.env.development`** (this repo includes an example):

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Production / GitHub Pages: set `VITE_API_URL` in your host’s build settings if you deploy the SPA with a **public** API (same variable name). If unset, requests default to path `/api/v1` (only works if you add a reverse proxy).

**CORS:** your API must allow the Pages origin (e.g. `https://lindsay522.github.io`). See the backend `.env.example` (`CORS_ORIGINS`).

---

## GitHub Pages (how this repo deploys)

- **Workflow:** [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) — on push to `main`, runs `npm ci` + `npm run build` and publishes **`dist`** to branch **`gh-pages`**.  
- **Vite** production `base` is `/luna-app/` so assets load under `https://<user>.github.io/luna-app/`.

**One-time GitHub settings**

1. Repo → **Settings** → **Pages**  
2. **Build and deployment** → Source: **Deploy from a branch**  
3. Branch: **`gh-pages`**, folder: **`/ (root)`**  
4. Wait a minute after the first successful **Actions** run if `gh-pages` did not exist yet.

Local dev is unchanged (`npm run dev`); only production builds use the `/luna-app/` base path.

---

## Data & privacy

- **Offline:** JSON in `localStorage`; you can **export/import** a backup from Settings.  
- **Signed in:** Bearer token in `sessionStorage`; wardrobe/wellness/analytics hit your API.  
- **Reflections** (“today’s reflection” text) stay **browser-only** until a notes API exists.

---

## Repository layout (high level)

```
src/
  api/           # fetch client + field maps (local ↔ API)
  components/    # layout, onboarding, room overlay, cloud sync prompt, pages
  context/       # LunaProvider (local), AuthProvider (JWT)
  hooks/         # useLuna, useAuth, hash route
  lib/           # dates, storage helpers, constants
  sync/          # local → cloud migration + fingerprint state
```

---

## Credits

Designed by **Lindsay**.  
Package name: `lunar-app` (`package.json`).
