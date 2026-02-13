#!/bin/bash

##############################################################################
# ODS Cloud Database Backup Script
# 
# Purpose: Automated SQLite database backup with rotation
# Schedule: Daily at 2:00 AM UTC (via cron)
# Retention: 30 days
##############################################################################

set -euo pipefail

# Configuration
DB_PATH="/opt/ods/ods-signage/server/ods-signage.db"
BACKUP_DIR="/opt/ods/backups/database"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ods-signage_${TIMESTAMP}.db"
LOG_FILE="/var/log/ods-backup.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "========== Starting database backup =========="

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    log "ERROR: Database file not found: ${DB_PATH}"
    exit 1
fi

# Get database size
DB_SIZE=$(du -h "${DB_PATH}" | cut -f1)
log "Database size: ${DB_SIZE}"

# Create backup using SQLite's built-in backup command
log "Creating backup: ${BACKUP_FILE}"
sqlite3 "${DB_PATH}" ".backup '${BACKUP_FILE}'"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "✅ Backup created successfully: ${BACKUP_SIZE}"
else
    log "❌ ERROR: Backup file was not created"
    exit 1
fi

# Compress backup to save space
log "Compressing backup..."
gzip "${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
log "✅ Compressed backup: ${COMPRESSED_SIZE}"

# Remove old backups (keep last 30 days)
log "Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "ods-signage_*.db.gz" -type f -mtime +${RETENTION_DAYS} -delete
REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "ods-signage_*.db.gz" -type f | wc -l)
log "Remaining backups: ${REMAINING_BACKUPS}"

# Calculate total backup disk usage
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "Total backup storage: ${TOTAL_SIZE}"

log "========== Backup completed successfully =========="

exit 0
