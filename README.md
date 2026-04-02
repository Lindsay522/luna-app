# Lunar app (React)

**Repository:** [github.com/Lindsay522/luna-app](https://github.com/Lindsay522/luna-app)

**Lunar** — wardrobe, plan, wellness, and focus (UI brand: **Luna**). This repo is the **Vite + React** app.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is in `dist/`.

## Public URL (GitHub Pages)

After you push to `main`, GitHub Actions builds and deploys automatically.

**Live site:** https://lindsay522.github.io/luna-app/

**One-time setup on GitHub:** open the repo → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions** (not “Deploy from a branch”). The workflow `.github/workflows/deploy-pages.yml` will run on every push to `main`.

**Local dev** still uses root `/` (`npm run dev` → http://localhost:5173/). Production build uses base path `/luna-app/` so assets load correctly on Pages.

## Data

Uses the same browser `localStorage` keys as the static English build (`luna_*_en`), so JSON backups stay compatible.

## What’s included

Dashboard, wardrobe, outfits, calendar & reflection, movement & sleep logs, focus spaces with timer, export/import backup.

Package name: `lunar-app` (see `package.json`).
