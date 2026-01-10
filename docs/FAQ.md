# FAQ

Frequently asked questions about Bucketwise Planner.

## General

### What is Bucketwise Planner?

Bucketwise Planner is a multi-user budgeting app that implements Scott Pape's *Barefoot Investor* methodology. It helps you manage money using four buckets (Daily Expenses, Splurge, Smile, Fire Extinguisher), track transactions, and pay off debt using the snowball method.

Learn more: [www.barefootinvestor.com](https://www.barefootinvestor.com/)

### Is this affiliated with Scott Pape or The Barefoot Investor?

No, this is a **community-driven open-source project** implementing the publicly available Barefoot Investor methodology. It's not endorsed by or affiliated with Scott Pape or his published works, but credits and respects his methodology.

### Who created this?

Bucketwise Planner was created as a community project. See [CONTRIBUTING.md](../CONTRIBUTING.md) for how you can help!

### Is it free?

Yes! Bucketwise Planner is free and open-source under the **MIT License**. Use it for personal or commercial purposes with no restrictions.

---

## Features & Functionality

### Is this single-user or multi-user?

**Multi-user by default.** Each self-hosted instance supports multiple users via signup/login. However, it's not a SaaS platform — each deployment is independent.

### How do I self-host it?

See [docs/SELF_HOSTING.md](SELF_HOSTING.md). Quick start:
```bash
docker compose up -d
```

Access at http://localhost:5555 and create your account.

### What are the four buckets?

1. **Daily Expenses** (60%) — Essentials (groceries, transport, bills)
2. **Splurge** (10%) — Guilt-free wants
3. **Smile** (10%) — Long-term goals (holidays, dreams, upgrades)
4. **Fire Extinguisher** (20%) — Debt payoff → Emergency fund → Wealth

These percentages are configurable in your profile.

### Can I change the bucket percentages?

Yes! Edit your profile to customize Daily Expenses, Splurge, Smile, and Fire Extinguisher percentages. They default to 60/10/10/20 (Barefoot Investor method).

### How does the debt snowball work?

1. List your debts in priority order (1 = pay off first)
2. Make minimum payments on all debts
3. Put your Fire Extinguisher amount toward priority 1 debt
4. When priority 1 is paid off, roll the amount to priority 2
5. Repeat until debt-free

The app calculates your payoff timeline in **fortnights** (biweekly periods), not months.

### Why fortnights instead of months?

Fortnights align with typical biweekly income cycles (paychecks). This makes budgeting more accurate and relevant to real-world cash flow. See Scott Pape's Barefoot Investor book for details on this philosophy.

### Can I see my payoff timeline?

Yes! Go to **Debts → Payoff Plan**. It shows when each debt will be paid off based on your current Fire Extinguisher allocation and debt priorities.

### What's a "fortnight" in the app?

A fortnight is a budgeting period (14 days / 2 weeks). Each fortnight has:
- Bucket allocations (how much you plan to spend per bucket)
- Transactions (actual income/expenses)
- Snapshots (spent vs remaining per bucket)

You can create new fortnights, navigate between them, and track spending over time.

### Can I add transactions retroactively?

Yes! Transactions have a date field, so you can record transactions from past fortnights. Just select the correct date and fortnight.

---

## Technical & Deployment

### What are the system requirements?

**Docker (recommended):**
- Docker Engine 20.10+
- Docker Compose 2.0+

**Manual:**
- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

See [docs/SELF_HOSTING.md](SELF_HOSTING.md) for details.

### Do I need a database?

Yes, Bucketwise Planner requires PostgreSQL 14+. It's included in the Docker Compose setup, or you can use an external PostgreSQL server.

### Can I use it without Docker?

Yes! Follow the manual setup in [docs/SELF_HOSTING.md#manual-development-setup](SELF_HOSTING.md#manual-development-setup).

### Do I need the AI advisor?

No! The AI Advisor is **optional and disabled by default**. Core functionality (budgeting, debts, transactions) works without it. Set `GEMINI_API_KEY` to enable (see [docs/AI_ADVISOR.md](AI_ADVISOR.md)).

### What about privacy and data?

- Data is stored in **your** PostgreSQL database (self-hosted)
- No cloud sync or centralized storage
- If you enable AI advisor, budget summaries are sent to Google Gemini (see [docs/AI_ADVISOR.md#privacy--security](AI_ADVISOR.md#privacy--security))
- No payment or personal info logging

---

## Troubleshooting

### I can't log in

- Check your username and password (case-sensitive)
- Try clearing browser cookies
- Ensure backend is running: `docker compose ps`

**Note:** Each self-hosted instance has its own user database. You don't share accounts with other deployments.

### How do I fix date/timezone issues?

If transactions appear on the wrong date:

- The app uses YYYY-MM-DD format to normalize dates
- Ensure your database and backend are in UTC timezone
- The frontend automatically uses `formatDateToISO()` to prevent drift
- This is a known pattern in the codebase (see [docs/ARCHITECTURE.md](ARCHITECTURE.md#key-patterns))

**If you still see issues:**
- Check backend logs: `docker compose logs backend | grep -i date`
- Verify database timezone: `SELECT now() AT TIME ZONE 'UTC'`
- Open an issue on [GitHub](https://github.com/PaulAtkins88/budgetwise-planner/issues)

### Database connection error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Check:**
1. PostgreSQL is running
2. Connection string is correct
3. Database and user exist
4. Firewall allows connection

**Fix:**
```bash
# Docker Compose
docker compose logs postgres

# Manual
psql -c "SELECT 1"
```

### Docker won't start

```bash
docker compose logs
```

Common issues:
- Port conflicts (3000, 5555, 5432)
- Volume permissions
- Image pull timeout

See [docs/SELF_HOSTING.md#troubleshooting](SELF_HOSTING.md#troubleshooting).

### "AI Chat disabled" message

Ensure you've set `GEMINI_API_KEY` and `AI_ENABLED=true` in backend `.env`. See [docs/AI_ADVISOR.md](AI_ADVISOR.md).

---

## Contributing & Development

### I found a bug!

1. Check [existing issues](https://github.com/PaulAtkins88/budgetwise-planner/issues)
2. [Create a bug report](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=bug_report.md)
3. Include steps to reproduce and environment details

### I want to contribute code

Welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Local setup
- Code style
- Testing
- PR submission

### What's on the roadmap?

Check [docs/FEATURE_WISHLIST.md](FEATURE_WISHLIST.md) for planned features and community ideas.

### Can I suggest a feature?

Yes! [Open a feature request](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=feature_request.md) or start a [discussion](https://github.com/PaulAtkins88/budgetwise-planner/discussions).

---

## License & Legal

### What license is this under?

**MIT License** — Free for personal and commercial use. See [LICENSE](../LICENSE).

### Can I modify and redistribute it?

Yes! The MIT License allows modification and redistribution. Please give credit and include a copy of the license.

### Is this production-ready?

Bucketwise Planner is in **v0.1.0** (initial release). It's functional but may have bugs. Contributions and feedback are welcome!

---

## More Help

- 📖 [README.md](../README.md) — Overview and quick start
- 🚀 [docs/SELF_HOSTING.md](SELF_HOSTING.md) — Setup and deployment
- 🏗️ [docs/ARCHITECTURE.md](ARCHITECTURE.md) — System design
- 💬 [CONTRIBUTING.md](../CONTRIBUTING.md) — Development guide
- 🐛 [GitHub Issues](https://github.com/PaulAtkins88/budgetwise-planner/issues) — Report bugs
- 💡 [GitHub Discussions](https://github.com/PaulAtkins88/budgetwise-planner/discussions) — Ask questions

---

**Still stuck?** Open an issue or start a discussion on [GitHub](https://github.com/PaulAtkins88/budgetwise-planner)!
