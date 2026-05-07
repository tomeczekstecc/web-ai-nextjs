---
name: web-nextjs-app-router
description: Use when building or refactoring Next.js App Router features in this repository, especially for route structure, server and client component boundaries, layouts, data fetching choices, metadata, navigation, and modern Next.js patterns that should be checked with Context7 first.
---

# Web Next.js App Router

## Overview

Use this skill for `apps/web` work that depends on Next.js App Router structure and rendering decisions. Keep routing, layouts, and component boundaries aligned with the existing app while checking exact framework behavior with `$context7-first` when needed.

## Workflow

1. Read the closest route segment in `apps/web/app`.
2. Decide whether the component should stay server-side or become a client component.
3. Keep `"use client"` only where interactivity, hooks, or browser APIs require it.
4. Keep route and layout responsibilities inside the App Router structure instead of moving them into random helpers.
5. Use `$context7-first` for exact Next.js APIs such as metadata, caching, navigation, server actions, or route behavior.

## Rules

- Prefer server components by default.
- Isolate client interactivity into leaf components when practical.
- Keep route files small and push reusable UI into `components/`.
- Respect existing aliases, file placement, and app-level layout patterns.
- Avoid framework workarounds before confirming the API in docs.

## Validation

- Run `npm run build` or `npm run check-types` from `apps/web`.
