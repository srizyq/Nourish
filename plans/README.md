# Animation improvement plans — Phase 3

Audited against [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md)
at commit `2c2a5e5`. This app has no motion library (plain CSS, inline
React styles) and, going in, essentially no custom easing tokens, no
`prefers-reduced-motion` handling, and no entrance/exit animation on any
modal, toast, or expand/collapse control — everything below is additive
or corrective against that baseline, not a rewrite of working motion.

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| [001](001-modal-entrance-exit.md) | Modal entrance/exit animation | HIGH | Physicality / Cohesion | TODO |
| [002](002-logitemrow-disclosure.md) | LogItemRow expand/collapse disclosure | HIGH | Interruptibility | TODO |
| [003](003-toast-entrance-exit.md) | Toast entrance/exit animation | MEDIUM | Physicality | TODO |
| [004](004-global-press-feedback.md) | Global button press feedback | MEDIUM | Physicality | TODO |
| [005](005-consolidate-spin-and-hover-transitions.md) | Consolidate spin keyframes + tighten hover transitions | LOW-MEDIUM | Cohesion / Performance | TODO |

## Recommended execution order

001 → 003 → 002 → 004 → 005.

- **001 and 003 share `src/App.css`** (both append `@keyframes` +
  `prefers-reduced-motion` blocks there) — doing 001 first means 003
  can extend the same media-query block instead of creating a second
  one.
- **005 also touches `src/App.css`** (adds the consolidated `spin`
  keyframe) and **overlaps two of 001's files** (`FoodSearch.jsx`,
  `PhotoScanModal.jsx` indirectly via the shared keyframe) — doing it
  last avoids the two plans' diffs colliding mid-edit.
- **002 and 004 are fully independent** of the others and of each other
  — order between them doesn't matter, placed after 003 only to keep
  all the `App.css`-touching plans (001, 003, 005 minus the keyframe
  move) grouped.

## Not turned into plans this round

- **`prefers-reduced-motion` as a standalone plan** — folded into 001
  and 003 instead, since those are the two plans that actually introduce
  transform-based movement; a standalone accessibility plan would have
  had nothing to gate against before them.
- **FoodSearch's "meal builder" floating bar** (`FoodSearch.jsx:1338`,
  appears/disappears with `builderMode`) — same hard-cut pattern as the
  toast, lower frequency, left as a follow-up if 003 goes well.
- **Route/page transitions** — no motion between pages currently; a
  reasonable choice for this SPA's information density, not flagged as
  a gap.
- **Broad `transition: all` sweep beyond the 3 Dashboard buttons in
  005** — roughly 15 more `transition: 'all ...'` occurrences exist
  across onboarding steps and Settings, all on occasional-frequency
  elements where the risk is low; left alone this round rather than
  padding the plan list with low-leverage findings.
