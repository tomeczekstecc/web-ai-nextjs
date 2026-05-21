# CONTEXT

Domain glossary for the ci-prs web application template.

---

## app-scoped 404

A `not-found.tsx` file placed inside `src/app/(app)/` so that it is automatically wrapped by the `(app)` layout (AppShell) and only catches routes within the authenticated route group. It does **not** detect auth state itself — the layout provides the shell.

Contrast with: a root-level `not-found.tsx` at `src/app/` which renders outside all authenticated layouts and is used as a fallback for public/unauthenticated routes.

## 404 page layout

- **Authenticated** (`(app)/not-found.tsx`): `flex flex-1 items-center justify-center` — centred inside the AppShell content column.
- **Public** (`src/app/not-found.tsx`): wraps content in the existing `AuthShell` component — consistent with the sign-in page, appropriate since the CTA is "Zaloguj się".

Neither page has a dedicated page header or breadcrumbs.

Both pages share the same heading and description. Only the CTA differs.

| Element | Value |
|---------|-------|
| Large number | `404` |
| Heading | `Nie znaleziono strony` |
| Description | `Strona, której szukasz, nie istnieje lub została przeniesiona.` |
| CTA — authenticated | `Przejdź do pulpitu` → `/dashboard` |
| CTA — public | `Zaloguj się` → `/auth/sign-in` |

Both 404 pages (app-scoped and root-level) use a **minimal content-area insert**: large muted "404" number, a heading, a short message, and a single CTA button. No decorative chrome, no illustrations, no special backgrounds. Styled with existing design tokens only.

The single primary CTA on a 404 page. Context-dependent:
- **Authenticated 404** (`(app)/not-found.tsx`): "Przejdź do pulpitu" → `/dashboard`
- **Public 404** (`src/app/not-found.tsx`): "Zaloguj się" → `/auth/sign-in`

No secondary action on either page.

A `not-found.tsx` at `src/app/` — no shell, no auth — used as a fallback for unauthenticated visitors hitting undefined public routes. Renders a minimal branded page with a link to `/` or `/auth/sign-in`.
