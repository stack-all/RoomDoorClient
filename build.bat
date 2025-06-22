@echo off
echo 正在安装依赖...
npm install

echo.
echo 正在构建项目...
npm run build

echo.
echo 构建完成！生产文件位于 dist 目录中
echo.
echo 要预览生产版本，请运行: npm run preview
pause
