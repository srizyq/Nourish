# 004 — Add global button press feedback

- **Status**: DONE
- **Commit**: 2c2a5e5
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (`src/App.css`), app-wide effect
- **Shipped note**: the `transition`-based Target below was implemented
  as planned, then caught in live verification and revised — see
  "Correction" after Target.

## Problem

There is no press/`:active` feedback anywhere in the app:

```
$ grep -rn ":active\|onMouseDown\|onTouchStart" src --include="*.jsx" --include="*.css"
(no results, excluding unrelated `isActive`/`is-active` nav-state matches)
```

Every interactive control in the app is a real `<button>` element
(confirmed across `Dashboard.jsx`, `Settings.jsx`, `FoodSearch.jsx`,
`LogItemRow.jsx`, `Progress.jsx`, onboarding steps, etc. — all buttons
use `<button onClick={...} style={{...}}>`), so a single global rule has
full coverage. AUDIT.md category 3 specifically names this: "Pressable
elements with no press feedback" is a finding, and gives the exact
target (`scale(0.97)` on `:active`, 160ms ease-out).

## Target

```css
/* target — add to src/App.css */
button:not(:disabled):active {
  transform: scale(0.97);
}
button {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
```

`ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) is correct here per
AUDIT.md category 2's decision order (this is neither a hover/color
case nor on-screen movement — press-and-release is closest to an
entrance/exit pair, and 160ms sits inside the "button press feedback:
100-160ms" budget in the same doc).

The `transition` lives on the bare `button` selector (not just
`:active`) so the release (scale back to 1) also animates, not just the
press.

### Correction (found during live verification, not anticipated above)

The bare `button { transition: transform 160ms ... }` rule above turned
out to be dead in practice: nearly every button in this codebase sets
its own inline `style.transition` (e.g. `transition: 'border-color
0.15s'` for hover states). An inline `transition` fully replaces the
property rather than merging with an external rule targeting the same
element — confirmed live via `getComputedStyle(button).transition` on a
Dashboard shortcut button, which returned only `border-color 0.15s`,
with `transform` silently dropped. The `:active { transform: scale(0.97)
}` half still applied (inline styles can't target `:active` at all), but
with no transition covering `transform`, the scale would snap instantly
instead of animating over 160ms as specified.

Fixed by switching from `transition` to `animation` for the press
effect — a separate CSS property untouched by any button's inline
`transition`, so it can never be silently overridden the same way:

```css
/* shipped — src/App.css, replaces the two rules in Target above */
@keyframes button-press { from { transform: scale(1); } to { transform: scale(0.97); } }
button:not(:disabled):active {
  animation: button-press 160ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
```

Trade-off: the press-in still animates smoothly over 160ms as intended,
but release (on pointer-up, when `:active` stops matching) now reverts
instantly rather than springing back — CSS `animation` has no clean
equivalent to `transition`'s "animate away from wherever you currently
are" behavior once the triggering state ends. Given the alternative was
either an even-larger diff (appending `transform` to every button's own
inline `transition` list across ~20 files) or `!important` (which would
have clobbered each button's own hover-color transition entirely), this
was the best available fix within a single-file, cascade-safe change.

## Repo conventions to follow

- Global, app-wide rules belong in `src/App.css` (see the existing
  top-level rules there, e.g. the `.mood` rule at line 185).
- This must NOT override any existing per-button inline
  `style={{ transform: ... }}` — check before finalizing that no button
  in the codebase sets its own `transform` in inline styles (grep
  confirms none currently do outside of icon-rotation contexts unrelated
  to buttons), so the global rule is safe to add without a specificity
  conflict.

## Steps

1. Run `grep -rn "style={{.*transform:" src --include="*.jsx" | grep -i button` to
   reconfirm no button currently sets an inline `transform` (if any are
   found, list them here and exclude coverage for that button via a
   more specific rule instead of removing the global one — otherwise
   proceed with the global rule as-is).
2. Append the two rules from Target above to the end of `src/App.css`.

## Boundaries

- Do NOT touch individual component files — this is a single global CSS
  addition.
- Do NOT apply this to non-`<button>` clickable elements (e.g. any
  `<div onClick=...>` overlays like the modal backdrops from plan 001) —
  those are handled separately if at all; this plan is `<button>` only.
- Do NOT change the scale value from `0.97` or the duration from
  `160ms` — these are the exact AUDIT.md targets.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` from
  `/Users/sriram/attune`, both clean.
- **Feel check**: click/tap buttons across at least 3 different pages
  (e.g. Dashboard shortcuts, FoodSearch add-food buttons, Settings mode
  toggle) and confirm:
  - Every button visibly compresses slightly on press and springs back
    on release — not just the ones this plan's author tested.
  - Disabled buttons (e.g. LogItemRow's "Saving…" state, FoodSearch's
    disabled add button) show no press feedback.
  - No layout shift or clipping occurs where a button sits flush against
    another element (the 3% scale-down is small enough this should be
    a non-issue, but check crowded rows like `LogItemRow`'s meal unit
    picker).
  - In DevTools Animations panel at 10% playback, confirm only
    `transform` is animating (no width/height/layout properties).
- **Done when**: press feedback is visible on buttons across the whole
  app with no regressions on disabled states or crowded layouts, lint
  and build are clean.
