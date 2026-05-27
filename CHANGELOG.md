# Changelog

All notable changes to this project will be documented here.


## [0.4.0](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.3.0...v0.4.0) (2026-05-27)

### ✨ Features

* **skills:** add git-add-to-dev skill ([acc2e00](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/acc2e00fae28bacd5458c4c0a778abf5cc172e1b))


## [0.3.0](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.1.0...v0.3.0) (2026-05-27)

### ✨ Features

* **scripts:** add --port argument to init-from-template.sh; fix requireBranch from 'main' to 'master' ([ffc4bce](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/ffc4bce552884e2fa05b92229e2242e486e0ff81))


## 0.1.0 (2026-05-27) — Initial release

First tagged release. Includes the full baseline template:

### ✨ Features

* App Router shell with `(app)` route group, AppShell, sidebar and top-nav layout modes
* Role-based access control (RBAC) — server gates, action gates, menu filter, `<RoleGate>` / `<PermissionGate>`
* Better Auth integration with SSO/OIDC, social login, session bypass, and mock auth toggle
* Multi-step wizard engine (WizardProvider / WizardShell / TanStack Query data layer / Zod validation)
* TanStack Query + MSW mock layer for dashboard, applications, tasks, wizard, and menu domains
* Data table with server-side search, filters, row count, Excel export, and copy-to-clipboard
* Upload component with task-files demo
* JSON-driven navigation menu
* Reports Management module (020)
* Date/time helpers, icon registry, skeleton patterns, toast system
* SEO metadata, robots.txt, sitemap
* `scripts/init-from-template.sh` one-shot project initializer
* Environment variable validation with `@t3-oss/env-nextjs`
* release-it + conventional-changelog pipeline
