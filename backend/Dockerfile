# syntax=docker/dockerfile:1
FROM node:22-alpine

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for both workspaces
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

# Copy tsconfig and backend source
COPY tsconfig.json ./
COPY backend ./backend

# Install ALL dependencies with shamefully-hoist to flatten node_modules
# This ensures all packages are directly in node_modules, not hoisted in .pnpm
# BUT: we still keep .pnpm for reference, and remove devDependencies manually
RUN pnpm install --frozen-lockfile --prod=false --recursive --shamefully-hoist

# Verify dotenv is findable
RUN ls -la /app/node_modules/dotenv && echo "✓ dotenv found"

# Build backend TypeScript
RUN pnpm run --filter backend build

# Remove source code but keep dist, node_modules, and .pnpm
RUN rm -rf /app/backend/src /app/backend/tests /app/frontend /app/.git /app/.github /app/docs

# Manually remove devDependencies from node_modules (TypeScript, @types/*, tsx, vitest, etc.)
# Keep only runtime dependencies
RUN rm -rf /app/node_modules/typescript /app/node_modules/@types /app/node_modules/tsx /app/node_modules/vitest /app/node_modules/esbuild
RUN rm -rf /app/node_modules/.pnpm/typescript* /app/node_modules/.pnpm/@types* /app/node_modules/.pnpm/tsx* /app/node_modules/.pnpm/vitest* 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "dist/backend/src/server.js"]
