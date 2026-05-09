# Bucketwise Planner CasaOS App Store

This branch contains the CasaOS App Store source for Bucketwise Planner.

## Add Source In CasaOS

Use this ZIP URL in CasaOS App Store `Add Source`:

```text
https://github.com/solid-logic-studios/bucketwise-planner/archive/refs/heads/casaos-appstore.zip
```

## Notes

- This branch is intended for CasaOS distribution only.
- The app connects to an existing PostgreSQL database. It does not provision Postgres.
- Image tags in the app definition should track explicit semver releases.
- The current app definition is pinned to `0.4.8`.
- Routine CasaOS restarts should use `DB_SCHEMA_MODE=manual`.
- After changing backend AI env vars such as `AI_ENABLED`, `GEMINI_API_KEY`, or `GEMINI_MODEL`, recreate the backend container. A plain restart is not sufficient.

## What This Branch Contains

- `Apps/bucketwise-planner/docker-compose.yml`: the CasaOS app definition
- `Apps/bucketwise-planner/icon.png`: current app icon placeholder
- `Apps/bucketwise-planner/screenshot-*.png`: app screenshots for CasaOS
- `category-list.json` and `recommend-list.json`: minimal app-store metadata

## Before Pushing

1. Confirm the Docker Hub images exist for the pinned version.
2. Update the image tag in `Apps/bucketwise-planner/docker-compose.yml` if the release version changes.
3. Push the `casaos-appstore` branch.
4. Add the ZIP source URL in CasaOS.

## Install Expectations

The CasaOS install requires:

- `PG_CONNECTION_STRING` for an existing PostgreSQL database
- `JWT_SECRET`
- `ADMIN_SECRET`
- Optional `GEMINI_API_KEY`, `AI_ENABLED=true`, and `GEMINI_MODEL`

For routine managed deployment restarts, keep `DB_SCHEMA_MODE=manual`.
If AI env vars change, recreate the backend container so the new environment is applied.

## Validated CasaOS Install Settings

The current CasaOS app definition has been validated with these settings:

- Leave `Network` blank so CasaOS/Docker Compose creates the app network automatically.
- Leave explicit container names blank.
- Use `5555` as the Web UI port.
- Keep `DB_SCHEMA_MODE=manual` for normal operation.

The frontend is exposed on port `5555` and proxies `/api`, `/auth`, and `/uploads` to the backend service over the internal Compose network.

Built with Domain-Driven Design, SOLID principles, and Scott Pape's Barefoot Investor methodology.

[www.barefootinvestor.com](https://www.barefootinvestor.com/)
