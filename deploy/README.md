# Docker 部署

宿主机 Nginx 监听域名和 HTTPS，Docker 只暴露本机回环端口：

- 前端容器：`127.0.0.1:18080`
- 后端容器：`127.0.0.1:18000`

## 首次部署

```bash
cp deploy/backend.env.example deploy/backend.env
vim deploy/backend.env
docker compose up -d --build
```

把仓库里的 `default` 复制到宿主机 Nginx 站点配置后检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 日常更新

```bash
git pull
docker compose up -d --build
```
