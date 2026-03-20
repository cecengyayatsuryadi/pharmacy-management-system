# Operational Runbook - Apotek Management System

This document outlines common operational tasks, troubleshooting steps, and data management procedures for the Apotek Management System.

## Common Operational Tasks

### Starting the Application
1. **Local Development:**
   ```bash
   # Root directory
   npm install
   docker compose up -d
   npm run dev
   ```
2. **Production Deployment:**
   - The system is designed to be deployed on Vercel.
   - Database migrations are typically handled as part of the CI/CD pipeline.

### Database Operations
1. **Apply Schema Changes (Push):**
   ```bash
   # Best for rapid development
   npm run db:push --workspace=@workspace/database
   ```
2. **Generate and Apply Migrations (Production-safe):**
   ```bash
   # 1. Generate SQL migration file
   npm run db:generate --workspace=@workspace/database

   # 2. Review the generated file in packages/database/drizzle/

   # 3. Apply to production
   # (Depends on deployment pipeline, typically handled by CI)
   ```
3. **Optimizing Database Performance:**
   - If queries on the Medicine list become slow, verify that the following indices are present:
     - `medicine_org_category_idx`
     - `medicine_org_active_idx`
     - `medicine_org_created_idx`
   - Use `EXPLAIN ANALYZE` in PostgreSQL to verify index usage.

4. **Seeding Initial Data:**
...
   npm run db:seed --workspace=@workspace/database
   ```
4. **Wiping the Database (Development Only):**
   ```bash
   npm run db:wipe --workspace=@workspace/database
   ```

---

## Troubleshooting Common Errors

### 1. `Unauthorized` on Actions
- **Issue:** User session has expired or is invalid.
- **Solution:** Clear browser cookies and log in again. Ensure `AUTH_SECRET` is consistent across environments.

### 2. `Database connection failed`
- **Issue:** PostgreSQL instance is down or `DATABASE_URL` is incorrect.
- **Solution:** Verify `docker ps` to see if the database container is running. Check connection string parameters.

### 3. `Invalid organization context`
- **Issue:** The user's `organizationId` is missing from the session.
- **Solution:** This usually happens if the user was deleted but the session persisted. Re-login to refresh the session token.

### 4. `Transaction rollback on Stock Update`
- **Issue:** Stock quantity went below zero during a concurrent sale transaction.
- **Solution:** The system uses `db.transaction`. If a sale fails due to insufficient stock, the whole transaction reverts. Check the stock segmentation logic in `apps/web/lib/actions/inventory.ts`.

---

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Server Action Latency:** Monitor how long POS transactions take. A delay over 1s can affect checkout efficiency.
2. **Database CPU/Memory:** Monitor the PostgreSQL instance, especially during peak hours.
3. **Error Rates:** Track `500` errors in the Next.js application logs.

---

## Data Backup and Recovery

### Automatic Backups
- If hosted on a managed provider (e.g., Supabase, Neon, or RDS), ensure automatic daily backups are enabled with a 30-day retention period.

### Manual Backup (CLI)
```bash
# Backup
docker exec -t apotek-db-1 pg_dumpall -c -U postgres > dump_$(date +%Y-%m-%d).sql

# Restore
cat dump.sql | docker exec -i apotek-db-1 psql -U postgres
```

### Recovery Procedure
1. Identify the latest healthy backup point.
2. If using Docker, spin up a fresh PostgreSQL container.
3. Apply the SQL dump using the restore command above.
4. Run `npm run db:push` to ensure the schema matches the latest application code.
