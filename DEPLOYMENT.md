# 生产环境部署配置

## 服务器要求

- 支持HTTPS的Web服务器
- 现代浏览器支持
- 蓝牙设备支持

## 部署步骤

### 1. 构建应用
```bash
npm run build
```

### 2. 上传文件
将 `dist` 目录中的所有文件上传到Web服务器

### 3. 配置HTTPS
确保Web服务器配置了有效的SSL证书

### 4. 配置服务器
- 确保所有路由都指向 `index.html`（用于SPA路由）
- 设置正确的MIME类型

## Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;
    
    root /path/to/dist;
    index index.html;
    
    # PWA 相关配置
    location /manifest.webmanifest {
        add_header Cache-Control "public, max-age=604800";
    }
    
    location /sw.js {
        add_header Cache-Control "no-cache";
    }
    
    # 静态资源缓存
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Apache 配置示例

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /path/to/dist
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.pem
    SSLCertificateKeyFile /path/to/private-key.pem
    
    # PWA 相关配置
    <Files "manifest.webmanifest">
        Header set Cache-Control "public, max-age=604800"
    </Files>
    
    <Files "sw.js">
        Header set Cache-Control "no-cache"
    </Files>
    
    # 静态资源缓存
    <LocationMatch "^/assets/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>
    
    # SPA 路由支持
    <Directory "/path/to/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # 安全头部
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</VirtualHost>

# HTTP 重定向到 HTTPS
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

## 环境变量

生产环境可能需要的环境变量：

```bash
# .env.production
VITE_APP_TITLE=蓝牙门锁控制器
VITE_APP_DESCRIPTION=安全便捷的智能开锁体验
```

## 性能优化

1. **启用Gzip压缩**
2. **配置浏览器缓存**
3. **使用CDN加速**
4. **启用HTTP/2**

## 安全建议

1. **使用有效的SSL证书**
2. **配置安全头部**
3. **定期更新依赖包**
4. **监控访问日志**

## 监控和分析

- Google Analytics（可选）
- 错误监控（如Sentry）
- 性能监控（如Web Vitals）
