@echo off
echo 正在启动开发服务器...
echo.
echo 注意：蓝牙功能需要HTTPS环境
echo 如果遇到SSL证书问题，请运行 generate-cert.bat 生成自签名证书
echo.
npm run dev
