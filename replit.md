# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the AI Debate Arena application — a gamified debate platform where users argue with an AI opponent and earn XP, levels, and badges.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4

## Application: AI Debate Arena

A full-stack gamified debate platform with:

### Features
- Topic selection (preset + custom)
- AI-powered debate chat with counterarguments and critical questions
- Scoring system: Logic (0-10), Clarity (0-10), Confidence (0-10)
- Gamification: XP points, levels (Beginner → Master), badges, streak system
- Dashboard with stats, achievements, topic breakdown

### Pages
- `/` — Home page with topic selection and user profile stats
- `/debate/:sessionId` — Debate Arena chat interface
- `/debate/:sessionId/results` — Post-debate results and XP earned
- `/dashboard` — Full gamification dashboard

### API Endpoints (all under `/api`)
- `POST /debates/start` — Start a debate session
- `GET /debates` — List all debates
- `GET /debates/:sessionId` — Get debate with messages
- `POST /debates/:sessionId/end` — End a debate (calculates XP)
- `POST /debates/:sessionId/messages` — Send user message, get AI response
- `GET /debates/:sessionId/score` — Get current score
- `GET /profile` — Get user profile and gamification data
- `GET /profile/dashboard` — Get full dashboard summary

### DB Schema (lib/db/src/schema/debates.ts)
- `debate_sessions` — debate session with scores
- `debate_messages` — chat messages (role: user | ai)
- `user_profile` — XP, level, streak, totalDebates

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Note on api-zod/src/index.ts

The auto-generated `lib/api-zod/src/index.ts` was manually fixed to avoid duplicate exports. When running codegen again, you must manually update this file to re-exclude `SendMessageBody` and `StartDebateBody` from the types re-export (they are already exported from `generated/api.ts`).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
