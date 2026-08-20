# AI Agent Guidelines — Portfolio Build

This file steers any AI coding agent (Claude, Copilot, Cursor, etc.) working on this portfolio project. Follow it exactly. If a request conflicts with this file, follow this file and flag the conflict.

## 1. Stack

- **Framework:** React via **Next.js** (App Router) preferred. **Astro** is the fallback for a mostly-static, content-first site with islands of interactivity. Do not mix both — pick one per project and stay consistent.
- **Styling:** **Tailwind CSS** only. No CSS-in-JS, no separate `.css` modules unless Tailwind genuinely cannot express something (e.g. complex keyframes) — in that case scope it tightly and document why.
- **Motion:** **Framer Motion** (`motion` package) for all animation. No manual `requestAnimationFrame` loops, no third motion library alongside it.
- **Language:** TypeScript everywhere. No `.jsx`/`.js` files for components.
- **Package manager:** whatever lockfile already exists in the repo — do not introduce a second one.

## 2. Design source of truth

- **Figma is authoritative** for colors, spacing, typography, and radii. Never invent hex values, font sizes, or spacing numbers — extract them from Figma and encode them in `tailwind.config.ts` as theme tokens.
- All colors go into `theme.extend.colors` as named tokens (e.g. `brand.500`, `ink.900`), not raw hex used inline in components. Same for font families/sizes — extend `theme.fontFamily` / `fontSize`, don't hardcode `text-[17px]` unless it's a genuine one-off.
- If a Figma spec is ambiguous or missing a breakpoint/state, ask rather than guessing — do not silently approximate.
- Keep a single `tailwind.config.ts` as the design token registry. Do not duplicate token values in component files.

## 3. Component architecture

- **No dumping UI into one file.** Every logically distinct piece of UI is its own component: `Hero`, `ProjectCard`, `Nav`, `Footer`, `SectionHeading`, etc.
- Directory shape (Next.js App Router):
  ```
  app/                 # routes only (page.tsx, layout.tsx), thin — compose components
  components/
    ui/                # small reusable primitives (Button, Badge, Container)
    sections/          # page sections (Hero, About, Projects, Contact)
    motion/            # shared Framer Motion variants/wrappers
  lib/                 # utils, constants, data fetching
  content/             # MDX/JSON content if applicable
  ```
- One component per file, named export matching filename. Co-locate a component's own sub-parts only if they are never reused elsewhere; otherwise promote to `components/ui`.
- Props should be typed with explicit interfaces, not inline object types, when the component has more than 1–2 props.
- Server Components by default (Next.js App Router). Only add `"use client"` where interactivity/animation/state actually requires it — push the boundary as low/leaf as possible so large trees stay server-rendered.

## 4. Framer Motion conventions

- Define reusable animation **variants** in `components/motion/variants.ts` (e.g. `fadeUp`, `staggerContainer`) rather than inlining `initial/animate/exit` objects repeatedly across components.
- Prefer `whileInView` with `viewport={{ once: true }}` for scroll-triggered entrances — avoids replaying animations on every scroll and reduces layout thrash.
- Respect `prefers-reduced-motion`. Wrap animation config so users with reduced-motion get instant/opacity-only transitions (use Framer Motion's `useReducedMotion` hook).
- Keep animated components client components, but keep the *parent* server-rendered — isolate the `"use client"` boundary to the smallest animated leaf.
- Avoid animating layout-triggering properties (`width`, `height`, `top`, `left`) — animate `transform` and `opacity` instead for GPU-accelerated, jank-free motion.
- Avoid excessive simultaneous animations; stagger with `staggerChildren` rather than firing 20 independent animations on load.

## 5. Performance

- **Images:** always use `next/image` (or Astro's `<Image>`) with explicit `width`/`height` or `fill` + sized container — never a raw `<img>`. Serve modern formats (AVIF/WebP), lazy-load below-the-fold images, `priority` only on the LCP image.
- **Fonts:** self-host via `next/font` (or Astro font tooling) to avoid render-blocking requests and layout shift; subset to needed weights/character sets.
- **Code splitting:** dynamically import heavy, below-the-fold, or rarely-used components (`next/dynamic`) — e.g. a contact form modal, a heavy chart, a lightbox.
- **Bundle hygiene:** no unused dependencies; check bundle impact before adding a library. Prefer native CSS/Tailwind over JS solutions where possible (e.g. CSS `:hover` over JS mouse handlers when no logic is needed).
- **Third-party scripts:** load via `next/script` with `strategy="lazyOnload"` or `"afterInteractive"` as appropriate; never block first paint with analytics/embeds.
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms. Avoid layout shift from web fonts, images, and late-mounted animated content (reserve space with min-height/aspect-ratio).
- Memoize expensive computations (`useMemo`) and stable callbacks passed to memoized children (`useCallback`), but don't over-apply — only where a real re-render cost exists.

## 6. Accessibility

- Semantic HTML first (`<nav>`, `<main>`, `<section>`, `<button>` vs `<div onClick>`).
- All interactive elements keyboard-navigable and focus-visible (don't strip Tailwind's focus rings without replacing them).
- Sufficient color contrast against Figma-derived palette — flag to the user if a spec'd color fails WCAG AA on its background.
- `alt` text on all meaningful images; decorative images get `alt=""`.
- Respect `prefers-reduced-motion` (see §4) and `prefers-color-scheme` if dark mode is in scope.

## 7. Code quality & structure

- ESLint + Prettier (or Biome, if already configured) must pass before considering a task done.
- No inline styles (`style={{}}`) except for values that are genuinely dynamic/computed at runtime and can't be a Tailwind class.
- No dead code, no commented-out blocks left behind, no console.logs in committed code.
- Small, focused commits/PRs per feature or section — don't bundle unrelated changes.
- Write self-explanatory code over comments; only comment non-obvious *why* (e.g. a specific Figma constraint, a Safari-only workaround).
- Reuse existing `components/ui` primitives before creating a near-duplicate.

## 8. SEO & metadata

- Use Next.js Metadata API (`generateMetadata` / `metadata` export) or Astro's `<head>` per page — title, description, Open Graph, Twitter card, canonical URL.
- One `<h1>` per page, logical heading hierarchy for sections.
- Generate `sitemap.xml` and `robots.txt`.
- Add JSON-LD structured data for the person/portfolio (`Person` / `CreativeWork` schema) where relevant.

## 9. When specs are unclear

If Figma specs, copy, or behavior aren't fully defined for a section, stop and ask rather than fabricating content, filler text, or placeholder colors that don't map to the design system.

## 10. Astro-specific notes

- Start the dev server in background mode: `astro dev --background`. Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.
- Consult before working on related tasks:
  - [Routing, dynamic routes, middleware](https://docs.astro.build/en/guides/routing/)
  - [Astro components](https://docs.astro.build/en/basics/astro-components/)
  - [React/Vue/Svelte framework components](https://docs.astro.build/en/guides/framework-components/)
  - [Content collections](https://docs.astro.build/en/guides/content-collections/)
  - [Styling / Tailwind](https://docs.astro.build/en/guides/styling/)
  - [Internationalization](https://docs.astro.build/en/guides/internationalization/)
