# Contributing to RiftMeta

Thanks for taking the time to contribute. This document covers everything you need to get a development environment running, the conventions used in this project, and the pull request process.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Layout](#project-layout)
- [Backend (Go)](#backend-go)
- [Frontend (React)](#frontend-react)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Code Style](#code-style)

---

## Development Setup

### Requirements

- Go 1.22+
- Node.js 20+
- Docker + Docker Compose
- A Riot API key from [developer.riotgames.com](https://developer.riotgames.com)

### Fork and clone

```bash
git clone https://github.com/<your-username>/RiftMeta.git
cd RiftMeta
git remote add upstream https://github.com/marcailagan21/RiftMeta.git
```

### Configure environment

```bash
cp .env.example .env
# Set RIOT_API_KEY in .env
```

### Start services

```bash
# Start Postgres + Redis via Docker, run Go + Vite locally
docker compose up postgres redis -d

# Backend (hot-reload with air, or plain go run)
cd backend && go run ./cmd/server

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Or run everything in Docker:

```bash
docker compose up --build
```

---

## Project Layout

```
backend/internal/
  api/handlers/   HTTP route handlers
  cache/          Redis helpers
  config/         Env var loading
  db/             PostgreSQL pool + migrations
  models/         Shared data types
  riot/           Riot API + Data Dragon client
  worker/         Background match aggregator

frontend/src/
  api/            Axios API calls
  components/     React components (champion/, common/, home/)
  pages/          Route-level components
  types/          TypeScript interfaces
```

---

## Backend (Go)

### Running tests

```bash
cd backend
go test ./...
```

### Adding a new endpoint

1. Add the handler method to `internal/api/handlers/champions.go`
2. Register the route in `internal/api/router.go`
3. Add the corresponding TypeScript call in `frontend/src/api/client.ts`
4. Add the response type to `frontend/src/types/index.ts`

### Database migrations

Migrations live as `const` strings in `internal/db/postgres.go` and run automatically on startup with `CREATE TABLE IF NOT EXISTS`. Add new migrations as additional entries in the `migrations` slice inside `migrate()`.

### Rate limiting

The Riot API client uses a token-bucket rate limiter capped at 15 req/s. Never bypass this. If you add new Riot API calls, route them through `(*RiotClient).get()` so the limiter applies automatically.

---

## Frontend (React)

### Type check + build

```bash
cd frontend
npx tsc --noEmit   # type check only
npm run build      # full production build
npm run dev        # dev server on :3000
```

### Adding a new page

1. Create `src/pages/YourPage.tsx`
2. Add the `<Route>` in `src/App.tsx`
3. Link from `src/components/common/Navbar.tsx`

### Styling conventions

- Use Tailwind utility classes — avoid inline `style={}` except for dynamic values that can't be expressed as classes
- Custom colours, animations, and shadows are defined in `tailwind.config.js` under `theme.extend`
- Component-level CSS classes (`.panel`, `.panel-title`, `.btn-primary`, etc.) are defined in `src/index.css` `@layer components`

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

Common types:

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code change that isn't a fix or feature |
| `style` | Formatting, no logic change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build process, dependency updates |

Examples:

```
feat: add grandmaster tier to worker seed pool
fix: correct patch filter to handle sub-patch versions
perf: cache champion list response for 6 hours
docs: add contributing guide
```

---

## Pull Request Process

1. **Branch off `main`** — keep branches focused on one feature or fix
2. **Keep PRs small** — a single reviewable change is easier to merge than a large batch
3. **Fill in the PR template** — describe what changed and why, and list what you tested
4. **Pass CI** — the build and type check must be green before merge
5. **One approval required** — a maintainer will review and merge

### PR title format

Follow the same Conventional Commits format as individual commits:

```
feat: show grandmaster players in tier list
fix: worker exits early when no matches found
```

---

## Reporting Bugs

Open an issue with:

- A clear title describing the problem
- Steps to reproduce
- Expected behaviour vs. actual behaviour
- Your environment (OS, browser, Docker version, Riot region)
- Relevant logs (`docker compose logs backend`)

---

## Feature Requests

Open an issue tagged `enhancement` with:

- What you'd like to see
- Why it would be useful
- Any Riot API endpoints or Data Dragon data it would require

---

## Code Style

### Go

- `gofmt` formatted (enforced by CI)
- No `interface{}` — use concrete types or generics
- Errors wrapped with `fmt.Errorf("context: %w", err)`
- No global state — dependencies injected via structs

### TypeScript / React

- Strict TypeScript — no `any`, no `// @ts-ignore`
- Named exports for components
- `useQuery` for all remote data — no `useEffect` + `fetch`
- Props interfaces defined inline for simple components, as named types for shared ones

---

## Questions

Open a [GitHub Discussion](https://github.com/marcailagan21/RiftMeta/discussions) for anything that doesn't fit a bug report or feature request.
