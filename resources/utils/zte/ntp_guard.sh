#!/bin/bash

# Configuration
NTP_SERVER="pool.ntp.org"
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "[NTP-GUARD] Initializing Zero-Touch Temporal Gate..."

# 1. Force an immediate sync attempt (requires root/sudo)
# We use 'ntpdate' or 'chronyc' depending on the OS flavor
if command -v chronyc > /dev/null; then
    echo "[NTP-GUARD] Using Chrony for synchronization..."
    chronyc makestep
elif command -v ntpdate > /dev/null; then
    echo "[NTP-GUARD] Using ntpdate for synchronization..."
    ntpdate -u $NTP_SERVER
fi

# 2. Validation Loop: Wait for Stratum/Sync Confirmation
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    # Check if the clock is synchronized (using timedatectl)
    SYNC_STATUS=$(timedatectl show --property=NTPSynchronized --value)
    
    if [ "$SYNC_STATUS" == "yes" ]; then
        echo "[NTP-GUARD] Stratum Lock Confirmed. System time is authoritative."
        
        # Launch the Enrollment Engine (Python)
        echo "[NTP-GUARD] Launching enrollment_engine.py..."
        python3 /opt/signage/enrollment_engine.py
        exit 0
    else
        echo "[NTP-GUARD] Waiting for NTP sync... (Attempt $((COUNT+1))/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
        COUNT=$((COUNT+1))
    fi
done

echo "[NTP-GUARD] ERROR: Failed to synchronize time. Aborting enrollment to prevent replay rejection."
exit 1
