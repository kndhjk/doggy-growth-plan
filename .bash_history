lsblk
sudo umount -f /dev/sdb1 2>/dev/null || true
sudo parted /dev/sdb --script mklabel gpt mkpart primary 0% 100%
sudo mkfs.ext4 -F /dev/sdb1\
sudo mkfs.ext4 -F /dev/sdb1
sudo mkdir -p /mnt/data2
sudo mount /dev/sdb1 /mnt/data2
UUID=$(sudo blkid -s UUID -o value /dev/sdb1)
echo "UUID=$UUID /mnt/data2 ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
df -h | grep /mnt/data2
df -h
ls /
ls /mnt/data2/
ls /mnt/data2/lost+found/
passwd
quit
exit
sudo su
free -h
speedtest
sudo apt  install speedtest-cl
sudo apt  install speedtest-cli
bash <(wget -qO- -o- https://git.io/v2ray.sh)
sudo su
ping 52.148.92.238
ping 4.194.202.182
df -g
df -h
npm install -g @openai/codex
sudo apt install npm
wget -qO- https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh | sudo bash -s -- -e http://129.146.123.189:25774 -t dxHJikC8cKdmC92SWGkJbM
wget -qO- https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh | sudo bash -s -- -e http://129.146.123.189:25774 -t KzGjOQG4tn61lEY1jthofO
