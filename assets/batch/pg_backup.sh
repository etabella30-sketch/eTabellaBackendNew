#!/bin/bash

# Set PostgreSQL password
# export PGPASSWORD="your_password_here"

# Extract date and time components
datestr=$(date +"%Y_%m_%d_%H_%M_%S")
echo "datestr is $datestr"

# Backup directory and log file
BACKUP_DIR="/var/backups/postgres"
LOGFILE="/var/log/postgres-remote-backup.log"
REMOTE_BACKUP="$BACKUP_DIR/etabella_tech_backup_$datestr.backup"

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform the PostgreSQL backup
echo "Starting remote PostgreSQL backup at $datestr..." | tee -a $LOGFILE
pg_dump --host=public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com --port=16751 --username=vultradmin --dbname=etabella.com --file="$REMOTE_BACKUP" --format=c --blobs 2>> $LOGFILE

if [ $? -eq 0 ]; then
    echo "Backup completed successfully at $datestr." | tee -a $LOGFILE
else
    echo "Backup failed at $datestr. Check logs for details." | tee -a $LOGFILE
    exit 1
fi

echo "Backup process completed." | tee -a $LOGFILE

# Upload the backup to S3
echo "Uploading backup to S3 (second location)..." | tee -a $LOGFILE
s3cmd put "$REMOTE_BACKUP" s3://etabella/project/etabella.backup 2>> $LOGFILE

if [ $? -eq 0 ]; then
    echo "Upload to S3 completed successfully at $datestr." | tee -a $LOGFILE
else
    echo "Upload to S3 failed at $datestr. Check logs for details." | tee -a $LOGFILE
    exit 1
fi

echo "Backup and upload process completed." | tee -a $LOGFILE


