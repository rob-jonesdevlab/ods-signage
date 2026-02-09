import socket
import redis
import os
from enrollment_engine import ZeroTouchEngine

# Configuration from Environment Variables
NDEP_PORT = int(os.getenv("NDEP_PORT", 9999))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DRIFT_MS = int(os.getenv("DRIFT_LIMIT_MS", 300000))

# Initialize Logic & Cache
engine = ZeroTouchEngine(drift_limit_ms=DRIFT_MS)
cache = redis.from_url(REDIS_URL, decode_responses=True)

def start_ndep_server():
    # UDP Socket for Broadcast Discovery
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.bind(("0.0.0.0", NDEP_PORT))
        print(f"[NDEP-SERVER] Listening for broadcasts on port {NDEP_PORT}...")

        while True:
            data, addr = sock.recvfrom(1024)
            incoming_uuid = data.decode('utf-8').strip()

            # 1. Logic Validation (Time-Drift Check)
            is_valid, message = engine.validate_ndep_packet(incoming_uuid)
            
            if not is_valid:
                print(f"[REJECT] {addr}: {message}")
                continue

            # 2. Redis Integration (Anti-Replay)
            # SETNX returns 1 if key is new, 0 if it exists
            is_new = cache.setnx(f"token:{incoming_uuid}", "used")
            if is_new:
                # Set TTL for 24 hours (86400 seconds)
                cache.expire(f"token:{incoming_uuid}", 86400)
                print(f"[PAIRING-INITIATED] Device {addr} valid. UUID: {incoming_uuid}")
                # TRIGGER_PAIRING_FUNCTION(addr, incoming_uuid)
            else:
                print(f"[REPLAY-BLOCKED] {addr}: Token already used in last 24h.")

if __name__ == "__main__":
    start_ndep_server()
