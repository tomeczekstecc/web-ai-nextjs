# Quickstart: Custom App-Scoped 404 Page

**Feature**: 016-custom-404-page

## What this feature adds

Two `not-found.tsx` files:

| File | Scope | Shell | CTA |
|------|-------|-------|-----|
| `src/app/(app)/not-found.tsx` | Authenticated app routes | AppShell (sidebar / top-nav) | "Przejdź do pulpitu" → `/dashboard` |
| `src/app/not-found.tsx` | Public / global fallback | AuthShell card | "Zaloguj się" → `/auth/sign-in` |

## How to verify

1. Start dev server: `pnpm dev`
2. Visit any non-existent URL while **logged in** (e.g. `/does/not/exist`) → should see
   the app shell with the 404 block centred in the content area.
3. Log out, visit any non-existent URL → should see the AuthShell card 404 page.
4. Check browser DevTools Network tab → response status must be `404`.

## How to customise copy when forking

All visible strings are in the two `not-found.tsx` files. Change the heading,
description, or button label directly in those files. The app name is pulled from
`NEXT_PUBLIC_APP_NAME` in `.env` — no code change needed for rebranding.
