import time
import struct
import uuid
import secrets

class ZeroTouchEngine:
    """
    Conceptual implementation of the UUIDv7 Zero-Touch Enrollment.
    This script provides the Generator (Device) and Validator (Server) logic.
    """

    def __init__(self, drift_limit_ms=300000):
        self.drift_limit_ms = drift_limit_ms
        self.seen_tokens = set()  # Replace with Redis/Bloom Filter for Production

    def generate_device_uuid(self, custom_entropy=None):
        """
        DEVICE SIDE: Generates a UUIDv7 based on current NTP-synced time.
        """
        # 48-bit timestamp in milliseconds
        unix_ts_ms = int(time.time() * 1000)
        
        # v7 UUID construction (RFC 9562)
        # We use standard uuid.uuid7() if available, or manual construction
        new_uuid = uuid.uuid7() 
        return new_uuid

    def validate_ndep_packet(self, incoming_uuid_str):
        """
        SERVER SIDE: The 'Calculator' that verifies if the UUID was generated
        within the allowable 24-hour / 5-minute drift window.
        """
        try:
            val = uuid.UUID(incoming_uuid_str)
            
            # Extract the 48-bit timestamp from the first 6 bytes
            # UUIDv7 format: [48 bits TS][4 bits Ver][12 bits Rand][2 bits Var][62 bits Rand]
            raw_bytes = val.bytes
            timestamp_ms = struct.unpack('>Q', b'\x00\x00' + raw_bytes[:6])[0]
            
            current_ms = int(time.time() * 1000)
            delta = abs(current_ms - timestamp_ms)

            # 1. Temporal Validation
            if delta > self.drift_limit_ms:
                return False, f"Expired/Future Token: Drift of {delta}ms"

            # 2. Replay Protection
            if incoming_uuid_str in self.seen_tokens:
                return False, "Replay Attack Detected"

            # 3. Success: Register token
            self.seen_tokens.add(incoming_uuid_str)
            return True, "Valid Enrollment Token"

        except Exception as e:
            return False, f"Malformed UUID: {str(e)}"

# Implementation Example for Archie:
# engine = ZeroTouchEngine()
# device_id = engine.generate_device_uuid()
# is_valid, msg = engine.validate_ndep_packet(str(device_id))
