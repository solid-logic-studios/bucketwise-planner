# Bucketwise Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-54%20passing-brightgreen)](https://github.com/PaulAtkins88/budgetwise-planner)
[![Release](https://img.shields.io/badge/release-v0.1.0-blue)](https://github.com/PaulAtkins88/budgetwise-planner/releases)

Multi-user budgeting app implementing Scott Pape's Barefoot Investor methodology. Fortnightly budgeting with bucket allocations (60/10/10/20), automated debt snowball payoff, transaction tracking, and optional AI financial advisor.

## 🙏 Acknowledgments

This project implements the budgeting methodology created by **Scott Pape** in his book *[The Barefoot Investor](https://www.barefootinvestor.com/)*. The bucket-based allocation strategy (60% Daily Expenses, 10% Splurge, 10% Smile, 20% Fire Extinguisher) and debt snowball method are core principles from his work, which has helped millions of people take control of their finances.

**Learn more**: [www.barefootinvestor.com](https://www.barefootinvestor.com/)

*This is a community-driven open-source implementation, not affiliated with or endorsed by Scott Pape or The Barefoot Investor.*

## 🎯 Features

### Core Functionality
- **Fortnightly Budgeting**: Budget cycles aligned with income (biweekly paychecks)
- **Bucket Allocations**: 60% Daily Expenses, 10% Splurge, 10% Smile, 20% Fire Extinguisher
- **Debt Snowball**: Prioritize debts, automated payoff timeline with fortnightly cadence
- **Transaction Tracking**: Record income, expenses, debt payments with bucket assignments
- **Payoff Planning**: Visual timeline showing when each debt will be paid off
- **Multi-User**: JWT-based signup/login (one instance = multiple users)
- **Dashboard**: Quick overview of current fortnight, debt summary, and projections

### Optional AI Advisor 🤖
- **Financial Guidance**: Personalized advice based on your live budget
- **Barefoot-Aligned**: Trained on debt snowball and bucket methodology principles
- **Privacy-Focused**: No chat history stored (ephemeral context only)
- **Disabled by Default**: Requires optional Google API key to enable
- **Access**: Teal chat bubble (top-right) or press `⌘/`

## 🏗️ Architecture

### Backend
- **Framework**: Node.js + Express v5 + TypeScript (ESM)
- **Database**: PostgreSQL via node-postgres
- **Architecture**: Domain-Driven Design (DDD) with clean layers
  - Domain Layer: Pure business logic (Money, Debt, Fortnight, Allocation)
  - Application Layer: Use cases, DTOs, Zod schemas
  - Infrastructure Layer: PostgreSQL repositories, in-memory adapters
  - Presentation Layer: HTTP controllers, middleware, routes
- **Optional AI**: Google Gen AI SDK (`@google/genai` v1.34.0) with Gemini 2.5 Flash (disabled by default)
- **Testing**: Vitest (54+ passing tests)

### Frontend
- **Framework**: React 18 + Vite 7 + TypeScript
- **UI Library**: Mantine v8.3.10 (dark theme, navy/slate + teal/amber)
- **State**: Type-safe API client, minimal local state
- **Components**: Reusable UI (Selectors, Help system, ChatWidget, Badges, States)
- **Accessibility**: Keyboard shortcuts, tooltips, dark mode

### Self-Hosted, Multi-Tenant Per Instance
- Each deployment is independent (no centralized cloud)
- Multiple users per instance via JWT authentication
- No SaaS dependency — full data ownership

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/01-dashboard.png)

### Fortnights View
![Fortnights](screenshots/02-fortnights.png)

### Debts Management
![Debts](screenshots/03-debts.png)

### Transactions Tracking
![Transactions](screenshots/04-transactions.png)

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/PaulAtkins88/budgetwise-planner.git
cd budgetwise-planner

# Copy environment template
cp .env.example .env

# Edit .env with your database details and secrets
# (see .env.example for all variables)

# Start services
docker compose up -d

# Access at http://localhost:5555
# Create account via "Sign Up"
```

**Full deployment guide:** [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md)

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit with your database credentials

# Terminal 1: Backend
cd backend && pnpm dev  # http://localhost:3000

# Terminal 2: Frontend
cd frontend && pnpm dev  # http://localhost:5173
```

**Development setup details:** [CONTRIBUTING.md](CONTRIBUTING.md)

## 🔧 Configuration

### Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PG_CONNECTION_STRING` | PostgreSQL database | `postgresql://user:pass@localhost:5432/budgetwise` |
| `JWT_SECRET` | Session token secret (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `ADMIN_SECRET` | Admin operations secret (min 32 chars) | Generate with: `openssl rand -base64 32` |

### Optional Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google AI key (for chat feature) | (disabled) |
| `AI_ENABLED` | Enable AI advisor | `false` |
| `VITE_API_BASE` | Frontend API endpoint | `http://localhost:3000` |

**See .env.example files for all configuration options.**

### Enabling AI Advisor

1. Get free key from [Google AI Studio](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY` in backend `.env`
3. Set `AI_ENABLED=true`
4. Restart backend
5. Chat bubble appears in top-right header

**Full guide:** [docs/AI_ADVISOR.md](docs/AI_ADVISOR.md)

## 📚 Documentation

- **[docs/SELF_HOSTING.md](docs/SELF_HOSTING.md)** — Deployment, configuration, reverse proxy, troubleshooting
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design, DDD patterns, tech stack
- **[docs/AI_ADVISOR.md](docs/AI_ADVISOR.md)** — Optional AI feature setup and usage
- **[docs/FAQ.md](docs/FAQ.md)** — Common questions and answers
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Development setup, code style, testing
- **[backend/README.md](backend/README.md)** — Backend-specific docs
- **[frontend/README.md](frontend/README.md)** — Frontend-specific docs

## 🧪 Testing

- **54+ passing tests** (Vitest framework)
- **Unit tests:** Domain entities, value objects, use cases
- **Integration tests:** API endpoints with test database
- **Coverage:** Maintained >80% for critical paths

```bash
cd backend
pnpm test           # Run tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

## 💻 Development Commands

### Backend
```bash
cd backend
pnpm dev              # Start dev server (http://localhost:3000)
pnpm test             # Run tests
pnpm test:watch      # Watch mode
pnpm test:coverage   # Coverage report
pnpm exec tsc --noEmit  # Type check
```

### Frontend
```bash
cd frontend
pnpm dev              # Start Vite dev server (http://localhost:5173)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm exec tsc --noEmit  # Type check
```

### Workspace (Root)
```bash
pnpm install          # Install all dependencies
pnpm exec tsc --noEmit  # Type check all packages
```

## 🔑 Core Features Explained

### Bucket Allocations (60/10/10/20)

Based on Scott Pape's Barefoot Investor methodology:

- **Daily Expenses (60%)** — Essential bills, groceries, transport, utilities
- **Splurge (10%)** — Guilt-free wants, entertainment, occasional treats
- **Smile (10%)** — Long-term dreams and goals (holidays, car upgrade, dream purchase)
- **Fire Extinguisher (20%)** — Initially for debt payoff, then emergency fund, then wealth building

Percentages are customizable in your profile for your unique situation.

### Debt Snowball Method

1. **List debts** with priority (1 = pay off first)
2. **Make minimum payments** on all debts except priority 1
3. **Apply Fire Extinguisher** to priority 1 debt (the "snowball")
4. **When paid off**, roll that amount to priority 2
5. **Repeat** until debt-free
6. **Result:** Accelerating progress due to compounding effect

The app automatically calculates your payoff timeline in fortnights (2-week periods).

### Fortnightly Budgeting

- **Aligned with income:** Most people earn biweekly (fortnightly)
- **Not monthly:** Monthly budgets don't match paycheck cycles
- **Flexible:** Create as many fortnights as you need
- **Trackable:** See spent vs remaining per bucket each fortnight
- **Accurate dates:** YYYY-MM-DD format prevents timezone issues

## 🎨 Design & UX

- **Dark theme** with navy/slate base + teal/amber accents
- **Responsive design** — Works on desktop, tablet, mobile
- **Accessibility:** Keyboard shortcuts (`⌘/` for help), tooltips, ARIA labels
- **Help system:** Searchable help content with cross-page navigation
- **Consistent patterns:** Loading states, error alerts, empty states
- **Date safety:** Timezone normalization prevents off-by-one-day bugs

## 📊 Tech Stack

### Backend
- **Runtime:** Node.js 18+ (ESM modules)
- **Framework:** Express v5
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with node-postgres
- **Validation:** Zod schemas
- **Optional AI:** Google Gen AI SDK with Gemini 2.5 Flash
- **Testing:** Vitest

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 7
- **Language:** TypeScript (strict mode)
- **UI Library:** Mantine v8.3.10 with custom dark theme
- **Icons:** Tabler Icons React

### Deployment
- **Containerization:** Docker + Docker Compose
- **Recommended Proxy:** Nginx or Caddy (TLS termination)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Local development setup
- Code style and standards
- Testing requirements
- Pull request process
- Commit message conventions

**All contributions help improve Bucketwise Planner for everyone!**

## 📄 License

MIT License — Free for personal and commercial use. See [LICENSE](LICENSE) for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🆘 Support & Community

- 📖 **Documentation:** [docs/](docs/), [README files](backend/README.md)
- 💬 **Questions:** [GitHub Discussions](https://github.com/PaulAtkins88/budgetwise-planner/discussions)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/PaulAtkins88/budgetwise-planner/issues)
- 🆘 **Help:** [SUPPORT.md](SUPPORT.md) and [docs/FAQ.md](docs/FAQ.md)

## 🌟 Roadmap

Check [docs/FEATURE_WISHLIST.md](docs/FEATURE_WISHLIST.md) for planned features and community ideas.

**Contributions welcome!** Help make Bucketwise Planner better.

---

**Built with ❤️ using Domain-Driven Design, SOLID principles, and Scott Pape's Barefoot Investor methodology**

[www.barefootinvestor.com](https://www.barefootinvestor.com/)
