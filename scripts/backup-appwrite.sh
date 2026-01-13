#!/bin/bash

# Appwrite Backup Script
# This script creates backups of your local Appwrite instance
# Usage: ./scripts/backup-appwrite.sh [backup_dir]

set -e

# Configuration
BACKUP_DIR="${1:-./appwrite-backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Appwrite Backup Script${NC}"
echo -e "${GREEN}   Timestamp: ${TIMESTAMP}${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"
echo -e "${GREEN}✓ Created backup directory: ${BACKUP_PATH}${NC}"

# Function to check if docker compose is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is available${NC}"
}

# Function to backup the MariaDB database
backup_database() {
    echo -e "\n${YELLOW}Backing up MariaDB database...${NC}"

    if docker compose exec -T mariadb sh -c 'exec mysqldump --all-databases --add-drop-database --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD"' > "${BACKUP_PATH}/database_dump.sql" 2>/dev/null; then
        echo -e "${GREEN}✓ Database backup created: ${BACKUP_PATH}/database_dump.sql${NC}"

        # Compress the database dump
        gzip "${BACKUP_PATH}/database_dump.sql"
        echo -e "${GREEN}✓ Database backup compressed: ${BACKUP_PATH}/database_dump.sql.gz${NC}"
    else
        echo -e "${RED}✗ Failed to backup database. Is Appwrite running?${NC}"
        return 1
    fi
}

# Function to backup Docker volumes
backup_volume() {
    local volume_name=$1
    local backup_file="${BACKUP_PATH}/${volume_name}.tar.gz"

    echo -e "${YELLOW}  Backing up volume: ${volume_name}...${NC}"

    if docker volume inspect "${volume_name}" &> /dev/null; then
        docker run --rm \
            -v "${volume_name}:/data:ro" \
            -v "${BACKUP_PATH}:/backup" \
            alpine tar czf "/backup/${volume_name}.tar.gz" -C /data . 2>/dev/null

        if [ -f "${backup_file}" ]; then
            echo -e "${GREEN}  ✓ Volume backup created: ${backup_file}${NC}"
        else
            echo -e "${RED}  ✗ Failed to create volume backup${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠ Volume ${volume_name} does not exist, skipping${NC}"
    fi
}

backup_volumes() {
    echo -e "\n${YELLOW}Backing up Docker volumes...${NC}"
    echo -e "${YELLOW}Note: For consistency, consider stopping Appwrite first${NC}"

    # List of Appwrite volumes to backup
    local volumes=(
        "appwrite-uploads"
        "appwrite-functions"
        "appwrite-builds"
        "appwrite-sites"
        "appwrite-certificates"
        "appwrite-config"
        "appwrite-mariadb"
        "appwrite-redis"
        "appwrite-cache"
    )

    for volume in "${volumes[@]}"; do
        backup_volume "${volume}"
    done
}

# Function to backup environment file
backup_env() {
    echo -e "\n${YELLOW}Backing up environment file...${NC}"

    # Look for .env file in common Appwrite locations
    local env_locations=(
        "./.env"
        "./appwrite/.env"
        "/opt/appwrite/.env"
        "$HOME/appwrite/.env"
    )

    local found=false
    for env_file in "${env_locations[@]}"; do
        if [ -f "${env_file}" ]; then
            cp "${env_file}" "${BACKUP_PATH}/env.backup"
            echo -e "${GREEN}✓ Environment file backed up from: ${env_file}${NC}"
            echo -e "${RED}⚠ IMPORTANT: Keep this file secure - it contains sensitive data!${NC}"
            echo -e "${RED}⚠ The _APP_OPENSSL_KEY_V1 is critical for data decryption!${NC}"
            found=true
            break
        fi
    done

    if [ "$found" = false ]; then
        echo -e "${YELLOW}⚠ No .env file found. Please manually backup your Appwrite .env file${NC}"
    fi
}

# Function to create a restore script
create_restore_script() {
    echo -e "\n${YELLOW}Creating restore instructions...${NC}"

    cat > "${BACKUP_PATH}/RESTORE_INSTRUCTIONS.md" << 'EOF'
# Appwrite Restore Instructions

⚠️ **WARNING**: Only restore to a FRESH Appwrite installation to avoid data corruption.

## Prerequisites
1. Fresh Appwrite installation
2. Same `_APP_OPENSSL_KEY_V1` value from your backed up .env file

## Restore Database

```bash
# Decompress the database dump
gunzip database_dump.sql.gz

# Restore the database
docker compose exec -T mariadb sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < database_dump.sql
```

## Restore Volumes

For each volume backup file:

```bash
# Restore a volume (replace VOLUME_NAME with actual name)
docker run --rm \
    -v VOLUME_NAME:/data \
    -v $(pwd):/backup \
    alpine tar xzf "/backup/VOLUME_NAME.tar.gz" -C /data
```

## Restore Environment

1. Copy `env.backup` to your Appwrite installation directory as `.env`
2. Ensure `_APP_OPENSSL_KEY_V1` matches exactly

## Post-Restore

1. Restart Appwrite: `docker compose up -d`
2. Verify all services are running: `docker compose ps`
3. Test your application
EOF

    echo -e "${GREEN}✓ Restore instructions created: ${BACKUP_PATH}/RESTORE_INSTRUCTIONS.md${NC}"
}

# Function to display backup summary
show_summary() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}   Backup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Backup location: ${BACKUP_PATH}"
    echo -e "\nBackup contents:"
    ls -lh "${BACKUP_PATH}"

    # Calculate total size
    local total_size=$(du -sh "${BACKUP_PATH}" | cut -f1)
    echo -e "\n${GREEN}Total backup size: ${total_size}${NC}"

    echo -e "\n${YELLOW}Remember to:${NC}"
    echo -e "  1. Store backups in a secure, offsite location"
    echo -e "  2. Follow the 3-2-1 rule: 3 copies, 2 media types, 1 offsite"
    echo -e "  3. Test your backups periodically"
    echo -e "  4. Keep the _APP_OPENSSL_KEY_V1 safe - it's critical for decryption!"
}

# Main execution
main() {
    check_docker
    backup_database
    backup_volumes
    backup_env
    create_restore_script
    show_summary
}

# Run the script
main
