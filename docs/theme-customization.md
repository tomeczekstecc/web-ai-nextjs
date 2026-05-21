# Theme Customization

This project uses [shadcn/ui](https://ui.shadcn.com/) on top of Tailwind CSS v4.
The active style is **`base-nova`** (see `components.json`), with theme tokens
defined as CSS variables in `src/app/globals.css`.

This doc explains how to change the look and feel of a downstream project
without breaking shadcn primitives or the template-sync workflow.

## How the theme is wired

- `components.json` — declares the shadcn style (`base-nova`), the icon library
  (`lucide`), Tailwind v4 setup, and component aliases. **Do not** edit aliases
  unless you understand how that affects every shadcn `add` going forward.
- `src/app/globals.css` — imports `tailwindcss`, `tw-animate-css`, and
  `shadcn/tailwind.css`, then declares:
  - `@theme inline { ... }` — the Tailwind v4 token bridge that maps
    `--color-*` and `--font-*` variables to Tailwind utilities.
  - `:root { ... }` — light-mode CSS variable values.
  - `.dark { ... }` — dark-mode overrides.
- `next-themes` — switches the `.dark` class on `<html>`. Light/dark parity is
  required.

## Recommended workflow: prototype, then port

1. **Prototype on shadcn**

   Open https://ui.shadcn.com/create. Pick a base color, a radius, and a font.
   Iterate visually until the result matches the product direction.

2. **Export the CSS variables**

   The site emits a CSS block of the form:

   ```css
   :root {
     --background: ...;
     --foreground: ...;
     /* ... */
   }
   .dark {
     --background: ...;
     /* ... */
   }
   ```

3. **Port the variables into `src/app/globals.css`**

   Replace the existing `:root { ... }` and `.dark { ... }` blocks with the
   exported ones. Leave the `@theme inline { ... }` block alone — it bridges
   the variables into Tailwind utilities and does not need to change for a
   pure recolor.

4. **Verify**

   ```bash
   pnpm dev
   ```

   Walk these pages with the theme switcher in both modes:
   - Landing / dashboard
   - Auth pages (`src/app/auth/`)
   - Forms-heavy page (any wizard)
   - A page that uses shadcn `Card`, `Button`, `Input`, `Select`, `Dialog`,
     `Sidebar`, and `DataTable`.

5. **Run accessibility checks**

   See [`../context/accessibility.md`](../context/accessibility.md). Confirm
   contrast on `--muted-foreground` against `--muted`, `--primary-foreground`
   against `--primary`, and any `destructive` pairings.

## When to change the shadcn style (not just colors)

Changing colors / radius / fonts → CSS variables only.
Changing component shapes, density, or component anatomy → consider switching
the shadcn style in `components.json`.

```jsonc
// components.json
{
  "style": "base-nova"
}
```

If you switch styles:

```bash
pnpm dlx shadcn@latest diff
pnpm dlx shadcn@latest add button card input dialog ...
```

> Style changes touch every `src/components/ui/*` file. Do this on a dedicated
> branch and review the diff carefully — overrides made in the template will be
> overwritten by the new style's defaults.

## Adding or updating shadcn components

```bash
pnpm dlx shadcn@latest add <component>
pnpm dlx shadcn@latest diff <component>   # see what would change
```

Components land under `src/components/ui/`. Treat them as **template-owned
code**: small local edits are fine, large rewrites should become a wrapper in
`src/components/<domain>/` instead. This keeps [`template-sync.md`](./template-sync.md)
merges clean.

## Fonts and icons

- Fonts are declared via `--font-sans` / `--font-heading` in `globals.css` and
  loaded in `src/app/layout.tsx` (Next.js `next/font`). Swap the font import
  there, then update the variables to match.
- Icons come from `lucide-react`. Do not introduce a second icon library
  without updating `components.json`.

## Dark-mode rules

- Every color decision must have a `.dark` counterpart.
- Avoid hardcoded hex values in components. Always use the CSS variables
  through Tailwind utilities (`bg-background`, `text-foreground`,
  `border-border`, etc.).
- Charts: `--chart-1`..`--chart-5` are part of the theme. Update them in both
  modes.

## What not to do

- Do not edit files under `src/components/ui/` to apply theme tweaks. Edit the
  CSS variables instead.
- Do not introduce a global override stylesheet outside `globals.css`.
- Do not pin colors per-page. If a page needs a unique accent, add a new CSS
  variable in `globals.css` so dark mode and template sync still work.

## Out of scope (today)

- Multi-brand theming (per-tenant CSS variable swap).
- Theme tokens in TypeScript (e.g. exporting a `theme.ts` for charts).
