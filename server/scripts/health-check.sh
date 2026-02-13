#!/bin/bash

##############################################################################
# ODS Cloud Health Check Monitor
# 
# Purpose: Monitor API health and alert on failures
# Schedule: Every 5 minutes (via cron)
# Alert: Log failures for review
##############################################################################

set -euo pipefail

# Configuration
API_URL="https://api.ods-cloud.com/api/health"
LOG_FILE="/var/log/ods-health.log"
MAX_RETRIES=3
RETRY_DELAY=10

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Health check function
check_health() {
    local attempt=0
    local http_code
    local response
    
    while [ $attempt -lt $MAX_RETRIES ]; do
        attempt=$((attempt + 1))
        
        # Perform health check
        response=$(curl -s -w "\n%{http_code}" "${API_URL}" --max-time 10 || echo "000")
        http_code=$(echo "$response" | tail -1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" = "200" ]; then
            # Parse response (expecting {"status":"ok"})
            if echo "$body" | grep -q '"status":"ok"'; then
                log "✅ Health check PASSED (attempt $attempt/$MAX_RETRIES)"
                return 0
            else
                log "⚠️  Health check returned 200 but unexpected body: $body"
            fi
        else
            log "❌ Health check FAILED (attempt $attempt/$MAX_RETRIES): HTTP $http_code"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "   Retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    # All retries failed
    log "🚨 ALERT: API is DOWN after $MAX_RETRIES attempts!"
    
    # Check if server process is running
    if pgrep -f "node.*index.js" > /dev/null; then
        log "   Server process is running (PID: $(pgrep -f 'node.*index.js'))"
    else
        log "   ⚠️  Server process NOT FOUND - attempting restart..."
        systemctl restart ods-server
        sleep 5
        if systemctl is-active --quiet ods-server; then
            log "   ✅ Server restarted successfully"
        else
            log "   ❌ Server restart FAILED"
        fi
    fi
    
    return 1
}

# Main execution
check_health

exit $?
