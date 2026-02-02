# Bucketwise Planner – OSS & Awesome Self-Hosted Preparation Plan

## Overview

Transform Budget App into **Bucketwise Planner**: a public, community-driven OSS project implementing Scott Pape's Barefoot Investor methodology. Prepare for Awesome Self-Hosted submission with proper attribution, security hygiene, documentation, and Docker-ready self-hosting.

**Key Decisions:**
- **Name**: Bucketwise Planner
- **License**: MIT (permissive, community-friendly)
- **Attribution**: Prominent credit to Scott Pape and Barefoot Investor methodology
- **Auth Model**: Multi-user by default (JWT-based signup/login per instance)
- **AI Advisor**: Optional (graceful degradation with friendly UX when GEMINI_API_KEY not set)
- **GitHub Repo**: https://github.com/PaulAtkins88/budgetwise-planner.git
- **Awesome Self-Hosted**: Submit now (v0.1.0), acknowledge bugs/community iteration

---

## Files to Create

### Community & Governance

#### LICENSE
- **Path**: `/LICENSE`
- **Content**: MIT license text with SPDX identifier
- **Copyright**: Copyright (c) 2026 Paul Atkins
- **Note**: Free use, modification, distribution; no liability

#### CONTRIBUTING.md
- **Path**: `/CONTRIBUTING.md`
- **Sections**:
  - Welcome message: community project, Barefoot Investor credit
  - How to contribute: bug reports, feature requests, PRs
  - Local development setup: pnpm workspace, backend + frontend dev servers
  - Code style: TypeScript strict, ESM, interfaces vs types, date normalization (formatDateToISO)
  - Testing: Vitest commands (backend), coverage expectations
  - Commit messages: Conventional Commits format (feat:, fix:, docs:, etc.)
  - PR process: fork → branch → PR → review → merge; link to PR template
  - Code of Conduct: link to CODE_OF_CONDUCT.md
  - Issue templates: bug/feature templates available in .github/ISSUE_TEMPLATE/

#### CODE_OF_CONDUCT.md
- **Path**: `/CODE_OF_CONDUCT.md`
- **Content**: Contributor Covenant v2.1 (standard template)
- **Enforcement**: contact email/method for reporting violations
- **Scope**: applies to project spaces (repo, issues, PRs, discussions)

#### SECURITY.md
- **Path**: `/SECURITY.md`
- **Sections**:
  - Reporting vulnerabilities: GitHub Security Advisories or private email
  - Supported versions: currently v0.1.0+; patch policy
  - Response timeline: acknowledgment within 48 hours, fix within 7 days for critical
  - Secrets management: never commit secrets; rotate immediately if exposed
  - Password hashing: bcryptjs; JWT secrets must be strong (>32 chars)
  - Disclosure policy: coordinated disclosure; credit to reporters

#### SUPPORT.md
- **Path**: `/SUPPORT.md`
- **Sections**:
  - Getting help: GitHub Issues for bugs, Discussions for questions
  - Documentation: link to /docs, README, SELF_HOSTING.md
  - Community: encourage contributions, PRs welcome
  - Response expectations: best-effort; community-driven

#### CHANGELOG.md
- **Path**: `/CHANGELOG.md`
- **Format**: Keep a Changelog (https://keepachangelog.com)
- **Initial entry**:
  ```markdown
  # Changelog

  All notable changes to Bucketwise Planner will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
  and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

  ## [0.1.0] - 2026-01-10

  ### Added
  - Initial release of Bucketwise Planner
  - Fortnightly bucket-based budgeting (Daily Expenses, Splurge, Smile, Fire Extinguisher)
  - Debt snowball prioritization and payoff timeline
  - Transaction tracking (income, expenses, debt payments)
  - Multi-user authentication (JWT-based signup/login)
  - Optional AI financial advisor (Google Gemini integration)
  - Docker Compose deployment
  - PostgreSQL backend with node-postgres
  - React + Mantine UI with dark theme
  - Barefoot Investor methodology implementation (credit: Scott Pape)

  [0.1.0]: https://github.com/PaulAtkins88/budgetwise-planner/releases/tag/v0.1.0
  ```

#### .env.example (Root)
- **Path**: `/.env.example`
- **Content**:
  ```bash
  # PostgreSQL Connection (required)
  PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/budgetwise

  # Backend Environment
  NODE_ENV=production
  PORT=3000

  # JWT Secret (generate strong random string, min 32 chars)
  JWT_SECRET=your-random-jwt-secret-here

  # Admin Secret (for admin operations)
  ADMIN_SECRET=your-admin-secret-here

  # AI Advisor (optional - leave empty to disable chat feature)
  GEMINI_API_KEY=
  AI_ENABLED=false

  # Storage Method
  STORAGE_METHOD=postgres
  ```

#### backend/.env.example
- **Path**: `/backend/.env.example`
- **Content**:
  ```bash
  # Development environment
  NODE_ENV=development
  PORT=3000

  # Database (required)
  PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/budgetwise

  # Storage method
  STORAGE_METHOD=postgres

  # Authentication secrets (generate strong random strings)
  JWT_SECRET=your-random-jwt-secret-min-32-chars
  ADMIN_SECRET=your-admin-secret-here

  # AI Advisor (optional - Google AI Studio API key)
  # Get free key at: https://aistudio.google.com/
  GEMINI_API_KEY=
  AI_ENABLED=false

  # Note: If AI_ENABLED=false or GEMINI_API_KEY is empty,
  # chat routes will be disabled and the app will start normally.
  ```

#### frontend/.env.example
- **Path**: `/frontend/.env.example`
- **Content**:
  ```bash
  # API Base URL (backend endpoint)
  VITE_API_BASE=http://localhost:3000

  # For production, update to your domain:
  # VITE_API_BASE=https://your-domain.com
  ```

---

### Documentation (docs/)

#### docs/SELF_HOSTING.md
- **Path**: `/docs/SELF_HOSTING.md`
- **Sections**:
  - Prerequisites: Docker + Compose (or Node.js 18+, PostgreSQL 14+, pnpm 8+)
  - Quick Start with Docker Compose:
    - Clone repo
    - Copy .env.example to .env
    - Set required vars (PG_CONNECTION_STRING, JWT_SECRET, ADMIN_SECRET)
    - Optional: set GEMINI_API_KEY for AI chat
    - Run `docker compose up -d`
    - Access at http://localhost:5555
  - Manual Development Setup:
    - Install dependencies: `pnpm install`
    - Backend: cd backend, copy .env.example, run migrations (manual), `pnpm dev`
    - Frontend: cd frontend, copy .env.example, `pnpm dev`
  - Database Setup:
    - PostgreSQL schema creation (manual migrations; see backend/README.md)
    - Connection string format
    - Backup/restore recommendations
  - Environment Variables:
    - Required: PG_CONNECTION_STRING, JWT_SECRET, ADMIN_SECRET
    - Optional: GEMINI_API_KEY (for AI advisor), AI_ENABLED
    - Frontend: VITE_API_BASE
  - Reverse Proxy (Nginx/Caddy):
    - Sample Nginx config for TLS termination
    - CORS and API proxy pass to backend
    - Static frontend serving
  - Troubleshooting:
    - Port conflicts (3000 backend, 5555 frontend)
    - Database connection errors
    - Date handling (timezone normalization)
    - AI chat not appearing (check GEMINI_API_KEY and AI_ENABLED)
    - JWT errors (secret mismatch, token expiry)

#### docs/ARCHITECTURE.md
- **Path**: `/docs/ARCHITECTURE.md`
- **Sections**:
  - Overview: monorepo structure (backend + frontend)
  - Backend Architecture:
    - Domain-Driven Design (DDD) layers
    - Link to backend/ARCHITECTURE.md for full details
    - Key concepts: Money (cents), Debt (snowball), Fortnight (budgeting period), Allocation (bucket percentages)
  - Frontend Architecture:
    - React + Vite + TypeScript + Mantine
    - Views: DashboardView, FortnightView, TransactionsView, DebtsView, ProfileView
    - Components: reusable UI (FortnightSelector, HelpDrawer, ChatWidget, Badges)
    - State management: API client with typed fetch wrapper
    - Theme: dark custom Mantine (navy/slate + teal/amber)
  - Tech Stack Summary:
    - Backend: Node.js, Express v5, TypeScript (ESM), PostgreSQL, Zod validation
    - Frontend: React 18, Vite 7, Mantine v8.3.10, Tabler Icons
    - AI: Google Gen AI SDK (optional)
    - Testing: Vitest (54+ passing tests)
  - Key Patterns:
    - Date normalization: formatDateToISO() utility (prevents timezone bugs)
    - API envelope: ApiResponse<T> wrapper for all responses
    - Error handling: domain errors → HTTP mapping via ErrorMapper
    - Validation: Zod schemas in application/dtos/schemas, middleware-applied
  - Barefoot Investor Concepts:
    - Buckets: Daily Expenses (60%), Splurge (10%), Smile (10%), Fire Extinguisher (20%)
    - Debt Snowball: prioritize debts, minimum payments on all except priority 1
    - Fortnightly budgeting: aligned with income cycles
    - Timeline: fortnights (not months)
  - Credit: Inspired by Scott Pape's *Barefoot Investor* methodology (https://www.barefootinvestor.com/)

#### docs/AI_ADVISOR.md
- **Path**: `/docs/AI_ADVISOR.md`
- **Sections**:
  - Overview: Optional AI financial advisor using Google Gemini 2.5 Flash
  - How It Works:
    - Analyzes live budget data (income, debts, allocations, transactions)
    - Provides personalized advice based on Barefoot Investor principles
    - System prompt trained on bucket methodology and debt snowball
  - Enabling AI Chat:
    - Get free API key from https://aistudio.google.com/
    - Set GEMINI_API_KEY in backend .env
    - Set AI_ENABLED=true
    - Restart backend
  - Privacy & Security:
    - Messages sent to Google AI (third-party)
    - No chat history stored permanently (ephemeral context only)
    - API key must remain secret
    - Rate limits apply (Google free tier)
  - UX: 
    - Chat bubble in top-right header
    - Keyboard shortcut: ⌘/ (Cmd+Slash)
    - If disabled: friendly banner "AI Chat disabled — add GEMINI_API_KEY to enable"
  - Third-Party Dependency:
    - Google Gen AI SDK (@google/genai v1.34.0)
    - Not required for core functionality (optional feature)
  - Credit: AI trained on Scott Pape's publicly available Barefoot Investor methodology

#### docs/CONTRIBUTING.md
- **Path**: `/docs/CONTRIBUTING.md`
- **Content**: Mirror or link to root /CONTRIBUTING.md; add quick dev commands:
  - Backend: `cd backend && pnpm dev`
  - Frontend: `cd frontend && pnpm dev`
  - Tests: `cd backend && pnpm test`
  - Type check: `pnpm exec tsc --noEmit`

#### docs/SECURITY.md
- **Path**: `/docs/SECURITY.md`
- **Content**: Mirror or link to root /SECURITY.md; add app-specific notes:
  - Password hashing: bcryptjs (10 rounds)
  - JWT secrets: min 32 chars, rotate regularly
  - Environment variables: never commit .env files
  - Database: parameterized queries (SQL injection prevention)
  - CORS: configure properly for production

#### docs/FAQ.md
- **Path**: `/docs/FAQ.md`
- **Sections**:
  - Q: What is Bucketwise Planner?
    - A: Multi-user budgeting app implementing Scott Pape's Barefoot Investor bucket method and debt snowball.
  - Q: How do I self-host it?
    - A: See docs/SELF_HOSTING.md; Docker Compose is recommended.
  - Q: Do I need a Google AI key?
    - A: No, AI advisor is optional. Set GEMINI_API_KEY to enable chat feature.
  - Q: Is this multi-user or single-user?
    - A: Multi-user by default. Each self-hosted instance supports signup/login for multiple users.
  - Q: How does the debt snowball work?
    - A: Prioritize debts (1 = highest). Pay minimum on all except priority 1. Fire Extinguisher bucket amount goes to priority 1.
  - Q: Why fortnightly instead of monthly?
    - A: Aligns with typical income cycles (biweekly paychecks). Barefoot Investor recommends this cadence.
  - Q: How do I fix date/timezone issues?
    - A: Always use formatDateToISO() utility (frontend/src/utils/formatters.ts) to normalize dates to YYYY-MM-DD.
  - Q: Can I contribute?
    - A: Yes! See CONTRIBUTING.md. PRs welcome for bug fixes, features, docs, tests.
  - Q: What license?
    - A: MIT — free for personal and commercial use.

---

### GitHub Templates & Config

#### .github/ISSUE_TEMPLATE/bug_report.md
- **Path**: `/.github/ISSUE_TEMPLATE/bug_report.md`
- **Content**:
  ```markdown
  ---
  name: Bug Report
  about: Report a bug or unexpected behavior
  title: '[BUG] '
  labels: bug
  assignees: ''
  ---

  ## Description
  A clear and concise description of the bug.

  ## Steps to Reproduce
  1. Go to '...'
  2. Click on '...'
  3. See error

  ## Expected Behavior
  What you expected to happen.

  ## Actual Behavior
  What actually happened.

  ## Screenshots
  If applicable, add screenshots to help explain the problem.

  ## Environment
  - **OS**: [e.g., macOS 14.2, Ubuntu 22.04, Windows 11]
  - **Browser**: [e.g., Chrome 120, Firefox 121, Safari 17]
  - **Bucketwise Planner Version**: [e.g., v0.1.0]
  - **Deployment**: [e.g., Docker Compose, manual dev]

  ## Additional Context
  Add any other context about the problem here (logs, error messages, etc.).
  ```

#### .github/ISSUE_TEMPLATE/feature_request.md
- **Path**: `/.github/ISSUE_TEMPLATE/feature_request.md`
- **Content**:
  ```markdown
  ---
  name: Feature Request
  about: Suggest a new feature or enhancement
  title: '[FEATURE] '
  labels: enhancement
  assignees: ''
  ---

  ## Problem Statement
  Describe the problem or need this feature would address.

  ## Proposed Solution
  A clear and concise description of what you want to happen.

  ## Use Case
  How would this feature be used? Who benefits?

  ## Acceptance Criteria
  - [ ] Criterion 1
  - [ ] Criterion 2

  ## Alternatives Considered
  Describe any alternative solutions or features you've considered.

  ## Additional Context
  Add any other context, mockups, or examples.
  ```

#### .github/PULL_REQUEST_TEMPLATE.md
- **Path**: `/.github/PULL_REQUEST_TEMPLATE.md`
- **Content**:
  ```markdown
  ## Description
  What does this PR do? Summarize the changes.

  ## Related Issues
  Closes #[issue number]

  ## Changes Made
  - [ ] Added feature X
  - [ ] Fixed bug Y
  - [ ] Updated docs

  ## Type of Change
  - [ ] Bug fix (non-breaking change which fixes an issue)
  - [ ] New feature (non-breaking change which adds functionality)
  - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
  - [ ] Documentation update

  ## Testing
  - [ ] Tests added/updated
  - [ ] All tests passing (`pnpm test`)
  - [ ] Type check passing (`pnpm exec tsc --noEmit`)

  ## Screenshots (if applicable)
  Add screenshots for UI changes.

  ## Checklist
  - [ ] My code follows the style guidelines (see CONTRIBUTING.md)
  - [ ] I have performed a self-review
  - [ ] I have commented my code where necessary
  - [ ] I have updated documentation
  - [ ] My changes generate no new warnings
  - [ ] I have added tests that prove my fix is effective or that my feature works
  - [ ] New and existing unit tests pass locally
  ```

#### .github/CODEOWNERS
- **Path**: `/.github/CODEOWNERS`
- **Content**:
  ```
  # Global owner
  * @PaulAtkins88

  # Backend
  /backend/ @PaulAtkins88

  # Frontend
  /frontend/ @PaulAtkins88

  # Documentation
  /docs/ @PaulAtkins88
  *.md @PaulAtkins88

  # Configuration
  /.github/ @PaulAtkins88
  docker-compose.yml @PaulAtkins88
  ```

---

### Awesome Self-Hosted Submission

#### software/bucketwise-planner.yml
- **Path**: `/software/bucketwise-planner.yml` (local staging; will be submitted via PR to awesome-selfhosted-data repo)
- **Content**:
  ```yaml
  name: Bucketwise Planner
  description: >
    Multi-user personal budgeting app implementing Scott Pape's Barefoot Investor
    bucket-based allocation strategy (60/10/10/20 split) and debt snowball payoff method.
    Features fortnightly budgeting cycles, transaction tracking, debt prioritization with
    payoff timeline, and optional AI financial advisor powered by Google Gemini.
  website_url: https://github.com/PaulAtkins88/budgetwise-planner
  source_code_url: https://github.com/PaulAtkins88/budgetwise-planner
  licenses:
    - MIT
  platforms:
    - Docker
    - Nodejs
  tags:
    - Personal Finance
    - Budgeting
    - Debt Management
    - Money Management
  depends_3rdparty: false
  # Note: AI advisor requires Google AI Studio API key but is optional (disabled by default).
  # Core functionality (budgeting, debt tracking) works without third-party services.
  related_software_url: https://www.barefootinvestor.com/
  ```

---

## Files to Modify

### README.md
- **Path**: `/README.md`
- **Changes**:
  - **Title**: Change "# Budget App - Barefoot Investor Method" → "# Bucketwise Planner"
  - **Subtitle/Tagline**: Add: "Implementing Scott Pape's Barefoot Investor methodology for fortnightly budgeting, bucket-based allocations, and debt snowball payoff."
  - **Attribution Section (add prominently after title)**:
    ```markdown
    ## 🙏 Acknowledgments

    This project implements the budgeting methodology created by **Scott Pape** in his book *[The Barefoot Investor](https://www.barefootinvestor.com/)*. The bucket-based allocation strategy (60% Daily Expenses, 10% Splurge, 10% Smile, 20% Fire Extinguisher) and debt snowball method are core principles from his work, which has helped millions of Australians take control of their finances.

    **Learn more**: [www.barefootinvestor.com](https://www.barefootinvestor.com/)

    This is a community-driven open-source implementation, not affiliated with or endorsed by Scott Pape or The Barefoot Investor.
    ```
  - **Features Section**: Replace "Barefoot Buckets" with "Bucket Allocations" or "Four Buckets System" (but keep parenthetical explanation of the 60/10/10/20 split)
  - **AI Chat Advisor**: Update to clarify optional nature: "Optional AI financial advisor powered by Google Gemini (requires free API key from AI Studio)"
  - **Architecture Section**: Update "single-user" claims → "Multi-user with JWT authentication (signup/login per instance)"
  - **Screenshots Section (add after Features)**:
    ```markdown
    ## 📸 Screenshots

    ### Dashboard
    ![Dashboard](screenshots/01-dashboard.png)

    ### Fortnights View
    ![Fortnights](screenshots/02-fortnights.png)

    ### Debts Management
    ![Debts](screenshots/03-debts.png)

    ### Transactions Tracking
    ![Transactions](screenshots/04-transactions.png)
    ```
  - **Getting Started**: Update env setup instructions to reference .env.example files
  - **Environment Variables**: Replace hardcoded examples with references to .env.example; clarify GEMINI_API_KEY is optional
  - **Contributing**: Add link to CONTRIBUTING.md
  - **License**: Add badge and section:
    ```markdown
    ## 📄 License

    MIT License - see [LICENSE](LICENSE) for details.

    [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
    ```
  - **Badges (add at top after title)**:
    ```markdown
    [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
    [![Tests](https://img.shields.io/badge/tests-54%20passing-brightgreen)](https://github.com/PaulAtkins88/budgetwise-planner)
    [![Release](https://img.shields.io/badge/release-v0.1.0-blue)](https://github.com/PaulAtkins88/budgetwise-planner/releases)
    ```

### docker-compose.yml
- **Path**: `/docker-compose.yml`
- **Changes**:
  - **Remove all hard-coded secrets**:
    - `GEMINI_API_KEY: AIzaSyBdBqlFTWdNGXYanAIQ6VU-cOfkFx_h7Tg` → `GEMINI_API_KEY: ${GEMINI_API_KEY:-}`
    - `JWT_SECRET: ${JWT_SECRET:-6323798687b06b3e93828ee7657ed455}` → `JWT_SECRET: ${JWT_SECRET}`
    - `ADMIN_SECRET: ${ADMIN_SECRET:-8Chifley}` → `ADMIN_SECRET: ${ADMIN_SECRET}`
    - `PG_CONNECTION_STRING: ${PG_CONNECTION_STRING:-postgres://postgres:password@192.168.68.81:5432/budget_app}` → `PG_CONNECTION_STRING: ${PG_CONNECTION_STRING}`
  - **Add AI_ENABLED env var**:
    ```yaml
    AI_ENABLED: ${AI_ENABLED:-false}
    ```
  - **Update x-casaos metadata**:
    - `title.en_us: Budget App` → `title.en_us: Bucketwise Planner`
    - `description.en_us: Barefoot budgeting app...` → `description.en_us: Multi-user budgeting app with bucket allocations and debt snowball payoff`
    - `tagline.en_us: Barefoot budgeting dashboard` → `tagline.en_us: Personal finance planner with fortnightly budgeting`
  - **Add healthchecks** (optional but recommended):
    ```yaml
    backend:
      # ... existing config
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 40s

    frontend:
      # ... existing config
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:80"]
        interval: 30s
        timeout: 10s
        retries: 3
    ```
  - **Add Postgres service** (optional; alternatively document external DB in SELF_HOSTING.md):
    ```yaml
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_DB: budgetwise
        POSTGRES_USER: ${POSTGRES_USER:-budgetwise}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      volumes:
        - postgres_data:/var/lib/postgresql/data
      ports:
        - "5432:5432"
      networks:
        - oasis
      restart: unless-stopped
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-budgetwise}"]
        interval: 10s
        timeout: 5s
        retries: 5

    volumes:
      postgres_data:
    ```
  - **Update backend depends_on** (if Postgres service added):
    ```yaml
    backend:
      depends_on:
        postgres:
          condition: service_healthy
    ```

### .github/copilot-instructions.md
- **Path**: `/.github/copilot-instructions.md`
- **Changes**:
  - **Project Overview**: Update name to Bucketwise Planner
  - **Add Attribution**:
    ```markdown
    ## Attribution

    This project implements the budgeting methodology from Scott Pape's *The Barefoot Investor* book ([barefootinvestor.com](https://www.barefootinvestor.com/)). When referencing the bucket system or debt snowball, credit the source. Use generic terms like "bucket allocations" or "debt accelerator" in code/UI, but acknowledge inspiration in docs.
    ```
  - **Architecture Section**: Update "single-user" → "multi-user with JWT authentication"
  - **Current Implementation Details**: Remove outdated claims about no auth; clarify JWT routes (/auth/signup, /auth/login, /auth/refresh)
  - **API Endpoints**: Add auth endpoints section:
    ```markdown
    ### Authentication
    - `POST /auth/signup` — create user account
    - `POST /auth/login` — authenticate and receive JWT
    - `POST /auth/refresh` — refresh access token
    - `GET /auth/me` — get current user profile
    ```
  - **Environment Variables**: Update to reference .env.example files; clarify GEMINI_API_KEY is optional
  - **For External Contributors**: Add section:
    ```markdown
    ## For External Contributors

    Welcome! This is a community project. To get started:

    1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for setup and code style
    2. Review [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for system design
    3. Check [docs/FEATURE_WISHLIST.md](../docs/FEATURE_WISHLIST.md) for ideas
    4. Run tests before submitting PRs: `pnpm test`
    5. Follow Conventional Commits: feat:, fix:, docs:, etc.

    **AI Advisor**: Optional feature requiring Google AI Studio key. Core app works without it.

    **Date Handling**: Always use `formatDateToISO()` utility to prevent timezone bugs.

    **Domain-Driven Design**: Keep domain layer pure (no Express/Zod/DB in entities). See backend/ARCHITECTURE.md.
    ```
  - **File References**: Update paths to reflect new docs structure

### backend/README.md
- **Path**: `/backend/README.md`
- **Changes**:
  - Update title/description to reference Bucketwise Planner
  - Update "single-user" claims → "multi-user with JWT authentication"
  - Add section on AI Advisor:
    ```markdown
    ## AI Advisor (Optional)

    The AI financial advisor is powered by Google Gemini 2.5 Flash. To enable:

    1. Get free API key from https://aistudio.google.com/
    2. Set `GEMINI_API_KEY` in `.env`
    3. Set `AI_ENABLED=true`
    4. Restart backend

    If `AI_ENABLED=false` or `GEMINI_API_KEY` is empty, chat routes are disabled and the app starts normally. No errors will occur.
    ```
  - Update setup instructions to reference backend/.env.example
  - Add note about JWT_SECRET and ADMIN_SECRET requirements

### frontend/README.md
- **Path**: `/frontend/README.md`
- **Changes**:
  - Update title/description to reference Bucketwise Planner
  - Update "single-user" → "multi-user; signup/login flow with JWT"
  - Add AI Chat section:
    ```markdown
    ## AI Chat Widget

    Optional feature that appears in the top-right header (teal chat bubble). Requires backend to have `GEMINI_API_KEY` set. If disabled, frontend shows a friendly message: "AI Chat disabled — see README to enable."

    Keyboard shortcut: `⌘/` (Cmd+Slash) or `Ctrl+/`

    See [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) for details.
    ```
  - Update dev setup to reference frontend/.env.example

### backend/ARCHITECTURE.md
- **Path**: `/backend/ARCHITECTURE.md`
- **Changes**:
  - Update title to "Bucketwise Planner Backend Architecture"
  - Add attribution to Scott Pape/Barefoot Investor at top
  - Update "single-user" references → "multi-user (JWT-based per instance)"
  - Clarify auth middleware applies to all /api/* routes
  - Update bucket naming to be neutral ("Daily Expenses bucket" not "Barefoot Daily Expenses")

---

## Files to Delete

**Obsolete docs** (implementation complete; no longer useful for contributors):
- `/docs/plan-ownYourHomeMortgageSimulator.prompt.md`
- `/docs/plan-chatContextEnhancement.prompt.md` (if exists in .github/prompts, delete from docs/)
- `/docs/TESTING_CHAT_CONTEXT.md` (contains test credentials; stale)
- `/docs/CHATBOT_IMPLEMENTATION.md` (replaced by docs/AI_ADVISOR.md)
- `/docs/CHAT_WIDGET_IMPLEMENTATION.md` (replaced by docs/AI_ADVISOR.md)
- `/docs/CHAT_WIDGET_QUICKSTART.md` (replaced by docs/AI_ADVISOR.md)
- `/docs/OWNHOME_DESIGN.md` (mortgage simulator not in app)
- `/docs/OWNHOME_IMPLEMENTATION_SUMMARY.md` (mortgage simulator not in app)
- `/docs/NOTIFICATIONS.md` (future feature, not implemented; can move to FEATURE_WISHLIST if valuable)
- `/docs/llms.txt` (vendor dump; not useful for contributors)

**Keep and update**:
- `/docs/FEATURE_WISHLIST.md` — Useful for contributors; update to remove completed items (AI Chat, auth), add community contribution ideas

---

## Files to Refactor (Code Changes)

### Backend Code

**Search & Replace (conceptual; actual implementation via code edits)**:
- Rename any `BareFootBucketType` → `BucketType` (or similar generic names)
- Update UI strings: "Barefoot Advisor" → "AI Advisor" in system prompts/constants
- Ensure `AI_ENABLED` env var gates chat route registration in server.ts:
  ```typescript
  // server.ts (pseudocode)
  if (process.env.AI_ENABLED === 'true' && process.env.GEMINI_API_KEY) {
    app.use('/api/chat', authMiddleware, chatRoutes);
  } else {
    console.log('AI Advisor disabled (AI_ENABLED=false or GEMINI_API_KEY not set)');
  }
  ```
- Add /health endpoint for Docker healthchecks:
  ```typescript
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  ```

### Frontend Code

**Changes**:
- Update any "Barefoot" UI strings → generic (e.g., "Barefoot Advisor" → "AI Advisor")
- Add friendly message when AI chat is disabled (check API response or add banner in ChatWidget):
  ```typescript
  // ChatWidget.tsx (pseudocode)
  if (!chatEnabled) {
    return (
      <Alert color="blue">
        AI Chat is disabled. To enable, add <Code>GEMINI_API_KEY</Code> to backend .env and set <Code>AI_ENABLED=true</Code>.
        <br />
        See <Anchor href="https://github.com/PaulAtkins88/budgetwise-planner#ai-advisor">README</Anchor> for instructions.
      </Alert>
    );
  }
  ```

---

## Screenshot Instructions (for user to complete)

**Capture 4 screenshots (PNG format, 1280x720 or similar resolution):**

1. **Dashboard View** (`/dashboard`)
   - Show: Current fortnight overview with bucket allocations (Daily Expenses, Splurge, Smile, Fire Extinguisher)
   - Show: Debt summary card with total balance and next priority payment
   - Show: Payoff timeline chart (if visible)
   - Ensure: Some realistic data (transactions, debts) so it's not empty state

2. **Fortnights View** (`/fortnights`)
   - Show: Fortnight selector with navigation
   - Show: Bucket breakdown table with allocated/spent/remaining for each bucket
   - Show: Some transactions visible in the list

3. **Debts View** (`/debts`)
   - Show: Debt list with priorities, balances, minimum payments
   - Show: Snowball payment section (priority 1 highlighted)
   - Show: Payoff plan timeline or chart if visible

4. **Transactions View** (`/transactions`)
   - Show: Transaction list with filters (bucket, kind, date range)
   - Show: Add transaction form/button
   - Show: Mix of income/expense/debt payment transactions with dates and amounts

**File placement:**
- Create folder: `/screenshots/`
- Save as:
  - `screenshots/01-dashboard.png`
  - `screenshots/02-fortnights.png`
  - `screenshots/03-debts.png`
  - `screenshots/04-transactions.png`

These will be referenced in README.md.

---

## Execution Checklist

- [ ] Create all new files (LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, SUPPORT.md, CHANGELOG.md)
- [ ] Create .env.example files (root, backend/, frontend/)
- [ ] Create docs/ files (SELF_HOSTING.md, ARCHITECTURE.md, AI_ADVISOR.md, CONTRIBUTING.md, SECURITY.md, FAQ.md)
- [ ] Create GitHub templates (.github/ISSUE_TEMPLATE/*, PULL_REQUEST_TEMPLATE.md, CODEOWNERS)
- [ ] Update README.md (title, attribution, badges, screenshots, auth model, env vars, license)
- [ ] Update docker-compose.yml (remove secrets, add env var placeholders, update CasaOS metadata, add healthchecks)
- [ ] Update .github/copilot-instructions.md (multi-user, AI optional, external contributors section)
- [ ] Update backend/README.md (AI optional, env examples, multi-user)
- [ ] Update frontend/README.md (AI optional, env examples, multi-user)
- [ ] Update backend/ARCHITECTURE.md (Bucketwise name, attribution, multi-user)
- [ ] Delete obsolete docs (plan-*, llms.txt, TESTING_CHAT_CONTEXT.md, old chat docs, OWNHOME_*.md, NOTIFICATIONS.md)
- [ ] Update docs/FEATURE_WISHLIST.md (remove completed items, add community ideas)
- [ ] Backend code changes: gate AI routes with AI_ENABLED, add /health endpoint, rename "Barefoot" strings
- [ ] Frontend code changes: update "Barefoot" UI strings, add friendly AI-disabled message
- [ ] User captures screenshots (4 images in /screenshots/)
- [ ] Create GitHub repo release v0.1.0 with CHANGELOG notes
- [ ] Draft Awesome Self-Hosted YAML (software/bucketwise-planner.yml)
- [ ] Submit PR to awesome-selfhosted-data repo (after screenshots and v0.1.0 release)

---

## Post-Launch Tasks

- [ ] Rotate/invalidate all exposed secrets (GEMINI_API_KEY, JWT_SECRET, ADMIN_SECRET)
- [ ] Purge secrets from git history (BFG Repo-Cleaner or git filter-repo)
- [ ] Add .gitignore entry for .env files (if not already present)
- [ ] Monitor GitHub Issues for bugs and community feedback
- [ ] Respond to Awesome Self-Hosted PR review comments
- [ ] Plan v0.2.0 roadmap based on community input
- [ ] Consider adding CI/CD (GitHub Actions) for automated tests/builds in future releases
- [ ] Add Dependabot or Renovate for dependency updates

---

## Notes

- **Awesome Self-Hosted timeline**: The contributing guide recommends waiting 4+ months after first release before submitting. However, user has chosen to submit now and iterate with community feedback. Acknowledge this in the YAML/PR description: "Initial release, expecting bugs and community contributions."

- **Domain/GitHub URL**: Confirmed as https://github.com/PaulAtkins88/budgetwise-planner.git

- **License reasoning**: MIT chosen for broad adoption, permissive use, and community-friendly ethos. No commercial restrictions.

- **Multi-user clarification**: App is multi-user by default (each instance supports multiple users via signup/login). Not a single-tenant SaaS; each self-hosted deployment is independent.

- **AI dependency**: Awesome Self-Hosted prefers apps without third-party dependencies. AI advisor is optional and disabled by default (depends_3rdparty: false), so this should not disqualify the app.

- **Screenshots**: User will capture after plan execution. Placeholder references added to README.md.

- **Bucket naming**: Keep parenthetical explanations (60/10/10/20) and credit to Scott Pape, but avoid trademarked "Barefoot Investor" in UI strings where possible. Use neutral terms like "Daily Expenses bucket" or "Fire Extinguisher allocation."

- **Testing**: Current 54 passing tests noted. No new tests required for this plan, but contributors should maintain coverage.

- **Docker readiness**: Dockerfiles exist for backend and frontend. Compose file will be updated to remove secrets and add optional Postgres service. Healthchecks added for robustness.

- **Date handling**: Critical pattern (formatDateToISO) documented in copilot instructions and should be emphasized in CONTRIBUTING.md.

- **Git history cleanup**: User has backed up secrets; safe to edit docker-compose.yml and delete .env. Post-launch, purge history with BFG or filter-repo to remove exposed keys from all commits.
