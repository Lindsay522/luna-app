# Luna

Small web app I’m building for wardrobe, planning, sleep/movement logs, mood, and short focus timers. It’s meant to feel calm on a phone.

**Try it:** https://lindsay522.github.io/luna-app/  
**Code:** https://github.com/Lindsay522/luna-app  

The npm package is called `lunar-app` because that name was free on npm — the product name in the UI is still Luna.

There’s also a **FastAPI** backend I run when I want accounts + data on a server (not required to click around the demo). Point the front end at it with `VITE_API_URL` (see below). I keep that backend in a separate folder on my machine; it’s not part of this repo.

## What’s in the app

Wardrobe and outfits, a month calendar with events, movement + sleep logging, little “focus room” overlays with 10 or 25 minute timers, export/import of JSON backup, and optional sign-in so stuff can live on the API instead of only `localStorage`.

## Stack

React (Vite), TanStack Query for anything that hits the API, Recharts for a few charts when you’re logged in. Routing is hash-based so GitHub Pages doesn’t need fancy server rules.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173  

```bash
npm run build
npm run lint
```

## Hooking up the API (optional)

Copy `.env.development` or add:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

If you deploy the static site somewhere public and want it to talk to a real API, set the same variable in whatever builds the site. Your API has to allow that origin in CORS (for Pages, something like `https://lindsay522.github.io`).

## Deploy (GitHub Pages)

Pushing to `main` runs the workflow in `.github/workflows/deploy-pages.yml`, which builds and pushes `dist` to the `gh-pages` branch. In the repo settings, Pages should use branch **gh-pages** and folder **/ (root)**. Production build uses base path `/luna-app/` so the live URL is `https://<user>.github.io/luna-app/`.

## Data

Most things save in the browser unless you’re signed in. Reflection text is still local-only. Designed by Lindsay.
