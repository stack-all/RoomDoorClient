@echo off
echo 正在生成自签名SSL证书...
echo.

REM 检查是否安装了OpenSSL
where openssl >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到OpenSSL
    echo 请先安装OpenSSL或使用mkcert工具
    echo.
    echo 安装选项：
    echo 1. 下载并安装OpenSSL: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. 使用mkcert: https://github.com/FiloSottile/mkcert
    echo.
    echo 如果使用mkcert，请运行：
    echo mkcert localhost 127.0.0.1 ::1
    pause
    exit /b 1
)

REM 生成证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private-key.pem -out certificate.pem -config ssl.conf

if %errorlevel% equ 0 (
    echo.
    echo 证书生成成功！
    echo 文件：certificate.pem 和 private-key.pem
    echo.
    echo 现在可以运行 npm run dev 启动HTTPS开发服务器
) else (
    echo.
    echo 证书生成失败，请检查ssl.conf配置文件
)

pause
