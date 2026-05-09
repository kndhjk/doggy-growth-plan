set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx ca-certificates curl gnupg
mkdir -p /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/nodesource.gpg ]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi
cat >/etc/apt/sources.list.d/nodesource.list <<'EOF'
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main
EOF
apt-get update
apt-get install -y nodejs
systemctl enable nginx
systemctl restart nginx
node -v
npm -v
