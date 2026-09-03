# 002 — Animate LogItemRow's expand/collapse edit panel

- **Status**: DONE
- **Commit**: 2c2a5e5
- **Severity**: HIGH
- **Category**: Interruptibility / Missed opportunities
- **Estimated scope**: 1 file

## Problem

`LogItemRow` (shared by the Dashboard's compact meal log — used at
`src/pages/Dashboard.jsx:270` — and the full `/log` page — used twice at
`src/pages/DailyLog.jsx:111` and `:157`) expands in place to edit a
logged food's amount. The expand is a hard React conditional mount with
no transition at all:

```jsx
// src/components/LogItemRow.jsx:97-98 — current
{isExpanded && (
  <div style={{ padding: '4px 18px 16px', background: '#111' }}>
```

The row's content (calories, macros, ~140px of form) snaps open and
shut instantly on every tap of the row. This is a genuinely high
frequency interaction — expanding a logged item is one of the most
common actions in the app — and it's exactly the "reversible mid-motion,
rapidly triggered" case AUDIT.md category 4 calls out as needing a
transition (not a `@keyframes` restart-from-zero), and the exact
"state change that teleports" AUDIT.md category 8 says a brief
transition should prevent.

## Target

CSS can't transition to `height: auto` directly. The correct modern
technique (no JS height measurement, no ResizeObserver) is a
`grid-template-rows: 0fr -> 1fr` wrapper, which the audit's own
guidance to prefer CSS-only predetermined motion over JS supports:

```jsx
// target — src/components/LogItemRow.jsx
<div
  style={{
    display: 'grid',
    gridTemplateRows: isExpanded ? '1fr' : '0fr',
    transition: 'grid-template-rows 220ms cubic-bezier(0.77, 0, 0.175, 1)',
  }}
>
  <div style={{ overflow: 'hidden' }}>
    <div style={{ padding: '4px 18px 16px', background: '#111' }}>
      {/* existing expanded content, unchanged */}
    </div>
  </div>
</div>
```

The chevron (`▲`/`▼` at line 94) should rotate instead of flip via text
swap, so it reads as one continuous motion with the panel:

```jsx
// target — src/components/LogItemRow.jsx:94
<span style={{
  color: C.border2, fontSize: 12, display: 'inline-block',
  transition: 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1)',
  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
}}>▼</span>
```

`ease-in-out` (`cubic-bezier(0.77, 0, 0.175, 1)`) is correct here per
AUDIT.md category 2 — this is content moving/morphing on screen, not a
one-directional entrance.

## Repo conventions to follow

- The component already always renders the `isExpanded &&` block only
  when open (no separate "closed" placeholder markup) — the grid-rows
  wrapper replaces that top-level conditional with an always-rendered
  wrapper whose collapsed state is `0fr` height, so the DOM node needs
  to exist even when collapsed (this is the one structural change this
  plan requires — everything else about the component is untouched).
- Match the existing inline-`style` convention used throughout this file
  — no CSS classes, no new file.

## Steps

1. In `src/components/LogItemRow.jsx`, change line 97 from
   `{isExpanded && (` / closing `)}` at line 139, to an always-rendered
   grid wrapper: replace
   ```jsx
   {isExpanded && (
     <div style={{ padding: '4px 18px 16px', background: '#111' }}>
       ...existing content...
     </div>
   )}
   ```
   with
   ```jsx
   <div style={{ display: 'grid', gridTemplateRows: isExpanded ? '1fr' : '0fr', transition: 'grid-template-rows 220ms cubic-bezier(0.77, 0, 0.175, 1)' }}>
     <div style={{ overflow: 'hidden' }}>
       <div style={{ padding: '4px 18px 16px', background: '#111' }}>
         ...existing content, unchanged...
       </div>
     </div>
   </div>
   ```
2. Change line 94's chevron span from swapping `▲`/`▼` text to a single
   `▼` glyph that rotates 180deg when expanded, exactly as shown in
   Target above.
3. Check the `useEffect` at lines 52-56 (`if (!isExpanded) return; ...`)
   still behaves correctly — it already guards on `isExpanded` and only
   resets `amount`/`unit` when true, so no change needed there; note
   this in the diff but do not alter that effect.

## Boundaries

- Do NOT change the internal form fields, `handleSave`, or any state
  logic — only the outer collapse wrapper and the chevron.
- Do NOT add a JS height-measurement approach (`ref.scrollHeight`,
  `ResizeObserver`) — the grid-rows technique is the target and must be
  used as-is.
- Do NOT touch `Dashboard.jsx` or `DailyLog.jsx` — this is a single
  shared-component fix, both call sites inherit it automatically.
- If line numbers have drifted from commit `2c2a5e5`, locate the
  `{isExpanded && (` block and the chevron span by content, not by line
  number, but do not restructure anything beyond what's specified here.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` from
  `/Users/sriram/attune`, both clean.
- **Feel check**: on both the Dashboard meal log and the `/log` page,
  tap a logged item repeatedly (open, close, open again quickly,
  including mid-animation) and confirm:
  - The panel grows/shrinks smoothly, no instant snap.
  - Tapping again while it's still animating retargets smoothly (no
    jump, no restart-from-zero) — this is the concrete test that grid-
    template-rows transitions (not keyframes) were used correctly.
  - The chevron rotates in sync with the panel, not before/after it.
  - In DevTools Animations panel at 10% playback speed, confirm only
    `grid-template-rows` and the chevron's `transform` are animating —
    no layout thrash on unrelated siblings.
  - Toggle `prefers-reduced-motion: reduce` in DevTools Rendering panel
    — this one is a size/layout change, not a transform, so it's fine
    to leave it unchanged by reduced-motion (AUDIT.md category 6 says
    "keep transitions that aid comprehension" — a fully instant
    open/close here would be more jarring, not less, so no
    reduced-motion branch is required for this particular animation).
- **Done when**: expand/collapse is smooth and interruptible on both
  pages, lint and build are clean.
