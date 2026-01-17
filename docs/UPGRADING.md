# Upgrading Bucketwise Planner

## General Upgrade Process

1. **Backup first!** Always backup your database before upgrading
2. Check the [CHANGELOG.md](../CHANGELOG.md) for breaking changes
3. Stop services, pull latest code, restart
4. Migrations run automatically on startup

## Version-Specific Guides

### v0.2.0 → v0.3.0 (Transfer Feature)

**Breaking changes**: Database schema + API changes

```bash
# Backup
pg_dump -U budgetwise budgetwise > backup_v0.2.0.sql

# Upgrade
git pull origin main
docker compose down
docker compose up -d