@echo off
chcp 65001 >nul
echo.
echo ===== Luna 发布到 GitHub Pages =====
echo.
echo 第一步：在浏览器里新建仓库
echo 正在打开 https://github.com/new ...
start https://github.com/new
echo.
echo 请把仓库名填为: luna-app
echo 选 Public，不要勾选 README/.gitignore，然后点 Create repository。
echo.
pause
echo.
echo 第二步：请把你的 GitHub 用户名发给我，或自己在本窗口执行：
echo.
echo   cd /d e:\LendingClubProject\luna-app-pages
echo   git remote add origin https://github.com/你的用户名/luna-app.git
echo   git push -u origin main
echo.
echo 第三步：在仓库网页点 Settings - Pages - Deploy from branch 选 main / root - Save
echo 过 1～2 分钟你的链接就是: https://你的用户名.github.io/luna-app/
echo.
pause
