# Support

## Getting Help

We're here to help! Here are the best ways to get support:

### 📖 Documentation

Start with our comprehensive docs:
- [README.md](README.md) — Quick start and feature overview
- [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) — Installation and deployment guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and architecture
- [docs/AI_ADVISOR.md](docs/AI_ADVISOR.md) — Optional AI feature setup
- [docs/FAQ.md](docs/FAQ.md) — Common questions and answers

### 🐛 Report a Bug

1. Check [existing issues](https://github.com/PaulAtkins88/budgetwise-planner/issues) first
2. [Create a new bug report](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=bug_report.md)
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, browser, deployment method)
   - Error messages or logs

### 💡 Request a Feature

1. [Open a feature request](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=feature_request.md)
2. Describe the use case and benefits
3. Suggest how it would work

### 💬 Ask a Question

1. Check [docs/FAQ.md](docs/FAQ.md) for common questions
2. [Start a Discussion](https://github.com/PaulAtkins88/budgetwise-planner/discussions) for general questions
3. Search existing issues/discussions for similar topics

## Response Expectations

This is a community-driven project maintained primarily by volunteers. We aim to:

- 👀 Review issues and PRs within a few days
- 🎯 Prioritize bugs and security issues
- 📚 Provide clear feedback and guidance
- 🤝 Welcome contributions from the community

**Response times may vary based on community capacity.**

## Troubleshooting Common Issues

### I can't log in / forgot my password

- Check your username and password
- Note: This is a self-hosted app. Each instance has its own users. No central password reset.
- Contact your instance administrator or check your instance documentation

### AI Chat isn't showing up

- See [docs/AI_ADVISOR.md](docs/AI_ADVISOR.md)
- Ensure `GEMINI_API_KEY` is set in backend `.env`
- Ensure `AI_ENABLED=true` in your configuration
- Restart the backend service

### Dates are off by a day

- This is a timezone issue. Ensure you're using the `formatDateToISO()` utility
- See [docs/FAQ.md](docs/FAQ.md#how-do-i-fix-datetimezone-issues)

### My budget doesn't match expected values

- Check that all transactions are assigned to the correct bucket
- Verify fortnight dates are correct (YYYY-MM-DD format)
- Review debt payment calculations in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Docker Compose won't start

- Check that ports 3000, 5555 (and 5432 if using built-in Postgres) are free
- See [docs/SELF_HOSTING.md#troubleshooting](docs/SELF_HOSTING.md#troubleshooting)
- View logs: `docker compose logs -f`

### I found a security issue

- **Do not open a public issue**
- See [SECURITY.md](SECURITY.md) for responsible disclosure

## Contributing

Want to fix a bug or add a feature? We'd love your help!

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Local development setup
- Code style and standards
- Testing requirements
- PR submission process

---

**Thank you for using Bucketwise Planner!** 🙌
