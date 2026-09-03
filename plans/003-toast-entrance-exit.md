# 003 — Animate the food-added confirmation toast

- **Status**: DONE
- **Commit**: 2c2a5e5
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Interruptibility
- **Estimated scope**: 1 file

## Problem

```jsx
// src/pages/FoodSearch.jsx:835-842 — current
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f1a0f", border: "1px solid #4a7a4a", borderRadius: 10, padding: "10px 20px", color: "#8fbc8f", fontSize: 14, zIndex: 100, whiteSpace: "nowrap", pointerEvents: "none" }}>
      ✓ {message}
    </div>
  );
}
```

This fires every time a food is added — a frequent, real feedback
moment — and currently teleports in at full opacity/position and
teleports out when React unmounts it 2200ms later. AUDIT.md category 8
calls this out directly: a rare/occasional feedback element with no
motion explaining where it came from.

## Target

A slide-up + fade entrance via `@keyframes` (correct here per the same
reasoning as plan 001 — this mounts once per toast instance, it is not
a rapidly-retriggered toggle), and a fade+slight-drop exit driven by a
local "leaving" state timed to fire before the 2200ms auto-dismiss ends,
so the parent's unmount lands after the exit animation has already
finished playing:

```jsx
// target — src/pages/FoodSearch.jsx
function Toast({ message, onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 2200 - 160);
    const doneTimer = setTimeout(onDone, 2200);
    return () => { clearTimeout(leaveTimer); clearTimeout(doneTimer); };
  }, [onDone]);
  return (
    <div
      className={leaving ? 'toast-out' : 'toast-in'}
      style={{ position: "fixed", bottom: 28, left: "50%", background: "#0f1a0f", border: "1px solid #4a7a4a", borderRadius: 10, padding: "10px 20px", color: "#8fbc8f", fontSize: 14, zIndex: 100, whiteSpace: "nowrap", pointerEvents: "none" }}
    >
      ✓ {message}
    </div>
  );
}
```

```css
/* target — add to src/App.css */
@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(6px); }
}
.toast-in { animation: toast-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.toast-out { animation: toast-out 160ms cubic-bezier(0.4, 0, 1, 1) both; }

@media (prefers-reduced-motion: reduce) {
  @keyframes toast-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes toast-out { from { opacity: 1; } to { opacity: 0; } }
}
```

Note the inline `transform: "translateX(-50%)"` is removed from the
`style` object and moved into the keyframes themselves (both `toast-in`
and `toast-out` include the `translateX(-50%)` horizontal-centering
term in every frame) — otherwise the CSS `animation` shorthand would
overwrite the element's horizontal centering for the animation's
duration.

## Repo conventions to follow

- Same `useState`/`useEffect` + `setTimeout` pattern already used
  elsewhere in this file (e.g. the existing `useEffect(() => { const t =
  setTimeout(onDone, 2200); ...` this plan is modifying) — no new
  pattern introduced, just a second timer.
- Keyframes go in `src/App.css` alongside the ones added by plan 001,
  for the same "shared, not per-component" reasoning.

## Steps

1. In `src/App.css`, append the `@keyframes toast-in`, `@keyframes
   toast-out`, `.toast-in`, `.toast-out` rules and the
   `prefers-reduced-motion` override exactly as shown in Target above.
   (If plan 001 has already been applied, add these to the same
   `prefers-reduced-motion` media block rather than creating a second
   one.)
2. In `src/pages/FoodSearch.jsx`, replace the `Toast` function (lines
   835-842) with the Target version above: add the `leaving` state, the
   second timer, the `className` swap, and remove `transform:
   "translateX(-50%)"` from the inline `style` object (it now lives in
   the keyframes).

## Boundaries

- Do NOT change the 2200ms total visible duration or the message
  content/styling (background, border, padding, font size).
- Do NOT touch the "Meal builder" floating bar at
  `src/pages/FoodSearch.jsx:1338` — that's a different, persistent
  element, out of scope for this plan.
- If the `Toast` function's code doesn't match the excerpt above (drift
  since commit `2c2a5e5`), stop and report instead of guessing.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` from
  `/Users/sriram/attune`, both clean.
- **Feel check**: add a food item from FoodSearch and confirm:
  - The toast slides up + fades in, not an instant pop.
  - Around the 2040ms mark it visibly fades+drops slightly before
    disappearing, rather than an instant cut at 2200ms.
  - It stays horizontally centered throughout both animations (no
    sideways jump) — this is the specific regression risk from moving
    the `translateX(-50%)` into the keyframes.
  - Add two foods in quick succession (before the first toast's timer
    finishes) and confirm the second toast's entrance still plays
    cleanly (React will mount a fresh `Toast` instance per message, so
    this should just work, but confirm no visual overlap glitch).
  - Toggle `prefers-reduced-motion: reduce` and confirm the toast still
    fades in/out but no longer moves vertically.
- **Done when**: the toast visibly animates in and out, stays centered
  throughout, and lint/build are clean.
