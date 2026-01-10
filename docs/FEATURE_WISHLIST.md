# Feature Wish List

Ideas for future enhancements to **Bucketwise Planner**. Contributions welcome!

This list is community-driven. Have an idea? Open an [issue](https://github.com/PaulAtkins88/budgetwise-planner/issues) or [discussion](https://github.com/PaulAtkins88/budgetwise-planner/discussions).

---

## Completed Features ✅

These features are now part of the core app:

- ✅ **Multi-User Authentication** (v0.1.0) — JWT-based signup/login, password hashing, per-instance independence
- ✅ **AI Chat Advisor** (v0.1.0) — Optional Google Gemini-powered chat with budget context (disabled by default, requires API key)
- ✅ **Debt Snowball Calculator** (v0.1.0) — Fortnightly payoff timeline with interest accrual
- ✅ **Bucket Allocations** (v0.1.0) — 60/10/10/20 split with customization per fortnight
- ✅ **Fortnightly Budgeting** (v0.1.0) — Cycle-based planning aligned with income
- ✅ **Transaction Recording** (v0.1.0) — Income, expenses, and debt payments with bucket tagging
- ✅ **Global Help System** (v0.1.0) — Searchable help with keyboard shortcuts (⌘/)
- ✅ **Dark Theme** (v0.1.0) — Navy/slate + teal/amber Mantine theme

---

## Wishlist 🚀

### High Priority

#### Shared Library for Backend and Frontend
**Description**: Create a shared TypeScript library package for types, enums, constants, and utilities used by both backend and frontend to eliminate duplication and ensure consistency.

**Current State**: Bucket definitions, API types, and utility functions are duplicated across backend and frontend (e.g., `barefootBuckets` array defined in both places).

**Proposal**:
- Create `packages/shared` or `@bucketwise/types` npm package in monorepo
- Export common types: `BarefootBucket`, `Money`, `Transaction`, `Debt`, `Fortnight`, `Allocation`
- Export constants: `barefootBuckets`, `transactionKinds`, `bucket percentages`
- Export utilities: `formatCurrency`, `formatDateToISO`, `calculateDebtPayoff` helpers
- Both backend and frontend import from shared package
- Single source of truth for validation, types, and business logic constants

**Benefits**: 
- Eliminate duplication (DRY principle)
- Ensure consistency between client and server
- Type safety across full stack
- Easier to maintain and refactor
- Reduces bugs from out-of-sync definitions

**Acceptance Criteria**:
- Shared package builds and publishes correctly
- Backend and frontend both import from shared
- No duplicate type definitions between packages
- All tests pass after migration
- Bucket definitions, money formatting, date utilities are shared

**Estimated Effort**: Medium-High (refactoring, package setup, testing)

**Dependencies**: None (can be done anytime)

---

#### Transaction Auto-Recording
**Description**: Add automatic transaction recording for recurring expenses and debt payments at the start of each fortnight.

**Current State**: Debt payments and fixed expenses shown as checkboxes; manual "Record Payment" required.

**Proposal**: 
- Add Profile setting toggle: "Auto-record debt payments" and "Auto-record fixed expenses"
- Run daily cron job (or at fortnight start) to create transactions
- Allow per-expense override

**Benefits**: Reduces manual work, fewer missed payments.

**Estimated Effort**: Medium (backend cron job, frontend toggle, database migrations)

---

#### Recurring Transaction Templates
**Description**: Allow users to create templates for recurring expenses (e.g., "Rent $1500", "Gym $50") and quickly apply them to multiple fortnights.

**Proposal**:
- New "Templates" view in UI
- Define recurring transactions with name, amount, bucket, tags
- Apply template to current/future fortnights
- Edit/delete templates, with history of applications

**Benefits**: Faster transaction recording for regular expenses.

**Estimated Effort**: Medium

---

#### Mobile App
**Description**: Native mobile app (React Native or Flutter) for iPhone/Android to record transactions on-the-go.

**Priority**: Medium-High (large audience on mobile)

**Considerations**:
- Share authentication backend with web app (JWT)
- Offline transaction queuing and sync
- Biometric login
- Push notifications for payment reminders

**Estimated Effort**: Large (separate project, significant scope)

---

### Medium Priority

#### Expense Analytics & Charts
**Description**: Add charts and insights dashboard showing spending patterns, category trends, and monthly/annual summaries.

**Proposal**:
- Line chart: bucket spending over time
- Pie chart: expense breakdown by category/tag
- Heatmap: daily spending patterns
- Export: CSV/PDF reports

**Tools**: recharts or Chart.js

**Estimated Effort**: Medium

---

#### Budget Alerts & Notifications
**Description**: Notify users when they're approaching or exceed bucket allocations in a fortnight.

**Proposal**:
- Browser notifications (in-app toast) when 80% of bucket is spent
- Daily summary email (optional, requires email service)
- Custom alert thresholds per bucket

**Estimated Effort**: Medium (email requires SMTP setup; browser notifications easier)

---

#### Logo & Favicon Design
**Description**: Create a professional logo and favicon for Bucketwise Planner to improve visual identity and branding.

**Current State**: Using generic Tabler wallet icon as placeholder.

**Proposal**:
- Design logo reflecting Barefoot Investor buckets (4-6 bucket visual)
- Create favicon (16x16, 32x32, 64x64 PNG)
- Design favicon variants for light/dark themes
- Consider iOS app icon (180x180 PNG) for future mobile app
- Update browser tab, social media, and GitHub repo visuals

**Acceptance Criteria**:
- Logo is clear at small sizes (favicon size)
- Represents bucket/financial themes
- Works on light and dark backgrounds
- Multiple formats (PNG, SVG)

**Design Tools**: Figma, Adobe XD, or open-source (Inkscape)

**Estimated Effort**: Low (design only, no code changes)

**Note**: Community contribution welcome! If you're a designer, this is a great way to contribute.

---

#### Multi-Currency Support
**Description**: Allow users to set budget currency (AUD, USD, GBP, etc.) and see all values in their chosen currency.

**Proposal**:
- Add `currency` field to user profile (ISO 4217 code, default AUD)
- Store all values in cents as-is; format on display
- Display currency symbol in all UI (e.g., "$1500 AUD")
- Optional: Exchange rate conversion for multi-currency transactions

**Estimated Effort**: Medium (format changes, no major schema changes)

---

#### Shared Budgets (Couples/Families)
**Description**: Allow multiple users to share a single budget (e.g., married couple, family household).

**Proposal**:
- Invite system: user A sends invite to user B's email
- Shared budget with read/write permissions (or read-only observers)
- Separate transaction history: show who recorded each transaction
- Unified debt snowball & allocations view

**Considerations**:
- Complex permissions model
- Audit trail for transparency
- Conflict resolution if both users modify simultaneously

**Estimated Effort**: Large

---

#### Debt Goal Milestones
**Description**: Track milestones toward debt payoff (e.g., "50% paid" badge, "On track to payoff by [date]").

**Proposal**:
- Calculate and display % of debt paid
- Show estimated payoff date (updated as allocations change)
- "On Track" / "Behind" / "Ahead" status badge
- Motivational notifications when milestones reached

**Estimated Effort**: Low-Medium (mostly UI additions, calculations already exist)

---

### Low Priority / Future Exploration

#### Budget Forecasting
- Predict future net worth based on current savings rate and debt payoff plan
- "What if" scenarios: change Fire Extinguisher % and see payoff timeline

#### Savings Goals with Sub-Buckets
- Break "Smile" bucket into multiple sub-goals (e.g., "Holiday", "Car", "Education")
- Track progress toward each sub-goal independently

#### Asset Tracking
- Track non-debt assets (savings account, investments, house equity)
- Net worth dashboard (assets minus liabilities)

#### Expense Categories (Beyond Buckets)
- Create custom expense categories (e.g., "Groceries", "Transport", "Entertainment")
- Tag transactions with multiple categories for deeper analysis

#### Integration with Banks
- OAuth connection to bank APIs (Open Banking) to auto-import transactions
- Categorization AI: auto-assign imported transactions to buckets

#### Invoicing & Receipt Capture
- Upload receipts as images (proof of transaction)
- Optical character recognition (OCR) to auto-extract amounts
- Attach invoices to transactions for documentation

#### Community Features
- Share budget summaries anonymously with community
- Compare spending patterns with anonymized peers
- Public debt payoff challenges (optional, no pressure)

---

## How to Contribute

Found a feature idea? We'd love to hear it!

1. **Check existing issues/discussions** to avoid duplicates
2. **Open an issue** with label `enhancement` or start a [discussion](https://github.com/PaulAtkins88/budgetwise-planner/discussions)
3. **Describe the feature**: what problem does it solve? who benefits?
4. **Prototype or wireframe** if possible (helps clarify scope)
5. **Ready to implement?** See [CONTRIBUTING.md](../CONTRIBUTING.md) for code guidelines

---

## Roadmap (Tentative)

**v0.1.0** (Jan 2026) — MVP with buckets, debt snowball, optional AI  
**v0.2.x** (Feb-Mar 2026) — Auto-recording, templates, analytics  
**v0.3.x** (Apr-Jun 2026) — Mobile app exploration, multi-currency  
**v1.0.0** (Q3+ 2026) — Production-ready, documentation, community feedback incorporated

(Timeline flexible based on contributor availability and community priorities)
- Still allows manual override/skip

---

_(Add future feature ideas below as they come up)_