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

**打开：** https://lindsay522.github.io/luna-app/

推送到 `main` 后，Actions 会执行 `npm run build`，并把 **`dist`** 推到分支 **`gh-pages`**（不是直接用源码里的 `index.html`，否则浏览器打不开 React）。

### 第一次要在 GitHub 上选分支（很重要）

1. 打开：https://github.com/Lindsay522/luna-app/settings/pages  
2. **Build and deployment** → Source：**Deploy from a branch**  
3. **Branch** 选 **`gh-pages`**，文件夹选 **`/(root)`**，保存。  
4. 等 1～2 分钟，再打开上面的链接。

若看不到 `gh-pages` 分支：先到 **Actions** 里等 **Deploy to GitHub Pages** 跑成功一次。

**本地开发**仍是 `npm run dev` → http://localhost:5173/（和线上路径无关）。

## Data

Uses the same browser `localStorage` keys as the static English build (`luna_*_en`), so JSON backups stay compatible.

## What’s included

Dashboard, wardrobe, outfits, calendar & reflection, movement & sleep logs, focus spaces with timer, export/import backup.

Package name: `lunar-app` (see `package.json`).
