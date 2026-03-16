# 发布 Luna 到 GitHub，得到所有人都能打开的链接

按下面做一次，就能得到类似 **https://你的用户名.github.io/luna-app/** 的公开链接。

---

## 第一步：在 GitHub 上建一个新仓库

1. 打开：**https://github.com/new**
2. **Repository name** 填：`luna-app`（或你喜欢的英文名）
3. 选 **Public**
4. **不要**勾选 "Add a README" / ".gitignore" / "license"（保持空仓库）
5. 点 **Create repository**

---

## 第二步：在本机推送代码

在 **PowerShell** 或 **命令提示符** 里执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```bash
cd /d e:\LendingClubProject\luna-app-pages

git remote add origin https://github.com/你的用户名/luna-app.git
git push -u origin main
```

如果提示要登录，用浏览器登录 GitHub 或按提示用 Personal Access Token。

---

## 第三步：开启 GitHub Pages

1. 打开你的仓库页面：`https://github.com/你的用户名/luna-app`
2. 点 **Settings** → 左侧 **Pages**
3. **Source** 选 **Deploy from a branch**
4. **Branch** 选 `main`，文件夹选 **/ (root)** → 点 **Save**
5. 等 1～2 分钟，刷新 Pages 页面，会看到绿色提示和链接

你的公开链接就是：**https://你的用户名.github.io/luna-app/**

把这个链接发给任何人，用浏览器打开即可使用 Luna。
