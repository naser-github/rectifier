# Rectifier v1 Run Guide

Rectifier is a fully client-side JSON validation, repair, formatting,
conversion, and inspection tool. It requires no backend, database, sidecar, or
AI service.

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** (optional — for containerized startup)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run e2e` | Run Playwright browser tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint code quality checks |
| `npm run format:check` | Prettier formatting check |
| `npm run format` | Auto-format all files with Prettier |
| `npm run architecture` | Dependency-cruiser architecture check |

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot module replacement
npm run dev

# In another terminal, run tests in watch mode
npm test
```

### Testing

```bash
# Run all unit tests
npm test -- --run

# Run specific test file
npm test -- --run tests/components/App.test.tsx
```

### End-to-End Testing

Playwright tests require the production build.

```bash
# Build and run all e2e tests
npm run e2e

# Run a specific e2e test file
npx playwright test e2e/rectifier.spec.ts

# Run e2e tests with visible browser
npx playwright test --headed
```

## Docker

```bash
# Build and start the Docker Compose service
docker compose up --build

# Open http://localhost:4173
```

The Docker Compose setup uses a single `app` service that builds and serves
the static client from an nginx-based container.

## Project Structure

```
src/
  app/             Application shell (App.tsx)
  components/      React components (editor, errors, layout, result, schema, ui)
  domain/          Pure TypeScript types, contracts, converters, schema validation
  engine/          Strict repair engine (no React/DOM/worker imports)
  hooks/           React hooks (workspace, repair, processing, persistence)
  lib/             Small general helpers (cn, files, sampleJson)
  state/           Workspace reducer and action eligibility
  styles/          Global CSS (Tailwind, design tokens, paper texture)
  worker/          Web Worker handlers for validation, repair, format, convert, schema
e2e/               Playwright browser tests
tests/             Vitest unit and component tests
doc/               Documentation, plans, execution reports
```

## No Backend Required

Rectifier runs entirely in the browser. No server, database, API, or AI service
is needed. All processing happens in a Web Worker. User data never leaves the
browser.

## Troubleshooting

- **Port in use:** Change the port with `npm run dev -- --port 3000`.
- **Tests fail:** Ensure Node.js ≥ 18 and run `npm install` first.
- **Playwright fails:** Install browsers with `npx playwright install chromium`.
- **Docker issues:** Ensure Docker is running and you have permissions.
