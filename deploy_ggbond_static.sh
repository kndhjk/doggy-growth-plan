set -e
APP_DIR="/home/destiny/apps/group-project-gg-bond-main"
WEB_DIR="/var/www/gg-bond"
mkdir -p "$APP_DIR" "$WEB_DIR"
cd "$APP_DIR/frontend"
cat > .env.production <<'EOF'
REACT_APP_API_URL=/api
EOF
npm ci
CI=true GENERATE_SOURCEMAP=false npm run build
mkdir -p "$WEB_DIR"
rsync -a --delete build/ "$WEB_DIR/"
chown -R www-data:www-data "$WEB_DIR"
cat <<'NGINX' >/etc/nginx/sites-available/gg-bond
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/gg-bond;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gg-bond /etc/nginx/sites-enabled/gg-bond
nginx -t
systemctl reload nginx
