#!/usr/bin/env python3
"""
ODS Zero Touch Enrollment - Device UUID Generator
Generates UUIDv7 and broadcasts to ODS Cloud NDEP listener
"""
import uuid
import socket
import sys
import time
import struct
import secrets

def generate_device_uuid():
    """Generate UUIDv7 with 48-bit NTP timestamp (Python 3.12 compatible)"""
    # Get current timestamp in milliseconds
    unix_ts_ms = int(time.time() * 1000)
    
    # UUIDv7 format: [48-bit timestamp][4-bit version][12-bit random][2-bit variant][62-bit random]
    # Pack timestamp into first 6 bytes
    timestamp_bytes = struct.pack('>Q', unix_ts_ms)[2:]  # Take last 6 bytes (48 bits)
    
    # Generate 10 random bytes for the rest
    random_bytes = secrets.token_bytes(10)
    
    # Combine: 6 bytes timestamp + 10 bytes random = 16 bytes total
    uuid_bytes = bytearray(timestamp_bytes + random_bytes)
    
    # Set version (7) in bits 48-51
    uuid_bytes[6] = (uuid_bytes[6] & 0x0F) | 0x70  # Version 7
    
    # Set variant (RFC 4122) in bits 64-65
    uuid_bytes[8] = (uuid_bytes[8] & 0x3F) | 0x80  # Variant 10
    
    # Convert to UUID object
    device_uuid = uuid.UUID(bytes=bytes(uuid_bytes))
    return str(device_uuid)

def broadcast_enrollment(device_uuid, ods_cloud_ip, ndep_port):
    """Broadcast UUID to enrollment server via NDEP"""
    print(f"[NDEP] Broadcasting to {ods_cloud_ip}:{ndep_port}...")
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Send directly to ODS Cloud
        sock.sendto(device_uuid.encode('utf-8'), (ods_cloud_ip, ndep_port))
        print(f"[NDEP] ✅ Broadcast sent to {ods_cloud_ip}:{ndep_port}")
        return True
    except Exception as e:
        print(f"[NDEP] ❌ Broadcast failed: {e}")
        return False
    finally:
        sock.close()

def main():
    if len(sys.argv) < 3:
        print("Usage: device_uuid_generator.py <ods_cloud_ip> <ndep_port>")
        sys.exit(1)
    
    ods_cloud_ip = sys.argv[1]
    ndep_port = int(sys.argv[2])
    
    print("[UUID-GEN] Starting device UUID generation...")
    
    # Generate UUID
    device_uuid = generate_device_uuid()
    print(f"[UUID-GEN] ✅ Generated UUID: {device_uuid}")
    
    # Save to file
    try:
        with open('/boot/device_uuid.txt', 'w') as f:
            f.write(device_uuid)
        print(f"[UUID-GEN] ✅ Saved to /boot/device_uuid.txt")
    except Exception as e:
        print(f"[UUID-GEN] ⚠️  Could not save to /boot/device_uuid.txt: {e}")
    
    # Broadcast enrollment
    success = broadcast_enrollment(device_uuid, ods_cloud_ip, ndep_port)
    
    if success:
        print("[UUID-GEN] ✅ Enrollment process complete")
        return 0
    else:
        print("[UUID-GEN] ❌ Enrollment failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
