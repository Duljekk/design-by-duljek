---
title: Shipping fast with Astro islands
date: 2026-07-30
description: How I keep a mostly-static site fast while still using React where interactivity actually earns it.
tags: ['Astro', 'Performance']
---

The best-performing sites ship almost no JavaScript. But real portfolios have interactive bits — a chat widget, a hover card, a comment box. Astro's islands architecture lets you have both: static HTML by default, interactivity only where you opt in.

## Render on the server, hydrate the leaves

Every component starts as server-rendered HTML with zero client JavaScript. You reach for a client directive only on the specific leaf that needs to be interactive, and the rest of the tree stays static.

```astro
<Hero client:load />       <!-- hydrates immediately -->
<Divider client:visible /> <!-- hydrates when scrolled into view -->
<Assistant client:idle />  <!-- hydrates when the browser is idle -->
```

### Pick the cheapest directive that works

- `client:load` — needs to be interactive before first paint. Use sparingly.
- `client:visible` — below the fold. Don't pay for it until it's on screen.
- `client:idle` — nice-to-have interactivity that can wait for a quiet moment.

Most things are `client:visible` or `client:idle`. Very little truly needs `client:load`.

## Keep the boundary low

The temptation is to slap `"use client"` on a whole section. Resist it. Push the boundary down to the smallest piece that actually holds state or animation, so the large, static parent still renders on the server.

> A page that ships 8kb of JS will always beat one that ships 200kb, no matter how clever the 200kb is.

## Measure what you ship

The bundle is the honest scorecard. Build the site, look at what each route ships, and treat any surprise as a bug. Usually it's one dependency pulled in by a component that didn't need to be a client island at all.

Fast isn't a feature you add at the end. It's the default you protect on every commit.
