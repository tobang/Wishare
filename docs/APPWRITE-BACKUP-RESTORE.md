# Appwrite Backup and Restore Guide

This guide explains how to backup and restore your local (self-hosted) Appwrite instance.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backup](#backup)
  - [Using the Backup Script](#using-the-backup-script)
  - [Manual Backup](#manual-backup)
- [Restore](#restore)
  - [Restore Database](#restore-database)
  - [Restore Docker Volumes](#restore-docker-volumes)
  - [Restore Environment File](#restore-environment-file)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker and Docker Compose installed
- Access to the Appwrite installation directory
- Sufficient disk space for backups

---

## Backup

### Using the Backup Script

A backup script is available at `scripts/backup-appwrite.sh` that automates the entire backup process.

#### Usage

```bash
# Navigate to your Appwrite installation directory
cd ~/appwrite/appwrite

# Run the backup script (creates backup in ./appwrite-backups/)
~/git/wishare/scripts/backup-appwrite.sh

# Or specify a custom backup directory
~/git/wishare/scripts/backup-appwrite.sh /path/to/backup/directory
```

#### What the Script Backs Up

1. **MariaDB Database** - All databases (compressed as `.sql.gz`)
2. **Docker Volumes** - User uploads, functions, certificates, etc.
3. **Environment File** - Your `.env` configuration
4. **Restore Instructions** - A markdown file with recovery steps

### Manual Backup

If you prefer to backup manually, follow these steps:

#### 1. Backup the Database

```bash
cd ~/appwrite/appwrite

# Create database dump
docker compose exec mariadb sh -c 'exec mysqldump --all-databases --add-drop-database --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD"' > ./backup/database_dump.sql

# Compress the dump (optional but recommended)
gzip ./backup/database_dump.sql
```

#### 2. Backup Docker Volumes

> ⚠️ **Important:** Stop Appwrite before backing up volumes for full consistency.

```bash
# Stop Appwrite (optional but recommended for consistency)
docker compose down

# Backup each volume
docker run --rm -v appwrite-uploads:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-uploads.tar.gz" -C /data .
docker run --rm -v appwrite-functions:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-functions.tar.gz" -C /data .
docker run --rm -v appwrite-builds:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-builds.tar.gz" -C /data .
docker run --rm -v appwrite-sites:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-sites.tar.gz" -C /data .
docker run --rm -v appwrite-certificates:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-certificates.tar.gz" -C /data .
docker run --rm -v appwrite-config:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-config.tar.gz" -C /data .
docker run --rm -v appwrite-mariadb:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-mariadb.tar.gz" -C /data .
docker run --rm -v appwrite-redis:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-redis.tar.gz" -C /data .
docker run --rm -v appwrite-cache:/data -v $(pwd)/backup:/backup alpine tar czf "/backup/appwrite-cache.tar.gz" -C /data .

# Restart Appwrite
docker compose up -d
```

#### 3. Backup Environment File

```bash
cp .env ./backup/env.backup.$(date +"%Y%m%d")
```

> 🔴 **CRITICAL:** The `_APP_OPENSSL_KEY_V1` variable in your `.env` file is used to encrypt your data. **You MUST preserve this exact value** or all encrypted data becomes permanently inaccessible!

---

## Restore

> ⚠️ **WARNING:** Only restore to a **FRESH Appwrite installation** to avoid data corruption. Do not restore over an existing instance with data.

### Restore Environment File

**This must be done FIRST before restoring anything else.**

```bash
# Copy the backed up .env file
cp /path/to/backup/env.backup ~/appwrite/appwrite/.env
```

Verify that `_APP_OPENSSL_KEY_V1` matches your original value exactly.

### Restore Database

```bash
cd ~/appwrite/appwrite

# Start Appwrite (if not already running)
docker compose up -d

# Wait for MariaDB to be ready
sleep 10

# Decompress the database dump (if compressed)
gunzip /path/to/backup/database_dump.sql.gz

# Restore the database
docker compose exec -T mariadb sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < /path/to/backup/database_dump.sql
```

### Restore Docker Volumes

```bash
cd ~/appwrite/appwrite

# Stop Appwrite
docker compose down

# Restore each volume
docker run --rm -v appwrite-uploads:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-uploads.tar.gz" -C /data

docker run --rm -v appwrite-functions:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-functions.tar.gz" -C /data

docker run --rm -v appwrite-builds:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-builds.tar.gz" -C /data

docker run --rm -v appwrite-sites:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-sites.tar.gz" -C /data

docker run --rm -v appwrite-certificates:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-certificates.tar.gz" -C /data

docker run --rm -v appwrite-config:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-config.tar.gz" -C /data

docker run --rm -v appwrite-mariadb:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-mariadb.tar.gz" -C /data

docker run --rm -v appwrite-redis:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-redis.tar.gz" -C /data

docker run --rm -v appwrite-cache:/data -v /path/to/backup:/backup alpine tar xzf "/backup/appwrite-cache.tar.gz" -C /data

# Restart Appwrite
docker compose up -d
```

### Verify Restoration

```bash
# Check all services are running
docker compose ps

# Check logs for errors
docker compose logs -f

# Test your application
```

---

## Best Practices

### Backup Frequency

| Data Type     | Recommended Frequency |
| ------------- | --------------------- |
| Database      | Daily                 |
| User uploads  | Daily or weekly       |
| Configuration | After any changes     |

### Automation

Set up a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/wishare/scripts/backup-appwrite.sh /path/to/backup/location >> /var/log/appwrite-backup.log 2>&1
```

### The 3-2-1 Rule

Follow the 3-2-1 backup rule:

- **3** copies of your data
- **2** different storage media (e.g., local disk + cloud)
- **1** offsite backup (e.g., AWS S3, Google Cloud Storage)

### Security

- **Encrypt backups** before storing offsite
- **Restrict access** to backup files (they contain sensitive data)
- **Store `.env` backups separately** and securely
- **Never commit** backup files or `.env` to version control

### Testing

- **Test restores quarterly** to verify backup integrity
- Document your recovery procedure
- Keep track of Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

---

## Troubleshooting

### "Cannot connect to database" during backup

Ensure Appwrite is running:

```bash
docker compose ps
docker compose up -d
```

### "Volume does not exist" error

The volume name may vary. List available volumes:

```bash
docker volume ls | grep appwrite
```

### Database restore fails

- Ensure you're restoring to a **fresh** installation
- Check MariaDB is running: `docker compose ps mariadb`
- Verify the SQL file is not corrupted

### Encrypted data is inaccessible after restore

The `_APP_OPENSSL_KEY_V1` in your `.env` file must match the original exactly. If lost, encrypted data cannot be recovered.

### Permission errors

Run backup/restore commands with appropriate permissions:

```bash
sudo ./backup-appwrite.sh
```

---

## Related Documentation

- [Appwrite Self-Hosting Documentation](https://appwrite.io/docs/advanced/self-hosting)
- [Appwrite Backup Documentation](https://appwrite.io/docs/advanced/self-hosting/production/backups)
