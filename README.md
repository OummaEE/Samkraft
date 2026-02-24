# Samkraft

**Civic-tech platform for immigrants and local residents in Sweden — build community through verified volunteer projects.**

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)

## Overview

Samkraft lets immigrants (including those without personnummer) contribute to society via volunteer projects, earn verified certificates, and build a portfolio for future employment. Municipality admins can create and manage projects; volunteers can apply, log hours, and get matched.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| Hosting | Cloudflare Pages |
| Bot protection | Cloudflare Turnstile |
| PWA | vite-plugin-pwa |

## Project Structure

```
samkraft/
├── functions/api/          # Cloudflare Pages Functions (server-side)
│   └── verify-turnstile.js # Turnstile secret verification
├── migrations/             # SQL migration files
├── public/                 # Static assets (icons, manifest)
├── src/
│   ├── components/         # UI components (auth, dashboards, profiles, projects)
│   ├── context/            # AuthContext (React context + reducer)
│   ├── hooks/              # useAuth, useUser, useSupabase
│   ├── pages/              # Route-level page components
│   ├── services/           # Supabase API calls (authService, userService, projectService)
│   └── types/              # Shared TypeScript types
├── .dev.vars.example       # Wrangler secrets template → copy to .dev.vars
├── .env.example            # Vite env template → copy to .env.local
├── supabase_schema.sql     # Full database schema
├── seed.sql                # Test data for local dev
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite + PWA config
└── wrangler.jsonc          # Cloudflare Pages config
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
# Frontend (Vite) — read by import.meta.env
cp .env.example .env.local

# Wrangler secrets (Cloudflare Functions) — read by context.env
cp .dev.vars.example .dev.vars
```

Fill in your Supabase URL, anon key, and Turnstile keys.

### 3. Apply database schema

Open your Supabase SQL Editor and run `supabase_schema.sql`.  
Optionally seed with test data: `seed.sql`.

### 4. Run dev server

```bash
# Vite dev server (no Functions / Turnstile verification)
npm run dev

# Wrangler dev server (full stack, reads .dev.vars)
npm run build && npx wrangler pages dev dist --port 3000
```

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run typecheck    # TypeScript type check (no emit)
npm run lint         # ESLint on src/
npm run lint:fix     # ESLint auto-fix
npm run check        # typecheck + lint (run before committing)
```

## Deployment (Cloudflare Pages)

1. Connect GitHub repo in Cloudflare Pages dashboard
2. Set build command: `npm run build`, output: `dist`
3. Add environment variables in Settings → Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Vite (frontend) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vite (frontend) | Supabase anon/public key |
| `VITE_TURNSTILE_SITE_KEY` | Vite (frontend) | Turnstile public site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Function | Turnstile secret (server-side only) |

## User Roles

| Role | Description |
|---|---|
| `volunteer` | Apply to projects, log hours, earn certificates |
| `migrant` | Same as volunteer — primary target audience |
| `mentor` | Validate contributions, write recommendations |
| `municipality_admin` | Create & manage municipal projects, view analytics |

## Key Notes

- **Supabase lock workaround**: `supabaseClient.ts` uses a custom in-memory lock to bypass `navigator.locks` (unavailable in Cloudflare Workers runtime).
- **Municipalities load in RegisterForm**: fetched live from `municipalities` table — requires the table to exist and have `active = true` rows.
- **Turnstile**: sitekey is read from `VITE_TURNSTILE_SITE_KEY` with a hardcoded fallback. Secret verification happens server-side in `functions/api/verify-turnstile.js`.
