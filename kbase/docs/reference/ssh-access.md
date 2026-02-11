# SSH Access Reference

**Quick reference for SSH access to ODS infrastructure**

---

## Dev Device (Raspberry Pi 5)

### Connection Details
- **IP Address**: `10.111.123.101`
- **User**: `root`
- **Password**: `0d52o26!`
- **SSH Key**: `~/.ssh/id_ed25519_rpi5`
- **Network**: Ethernet (en9) on 10.111.123.x subnet

### Connect with SSH Key
```bash
ssh -i ~/.ssh/id_ed25519_rpi5 root@10.111.123.101
```

### Connect with Password
```bash
ssh root@10.111.123.101
# Password: 0d52o26!
```

### Common File Locations
- **Web GUI**: `/home/signage/ODS/webgui/`
- **Pairing Screen**: `/home/signage/ODS/webgui/pairing.html`
- **Scripts**: `/usr/local/bin/`
- **Device UUID**: `/boot/device_uuid.txt`

---

## Production Server (DigitalOcean)

### Connection Details
- **IP Address**: `209.38.118.127`
- **Hostname**: `ODS-HOST-01`
- **User**: `root`
- **SSH Key**: `~/.ssh/id_ed25519_ods_pi5_dod`
- **Passphrase**: `plki90o***`

### Connect
```bash
ssh -i ~/.ssh/id_ed25519_ods_pi5_dod root@209.38.118.127
# Enter passphrase when prompted: plki90o***
```

### Add Key to SSH Agent
```bash
ssh-add ~/.ssh/id_ed25519_ods_pi5_dod
# Enter passphrase: plki90o***
```

### Common Commands
```bash
# Check server status
systemctl status ods-server

# View logs
journalctl -u ods-server -f

# Restart services
systemctl restart ods-server
```

---

## File Transfer (SCP)

### To Dev Device
```bash
# Using SSH key
scp -i ~/.ssh/id_ed25519_rpi5 local-file.html root@10.111.123.101:/path/to/destination/

# Example: Deploy pairing screen
scp -i ~/.ssh/id_ed25519_rpi5 player/pairing.html root@10.111.123.101:/home/signage/ODS/webgui/pairing.html
```

### From Dev Device
```bash
scp -i ~/.ssh/id_ed25519_rpi5 root@10.111.123.101:/path/to/file.txt ./local-destination/
```

---

## Troubleshooting

### Permission Denied
```bash
# Ensure SSH key has correct permissions
chmod 600 ~/.ssh/id_ed25519_rpi5

# Ensure SSH key is added to agent
ssh-add ~/.ssh/id_ed25519_rpi5
```

### Connection Timeout
```bash
# Check network connectivity
ping 10.111.123.101

# Verify device is on correct network
ifconfig en9
```

### SSH Key Not Found
```bash
# Generate new SSH key if needed
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_rpi5 -C "ods-dev-device"

# Copy public key to device
sshpass -p '0d52o26!' ssh-copy-id -i ~/.ssh/id_ed25519_rpi5.pub root@10.111.123.101
```

---

**Last Updated**: February 9, 2026
