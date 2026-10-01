# Lattice

Single-page site for Lattice, a creative design studio (3D, web, UI/UX, advertising). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, GSAP + ScrollTrigger + SplitText, Lenis smooth scroll and Three.js.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's inside

- **3D logo** — `components/LatticeLogo3D.tsx` rebuilds the Lattice mark in Three.js: a true torus in a liquid-glass material (full transmission, refraction, dispersion, clearcoat) over the matte disc. It is lit by procedural studio environments, so there are no external assets. It follows the pointer, reacts to scroll, pauses when off-screen, and falls back to an SVG mark if WebGL is unavailable. It is code-split, so Three.js loads after the page is interactive.
- **Light / dark mode** — light is the default. Colours are CSS variables (`app/globals.css`) surfaced as Tailwind tokens (`tailwind.config.ts`). The toggle uses the View Transitions API for an atomic circular reveal (`components/ThemeProvider.tsx`), so nothing is ever half-way between themes; browsers without it switch instantly. The choice is saved in `localStorage` and applied before first paint.
- **Pointer** — `components/CustomCursor.tsx` is a dot and ring that use a difference blend (visible on both themes) and turn into an inverting lens over links. The native cursor is hidden only once the custom one is tracking, and touch devices keep their normal behaviour.
- **Motion** — Lenis is wired into `gsap.ticker` (`SmoothScrollProvider.tsx`). Masked hero reveals, scroll-scrubbed manifesto, scrubbed divider lines, parallax, a velocity-reactive marquee and a magnetic email link. Everything respects `prefers-reduced-motion`.

## Editing content

All copy, the team (founder/co-founders/members), case studies, media and social links are
stored in Supabase and edited from the **Lattice_CMS** admin panel (see `Lattice_CMS/README.md`)
— not by hand-editing files. `lib/site.ts`, `lib/team.ts` and `lib/projects.ts` just read that
data at request time (`app/page.tsx`); the only thing left to edit by hand is `app/layout.tsx` /
`public/og-image.png` for the site URL and social preview image.

## Note on `.next`

Don't delete `.next` while `npm run dev` is running: the dev server keeps its compiled chunks there and will start returning 404s until it is restarted.
