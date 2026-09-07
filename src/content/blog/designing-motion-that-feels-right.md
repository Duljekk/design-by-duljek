---
title: Designing motion that feels right
description: A few principles I lean on to make interface animation feel intentional instead of decorative.
date: 2026-08-24
tags: ['Motion', 'Craft']
---

Motion is one of the easiest things to add to an interface and one of the hardest to get right. A transition that feels wrong is worse than no transition at all — it draws attention to itself instead of the content. Here are the principles I keep coming back to.

## Start from intent, not effect

Before reaching for a spring or an ease curve, I ask what the motion is *for*. Good animation almost always does one of three jobs:

- **Orientation** — showing where something came from or where it went.
- **Feedback** — confirming that an action registered.
- **Continuity** — keeping the user anchored as the layout changes.

If a piece of motion isn't doing one of those, it's decoration, and decoration is the first thing to cut.

### The quiet default

My default is that most things should *not* animate. The interface should feel calm at rest. Motion earns its place by being rare enough to mean something.

## Prefer transforms over layout

Animating `width`, `height`, `top`, or `left` forces the browser to recalculate layout on every frame. Animating `transform` and `opacity` doesn't — those run on the compositor and stay smooth even on cheaper devices.

```ts
// Janky: triggers layout on every frame
animate({ width: 320 });

// Smooth: composited, GPU-friendly
animate({ scaleX: 1.2 });
```

When you genuinely need a size change, a shared-layout technique that morphs a single element beats animating two.

## Springs over durations

Duration-based easing describes a fixed length of time. Springs describe *physics* — stiffness and damping — so interruptions feel natural. When a user reverses a gesture halfway through, a spring carries the momentum with them instead of snapping to a timeline.

> The goal isn't for people to notice the animation. It's for them to notice its absence.

## Respect reduced motion

Some people get motion sick from parallax and large movements. Always honor `prefers-reduced-motion` — collapse entrances down to a simple opacity fade, and never gate meaning behind an animation someone might have turned off.

Get these four right and motion stops being something you *add* to a design. It becomes part of how the design thinks.
