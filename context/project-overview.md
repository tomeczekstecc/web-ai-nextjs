# CI-PRS Web Project Overview

## What This Repository Is

This repository contains the frontend for `CI-PRS Web Platform`.

Today it serves two concrete purposes:
- a polished landing page in `src/app/page.tsx`
- a dashboard-style internal UI in `src/app/dashboard/page.tsx`

The app is built to be presentable immediately while staying easy to connect to a real backend without rewriting page-level UI.

## Product Direction

The current product direction is a calm, high-trust web experience that:
- presents a clear value proposition on the landing page
- can consume backend-managed content for marketing sections
- leaves room for operational and dashboard workflows
- favors simple user flows over dense enterprise complexity

## User Experience Principles

- Lead with clarity, not feature noise.
- Keep interactions calm, obvious, and low-friction.
- Use strong visual hierarchy and intentional spacing.
- Favor readable layouts over cramped data-heavy screens.
- Maintain a polished feel in both light and dark themes.

## Technical Snapshot

- Framework: Next.js 16 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS v4, shadcn/ui (`base-nova`)
- Icons: `lucide-react`
- Theming: `next-themes`
- Data tables/charts: TanStack Table and Recharts

## Current App Shape

- `src/app/` contains routes, layouts, loading states, and global CSS
- `src/app/auth/` contains app-owned authentication and access outcome routes
- `src/components/` contains shared feature and UI components
- `src/components/ui/` contains shadcn-style primitives
- `src/hooks/` contains small reusable client hooks
- `src/lib/` contains utilities and the server-first API integration layer
- `docs/api/` contains backend integration notes used by the frontend

## Integration Direction

This project prefers a server-first frontend architecture:
- server components fetch data
- shared HTTP behavior lives in `src/lib/api/core/`
- domain contracts and mappers isolate backend DTOs from UI models
- pages render mapped frontend models instead of raw API payloads
- feature routes, UI, and helpers are grouped by domain where a bounded context is clear

That pattern is already visible in the landing page content flow and should remain the default for new backend integrations.
