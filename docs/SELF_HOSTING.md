# Self-Hosting Guide

This guide covers how to install and run Bucketwise Planner on your own infrastructure.

## Prerequisites

### Option 1: Docker (Recommended)
- Docker Engine 20.10+
- Docker Compose 2.0+
- Internet connection (for initial image pulls)

### Option 2: Manual Setup
- Node.js 18+ (or compatible runtime)
- PostgreSQL 14+
- pnpm 8+
- Internet connection (for dependency installation)

## Quick Start with Docker Compose

The fastest way to get Bucketwise Planner running.

### 1. Clone the Repository

```bash
git clone https://github.com/PaulAtkins88/budgetwise-planner.git
cd budgetwise-planner
```

### 2. Configure Environment

Copy the example configuration file and customize:

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
# REQUIRED: PostgreSQL connection
PG_CONNECTION_STRING=postgresql://budgetwise:your-password@postgres:5432/budgetwise

# REQUIRED: Security secrets (generate strong random strings, min 32 chars)
JWT_SECRET=generate-a-strong-random-secret-here
ADMIN_SECRET=generate-another-strong-secret-here

# OPTIONAL: AI Advisor (requires Google API key)
GEMINI_API_KEY=
AI_ENABLED=false
```

**Important:** Generate strong secrets! Example:

```bash
# macOS/Linux
openssl rand -base64 32

# Then use the output for JWT_SECRET and ADMIN_SECRET
```

### 3. Start Services

```bash
docker compose up -d
```

Wait 10-15 seconds for services to initialize, then check status:

```bash
docker compose ps
```

All services should show `running` status.

### 4. Access the Application

- **Web UI:** http://localhost:5555
- **API:** http://localhost:3000
- **Database:** postgres://budgetwise:password@localhost:5432/budgetwise

### 5. Create Your First User

1. Open http://localhost:5555
2. Click "Sign Up"
3. Enter email and password
4. Log in and start budgeting!

## Manual Development Setup

For development or if you prefer not to use Docker.

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up PostgreSQL

Create a database and user (adjust credentials as needed):

```bash
createdb budgetwise
psql budgetwise <<EOF
CREATE USER budgetwise WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE budgetwise TO budgetwise;
EOF
```

Run migrations (see [backend/README.md](../backend/README.md) for details):

```bash
cd backend
# Migrations are manual; check backend/README.md for schema setup
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials, JWT_SECRET, ADMIN_SECRET

# Frontend
cd frontend
cp .env.example .env
# Edit VITE_API_BASE to point to your backend (default: http://localhost:3000)
```

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev
```

Backend runs on http://localhost:3000
Frontend runs on http://localhost:5173

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PG_CONNECTION_STRING` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Session token secret (min 32 chars) | `your-strong-random-string` |
| `ADMIN_SECRET` | Admin operations secret (min 32 chars) | `your-strong-random-string` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI API key (for chat feature) | (empty = disabled) |
| `AI_ENABLED` | Enable AI advisor | `false` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend port | `3000` |
| `VITE_API_BASE` | Frontend API endpoint | `http://localhost:3000` |

## Reverse Proxy Setup

For production, use a reverse proxy like Nginx or Caddy to handle TLS termination, domain routing, and static file serving.

### Nginx Example

```nginx
upstream backend {
  server localhost:3000;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Frontend (static files)
  location / {
    root /path/to/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Auth routes
  location /auth/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Caddy Example (Simpler)

```caddy
your-domain.com {
  # Frontend
  root * /path/to/frontend/dist
  try_files {path} {path}/ /index.html
  file_server

  # API reverse proxy
  reverse_proxy /api/* localhost:3000
  reverse_proxy /auth/* localhost:3000
}
```

## Database Backup & Recovery

### Backup

```bash
# Using Docker Compose
docker compose exec postgres pg_dump -U budgetwise budgetwise > backup.sql

# Or directly
pg_dump -h localhost -U budgetwise budgetwise > backup.sql
```

### Restore

```bash
# From backup
psql -h localhost -U budgetwise budgetwise < backup.sql
```

## Enabling AI Advisor

The AI chat feature is optional and disabled by default.

### Setup Steps

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY` in your `.env` file
3. Set `AI_ENABLED=true`
4. Restart the backend service:
   ```bash
   docker compose restart backend
   # OR: kill and restart `pnpm dev` in backend terminal
   ```

The chat bubble will appear in the top-right header when enabled.

### Privacy

- Messages are sent to Google Gemini API (third-party)
- No chat history is permanently stored
- Each message is ephemeral context only
- Your budget data is not logged or stored by AI provider

## Troubleshooting

### Port Conflicts

If port 3000, 5555, or 5432 is already in use:

```bash
# Docker Compose: Edit docker-compose.yml
# Change port mappings, e.g., "5556:80" for frontend

# Manual: Start services on different ports
PORT=3001 pnpm dev  # Backend
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check `PG_CONNECTION_STRING` format
- Ensure database and user exist
- Check network connectivity if using remote database

### "AI Chat Disabled" Message

- Ensure `GEMINI_API_KEY` is set
- Ensure `AI_ENABLED=true`
- Check backend logs: `docker compose logs backend`
- Restart backend after changing environment variables

### JWT Errors (Login Fails)

```
Error: JsonWebTokenError: invalid token
```

**Solutions:**
- Ensure `JWT_SECRET` is set in both backend and frontend environments
- Secrets must match between instances
- Check token hasn't expired (refresh token functionality)
- Clear browser cookies and try again

### Date/Timezone Issues

If dates appear off by a day:

- This is a known timezone normalization issue
- Always use `formatDateToISO()` utility (frontend/src/utils/formatters.ts)
- Ensure backend and database are in UTC
- See [docs/ARCHITECTURE.md](ARCHITECTURE.md#key-patterns)

### Docker Compose Won't Start

Check logs:

```bash
docker compose logs
```

Common issues:
- Volume permissions: `sudo chown -R $(id -u):$(id -g) ./postgres_data`
- Image pull timeout: `docker compose pull && docker compose up -d`
- Port conflicts: Change port mappings in docker-compose.yml

## Updating Bucketwise Planner

### From Docker Compose

```bash
git pull origin main
docker compose down
docker compose up -d --build
```

### From Manual Setup

```bash
git pull origin main
pnpm install
# Restart backend and frontend services
```

**Note:** Check [CHANGELOG.md](../CHANGELOG.md) for breaking changes.

## Getting Help

- 📖 See [README.md](../README.md) for overview
- 💬 Check [docs/FAQ.md](FAQ.md)
- 🐛 Report issues on [GitHub](https://github.com/PaulAtkins88/budgetwise-planner/issues)
- 🆘 See [SUPPORT.md](../SUPPORT.md)

---

**Questions?** Check the [FAQ](FAQ.md) or open an issue on GitHub!
