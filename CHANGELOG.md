# Changelog

All notable changes to Bucketwise Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-10

### Added
- Initial release of Bucketwise Planner
- Fortnightly bucket-based budgeting (60/10/10/20 allocation: Daily Expenses, Splurge, Smile, Fire Extinguisher)
- Debt snowball prioritization and payoff timeline
- Transaction tracking (income, expenses, debt payments) with bucket assignments
- Multi-user authentication (JWT-based signup/login)
- Optional AI financial advisor powered by Google Gemini 2.5 Flash
- Docker Compose deployment with PostgreSQL backend
- React + Mantine UI with dark theme and responsive design
- Global help system with searchable content and keyboard shortcuts
- Barefoot Investor methodology implementation (credit: Scott Pape)
- Domain-Driven Design backend with clean separation of concerns
- Comprehensive test suite (54+ passing tests)
- Full documentation (self-hosting, architecture, FAQ, contributing guide)

### Implementation Details
- **Backend:** Node.js + Express v5 + TypeScript (ESM), PostgreSQL via node-postgres
- **Frontend:** React 18 + Vite 7 + Mantine v8.3.10 + Tabler Icons
- **Validation:** Zod schemas for all API inputs
- **Date handling:** Timezone-safe normalization using formatDateToISO() utility
- **Error handling:** Domain errors mapped to HTTP responses via middleware
- **Testing:** Vitest with unit and integration tests

### Features
- ✅ Fortnightly budgeting aligned with income cycles
- ✅ Bucket allocations with real-time tracking (spent vs remaining)
- ✅ Transaction recording with description, amount, bucket, and date
- ✅ Debt management with priority-based snowball method
- ✅ Automated payoff timeline calculations (fortnightly cadence)
- ✅ Dashboard with quick overview (current fortnight, debt summary, payoff timeline)
- ✅ Profile configuration (income, bucket percentages, fixed expenses)
- ✅ Optional AI advisor for personalized financial guidance
- ✅ Dark theme with navy/slate + teal/amber accents
- ✅ Tooltips on complex controls
- ✅ Loading/error/empty state patterns
- ✅ Keyboard shortcuts (⌘/ for help)

### Known Limitations
- Single self-hosted instance per deployment (not SaaS)
- AI advisor requires Google API key (optional, disabled by default)
- No built-in user password recovery (self-hosted responsibility)
- No mobile app (web responsive design available)

### Attribution
Implements the Barefoot Investor methodology by **Scott Pape**.
Learn more: https://www.barefootinvestor.com/

---

[0.1.0]: https://github.com/PaulAtkins88/budgetwise-planner/releases/tag/v0.1.0
