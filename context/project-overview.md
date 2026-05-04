# CI-PRS Web Project Overview

## What This Repository Is

This repository contains the frontend for `CI-PRS Web Platform`.

Today it serves two concrete purposes:
- a polished landing page in `app/page.tsx`
- a dashboard-style internal UI in `app/dashboard/page.tsx`

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

- `app/` contains routes, layouts, loading states, and global CSS
- `components/` contains shared feature and UI components
- `components/ui/` contains shadcn-style primitives
- `hooks/` contains small reusable client hooks
- `lib/` contains utilities and the server-first API integration layer
- `docs/api/` contains backend integration notes used by the frontend

## Integration Direction

This project prefers a server-first frontend architecture:
- server components fetch data
- shared HTTP behavior lives in `lib/api/core/`
- domain contracts and mappers isolate backend DTOs from UI models
- pages render mapped frontend models instead of raw API payloads

That pattern is already visible in the landing page content flow and should remain the default for new backend integrations.
