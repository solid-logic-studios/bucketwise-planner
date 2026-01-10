# Testing Guide

## Commands
- Type check: `pnpm exec tsc --noEmit`
- Unit/integration (non-watch): `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage`

## Notes
- Tests use Vitest (`backend/tests/*`). Current coverage focuses on domain value objects; expand as features grow.
- The test script runs `vitest run` (non-watch) for CI-friendly execution.
- Ensure NODE_ENV is set appropriately; error details are only included in responses when not `production`.
