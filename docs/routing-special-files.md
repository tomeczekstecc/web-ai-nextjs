# Next.js App Router — Special Files Reference

A consolidated list of file and folder conventions recognized by the Next.js App Router (Next.js 16+), grouped by purpose. All routing files support `.js`, `.jsx`, and `.tsx` extensions unless noted.

## Routing files (inside `app/`)

| File | Purpose |
|---|---|
| `layout.{js,jsx,tsx}` | Shared UI for a segment and its children. Must accept a `children` prop. The root layout must define `<html>` and `<body>`. |
| `page.{js,jsx,tsx}` | Unique UI of a route. Makes the segment publicly routable. |
| `loading.{js,jsx,tsx}` | Loading UI (React Suspense fallback) for the segment. |
| `error.{js,jsx,tsx}` | Error UI (React error boundary). Must be a Client Component. |
| `global-error.{js,jsx,tsx}` | Error boundary for the root layout. Must render its own `<html>` and `<body>`. |
| `not-found.{js,jsx,tsx}` | UI rendered for `notFound()` calls and unmatched URLs. |
| `forbidden.{js,jsx,tsx}` | UI for `forbidden()` (HTTP 403). |
| `unauthorized.{js,jsx,tsx}` | UI for `unauthorized()` (HTTP 401). |
| `template.{js,jsx,tsx}` | Like `layout`, but re-mounts on navigation (no shared state across routes). |
| `default.{js,jsx,tsx}` | Fallback UI for parallel route slots that don't match the current URL. |
| `route.{js,ts}` | Route Handler (replaces `pages/api/*`). Exports HTTP methods (`GET`, `POST`, …) as named exports. |

## Folder conventions

### Dynamic segments

| Convention | Purpose |
|---|---|
| `[param]` | Dynamic segment. |
| `[...param]` | Catch-all segment. |
| `[[...param]]` | Optional catch-all segment. |

### Organization

| Convention | Purpose |
|---|---|
| `(group)/` | Route group — organizes routes without affecting the URL. |
| `_folder/` | Private folder — excluded from routing. |

### Parallel and intercepting routes

| Convention | Purpose |
|---|---|
| `@slot/` | Named parallel slot, rendered into a layout prop. |
| `(.)segment` | Intercept a route at the same level. |
| `(..)segment` | Intercept one level above. |
| `(..)(..)segment` | Intercept two levels above. |
| `(...)segment` | Intercept from the root. |

## Project-root special files

| File | Purpose |
|---|---|
| `proxy.{js,ts}` | **Next.js 16+** replacement for middleware. The exported function must be named `proxy`. Lives at the project root (or `src/`). |
| `middleware.{js,ts}` | **Deprecated in v16.** Migrate using `npx @next/codemod@latest middleware-to-proxy .`. |
| `instrumentation.{js,ts}` | Server instrumentation hooks: `register()` and `onRequestError()`. |
| `instrumentation-client.{js,ts}` | Client-side instrumentation entry point. |

## Metadata files (inside `app/`)

| File | Purpose |
|---|---|
| `favicon.ico` | Site favicon (root `app/` only). |
| `icon.{ico,jpg,jpeg,png,svg}` / `icon.{js,ts,tsx}` | App icon (static or generated). |
| `apple-icon.{jpg,jpeg,png}` / `apple-icon.{js,ts,tsx}` | Apple touch icon (static or generated). |
| `opengraph-image.{jpg,jpeg,png,gif}` / `opengraph-image.{js,ts,tsx}` | Open Graph image (static or generated). |
| `twitter-image.{jpg,jpeg,png,gif}` / `twitter-image.{js,ts,tsx}` | Twitter card image (static or generated). |
| `sitemap.xml` / `sitemap.{js,ts}` | Sitemap (static or generated). |
| `robots.txt` / `robots.{js,ts}` | Robots file (static or generated). |
| `manifest.{json,webmanifest}` / `manifest.{js,ts}` | PWA web app manifest. |

## Pages Router equivalents (legacy)

For reference when migrating from `pages/` to `app/`:

| Pages Router | App Router replacement |
|---|---|
| `pages/_app.{js,tsx}` | `app/layout.tsx` (root layout) |
| `pages/_document.{js,tsx}` | `app/layout.tsx` (root layout) |
| `pages/_error.{js,tsx}` | Granular `error.tsx` / `global-error.tsx` |
| `pages/404.{js,tsx}` | `not-found.tsx` |
| `pages/500.{js,tsx}` | `error.tsx` / `global-error.tsx` |
| `pages/api/*` | `route.{js,ts}` (Route Handlers) |
| `getStaticPaths` | `generateStaticParams` |
| `getStaticProps` / `getServerSideProps` | Server Components + `fetch` with caching options |

## File resolution priority

When multiple files exist at the same segment, Next.js composes them in this order (outer → inner):

`layout` → `template` → `error` → `loading` → `not-found` → `page` / `route`

## Sources

- [Next.js — File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Next.js — App Router Migration Guide](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- [Next.js — Proxy (replaces Middleware)](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js — Instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
