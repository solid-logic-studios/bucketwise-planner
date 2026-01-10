# Contributing to Bucketwise Planner

Welcome! Bucketwise Planner is a community-driven open-source project implementing Scott Pape's Barefoot Investor methodology. We appreciate contributions of all kinds — bug reports, feature requests, documentation improvements, and code fixes.

## Getting Started

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PaulAtkins88/budgetwise-planner.git
   cd budgetwise-planner
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment files:**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Copy `.env.example` to `.env` (or modify for Docker Compose)
   - Update `PG_CONNECTION_STRING`, `JWT_SECRET`, and `ADMIN_SECRET` with your values

4. **Start development servers:**
    - Separate terminals:
        ```bash
        # Terminal 1: Backend
        cd backend
        pnpm dev

        # Terminal 2: Frontend
        cd frontend
        pnpm dev
        ```
    - Single terminal:
        ```bash
        # root repo folder
        pnpm dev
        ```

5. **Verify setup:**
   ```bash
   # Type check
   pnpm exec tsc --noEmit

   # Run tests
   cd backend && pnpm test
   ```

## How to Contribute

### Reporting Bugs

1. Check [GitHub Issues](https://github.com/PaulAtkins88/budgetwise-planner/issues) to avoid duplicates
2. Use the [Bug Report](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=bug_report.md) template
3. Include steps to reproduce, expected vs actual behavior, and environment details

### Requesting Features

1. Use the [Feature Request](https://github.com/PaulAtkins88/budgetwise-planner/issues/new?template=feature_request.md) template
2. Describe the use case and benefits
3. Suggest acceptance criteria

### Submitting Code Changes

1. **Fork the repository** and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Code style & format:**
   - TypeScript strict mode enabled
   - Use `interface` for public contracts, `type` for unions/intersections
   - Type-only imports: `import type { MyType } from './file'`
   - ESM module syntax
   - Keep files ASCII (no emoji in code except for rendered strings)

3. **Critical patterns:**
   - **Date handling:** Always use `formatDateToISO()` utility (prevents timezone bugs)
     ```typescript
     import { formatDateToISO } from './utils/formatters';
     const dateStr = formatDateToISO(new Date()); // Returns YYYY-MM-DD
     ```
   - **Backend DDD:** Keep domain layer pure (no Express/Zod/DB in domain entities)
   - **API responses:** Use `ApiResponse<T>` envelope for all responses
   - **Error handling:** Throw domain errors; map to HTTP via middleware

4. **Testing:**
   ```bash
   cd backend
   pnpm test          # Run all tests
   pnpm test:watch   # Watch mode
   pnpm test:coverage # Coverage report
   ```
   - Write unit tests for new business logic
   - Maintain >80% coverage for critical paths
   - Use Vitest; keep tests deterministic and fast

5. **Commit messages** (Conventional Commits):
   ```
   feat: add new feature description
   fix: resolve issue with X
   docs: update README section
   test: add tests for feature X
   refactor: simplify function Y
   ```

6. **Before submitting PR:**
   ```bash
   # Type check (backend + frontend)
   pnpm exec tsc --noEmit

   # Tests must pass
   cd backend && pnpm test

   # Lint/format (if applicable)
   ```

7. **Create a pull request:**
   - Use the [PR Template](.github/PULL_REQUEST_TEMPLATE.md)
   - Link to related issues: `Closes #123`
   - Describe what changed and why
   - Add screenshots for UI changes
   - Ensure all checks pass

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment.

## Questions?

- 📖 Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- 🚀 See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for deployment
- 💡 Browse [docs/FEATURE_WISHLIST.md](docs/FEATURE_WISHLIST.md) for ideas
- 💬 Ask in [GitHub Discussions](https://github.com/PaulAtkins88/budgetwise-planner/discussions)

## Attribution

This project implements the Barefoot Investor methodology by Scott Pape. When working on features related to bucket allocations or debt snowball, reference the original methodology and credit Scott Pape's work.

**Learn more:** [www.barefootinvestor.com](https://www.barefootinvestor.com/)

---

Thank you for contributing! 🙌
