# Changelog

All notable changes to this project will be documented here.


## [0.7.3](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.7.2...v0.7.3) (2026-05-27)

### 🔧 Chores

* **git:** exclude .env.example from .gitignore ([29521c5](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/29521c5fdc2379e07b8b2635af365042b82c6a25))

## [0.7.2](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.7.1...v0.7.2) (2026-05-27)

### 📝 Documentation

* add release-flow.md documenting branching and release workflow ([9357968](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/9357968e0bb76fe60e3df375e6944c7341daa45c))

## [0.7.1](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.7.0...v0.7.1) (2026-05-27)

### 🔧 Chores

* **env:** add mock placeholder values to .env.example ([4045289](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/4045289a25e14406ad82dafa8d55b14af5c237e9))

## [0.7.0](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.6.1...v0.7.0) (2026-05-27)

### ✨ Features

* **scripts:** auto-copy .env.example to .env before build if .env is missing ([59f1457](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/59f1457a37504345332078a395e7173d51d859a4))

## [0.6.1](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.6.0...v0.6.1) (2026-05-27)

### 🔧 Chores

* **env:** add NODE_ENV=development to .env.example ([82a58a1](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/82a58a11e5f2451d413fcfa0d3f90f4350418c88))

## [0.6.0](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.5.1...v0.6.0) (2026-05-27)

### ✨ Features

* **scripts:** auto-copy .env.example to .env before dev/start if .env is missing ([4c8a12d](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/4c8a12d7c232c7818e9d1332f040c26d679d9aa7))

## [0.5.1](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.5.0...v0.5.1) (2026-05-27)

### 🔧 Chores

* **env:** add safe default placeholders for Laravel internal auth tokens in .env.example ([785598d](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/785598d56e54636193422899dd0cae6e661aa712))

## [0.5.0](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/compare/v0.4.0...v0.5.0) (2026-05-27)

### ✨ Features

* **skills:** enhance speckit-specify with Mantis gate and Format A branch naming ([cddefdc](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/cddefdcd3ecd292be02e4945c008ae6475fb5397))

### ♻️ Refactors

* **skills:** move mantis/date to front of branch name ([b8bed70](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/b8bed70a3981537c0d4ffa164f02e60cde0052c4))

### 📝 Documentation

* **changelog:** rewrite to show only per-release changes ([9979373](https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web/commit/9979373b71d3d5697af993fb2c40784a2dc83461))

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
