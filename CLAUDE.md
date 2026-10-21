# Smart Basket — Project Conventions

## Overview
AI-powered grocery planning app for Bangladesh. Monorepo with Expo mobile app + Next.js API backend.

## Tech Stack
- **Frontend:** React Native (Expo SDK 52, Expo Router v4)
- **Backend:** Next.js 15 App Router (API routes only)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** Claude API (Sonnet) via `@anthropic-ai/sdk`
- **Language:** TypeScript (strict mode everywhere)
- **Deployment:** Vercel (API), EAS Build (mobile)

## Project Structure
```
smart-basket/
├── apps/
│   ├── api/          # Next.js API backend (Vercel)
│   │   └── src/
│   │       ├── app/api/   # API route handlers
│   │       └── lib/       # Shared server utilities
│   └── mobile/       # Expo React Native app
│       ├── app/           # Expo Router file-based routes
│       └── src/
│           ├── components/ # Reusable UI components
│           ├── hooks/      # Custom React hooks
│           └── lib/        # Client utilities
├── packages/
│   └── shared/       # Shared types and constants
├── docs/
│   ├── PRD.md        # Product requirements
│   └── schema.sql    # Database schema
└── CLAUDE.md
```

## Coding Conventions
- **TypeScript strict** — no `any`, no implicit returns, no unused vars
- **Functional components** — no class components in React/RN
- **Named exports** — except for default page/layout exports required by Next.js and Expo Router
- **Zod validation** — validate all API request bodies with Zod schemas
- **Error handling** — API routes return structured `{ error: string }` on failure
- **Naming:**
  - Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
  - Variables/functions: `camelCase`
  - Types/interfaces: `PascalCase`
  - Database columns: `snake_case`
  - API routes: `kebab-case` paths

## Supabase / Database
- All tables use UUID primary keys
- Row Level Security (RLS) enabled on all user-facing tables
- `profiles` table extends `auth.users` — auto-created via trigger
- Always use parameterized queries (Supabase client handles this)
- Store prices are in BDT (৳)

## AI Integration
- Use `claude-sonnet-4-20250514` model for all AI features
- System prompts live in API route files (co-located with the handler)
- Always request JSON output from Claude and parse with `JSON.parse`
- Log AI usage to `ai_logs` table for cost tracking
- Rate-limit free tier users to 3 AI requests/week

## Mobile App
- Use Expo Router file-based routing
- Store auth tokens in `expo-secure-store`
- Brand color: `#2E7D32` (green)
- Support both iOS and Android; no tablet layout for MVP

## Commands
```bash
npm run dev:api      # Start API server on :3000
npm run dev:mobile   # Start Expo dev server
npm run build:api    # Build Next.js for production
npm run typecheck    # Type-check all workspaces
npm run lint         # Lint all workspaces
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to client
- `ANTHROPIC_API_KEY` — Claude API key
- Mobile uses `EXPO_PUBLIC_` prefix for env vars
