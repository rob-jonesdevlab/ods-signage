# Skill: Zero-Touch Enrollment via Temporal UUIDv7
**Architectural Paradigm**: Time-Windowed Predictive Identity
**Core Component**: `ndep_listener.py` (The Network Ear)

## 1. Network Interface (UDP 9999)
- **Mode**: The listener binds to `0.0.0.0` to capture layer-2 broadcasts.
- **Payload**: Expects a UTF-8 encoded UUIDv7 string.

## 2. Redis Integration Logic
- **Atomicity**: Uses `SETNX` (Set if Not Exists) as a thread-safe locking mechanism.
- **TTL (Time To Live)**: Tokens are automatically purged from the cache after 24 hours, ensuring the server memory footprint remains constant regardless of signage network size.

## 3. High-Performance Validation Flow
1. **Socket Reception**: Packet arrives via NDEP.
2. **Temporal Extraction**: `ZeroTouchEngine` peels the 48-bit timestamp.
3. **Drift Comparison**: Check $|T_{server} - T_{uuid}| < 5min$.
4. **Redis Check**: Verify token uniqueness.
5. **Callback**: On success, trigger the pairing handoff.

## 4. Operational Maintenance
- **Monitor Traffic**: `docker logs signage-enrollment-server --tail 100`
- **Cache Inspection**: Use `redis-cli KEYS "token:*"` to see active enrollment tokens.
