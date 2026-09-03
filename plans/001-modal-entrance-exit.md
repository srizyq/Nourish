# 001 — Modal entrance/exit animation

- **Status**: DONE
- **Commit**: 2c2a5e5
- **Severity**: HIGH
- **Category**: Physicality & origin / Cohesion & tokens
- **Estimated scope**: 4 files (App.css + 3 component files, 4 modal render sites), 1 new shared hook

## Problem

Every modal in the app is a hard React conditional mount: the dark backdrop
and the panel both appear and disappear in a single frame, with zero
opacity/transform transition. Four separate call sites duplicate the exact
same backdrop/panel markup with no shared animation:

```jsx
// src/components/PhotoScanModal.jsx:100-101 — current
<div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
  <div onClick={e => e.stopPropagation()} style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto' }}>
```

```jsx
// src/pages/FoodSearch.jsx:476-478 — current (ScanModal, barcode)
<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  <div onClick={e => e.stopPropagation()} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}>
```

```jsx
// src/pages/FoodSearch.jsx:495-496 — current (ModalShell, shared by
// create-food / saved-meals / builder-review modals)
<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
  <div onClick={e => e.stopPropagation()} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16, width: "100%", maxWidth, maxHeight: "85vh", overflowY: "auto" }}>
```

```jsx
// src/pages/Settings.jsx:682-683 — current (logout/exit-guest confirm)
<div onClick={() => setShowLogoutConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
  <div onClick={e => e.stopPropagation()} style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24 }}>
```

This is the single most-visible motion gap in the app: modals are an
"occasional" frequency interaction (AUDIT.md category 1 — standard
animation expected) that currently teleport in both directions, and none
scale from anywhere near `scale(0.9-0.97)` on entry (they just cut in at
full size) — a direct violation of AUDIT.md category 3.

## Target

One shared pair of CSS animation classes, driven by keyframes (correct
per AUDIT.md category 4/8 for one-shot entry — these mount/unmount once
per open, they are not rapidly-retriggered UI like toasts or toggles),
plus a tiny shared hook so every call site can also play an exit
animation before the real `onClose` unmounts the node.

```css
/* target — add to src/App.css */
@keyframes modal-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes modal-panel-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modal-panel-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.97) translateY(4px); }
}

.modal-backdrop {
  animation: modal-backdrop-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.modal-backdrop.is-closing {
  animation: modal-backdrop-out 160ms cubic-bezier(0.4, 0, 1, 1) both;
}
.modal-panel {
  animation: modal-panel-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
  transform-origin: center; /* modals are exempt from trigger-anchored origin — AUDIT.md category 3 */
}
.modal-panel.is-closing {
  animation: modal-panel-out 160ms cubic-bezier(0.4, 0, 1, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  @keyframes modal-panel-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modal-panel-out { from { opacity: 1; } to { opacity: 0; } }
}
```

```js
// target — new file src/hooks/useClosingTransition.js
import { useState, useCallback } from 'react';

// Delays the real close callback so the `.is-closing` CSS animation
// (see App.css) has time to play before the modal unmounts — otherwise
// React removes the node the instant the backdrop/X is clicked and no
// exit animation is visible.
export function useClosingTransition(onClose, duration = 160) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, duration);
  }, [onClose, duration]);
  return { closing, close };
}
```

Each modal's backdrop `onClick` and its `✕`/cancel button switch from
calling `onClose` directly to calling `close` from this hook, and both
the backdrop and panel `div`s get `className` (not just inline `style`)
built as `` `modal-backdrop${closing ? ' is-closing' : ''}` `` /
`` `modal-panel${closing ? ' is-closing' : ''}` ``.

## Repo conventions to follow

- This codebase has no CSS token file — colors/durations are inline
  literals per-component, and global reusable rules live in
  `src/App.css` (see the existing `@keyframes spin` pattern already
  there, even though it's currently duplicated per-file — this plan's
  keyframes belong in the same file for the same reason: they're used
  by multiple components).
- Existing custom hooks live in `src/hooks/` (e.g. `src/hooks/useProfile.js`,
  `src/hooks/useAdaptiveTarget.js`) — one file per hook, a plain function
  export, no default export. Match that exactly for the new file.
- Components use `style={{...}}` almost exclusively; adding a `className`
  alongside `style` on the same element (for the animation classes only)
  is fine and does not conflict, since `style` continues to own layout/
  color and the class only owns `animation`.

## Steps

1. In `src/App.css`, append the four `@keyframes` blocks, the four
   `.modal-backdrop`/`.modal-panel` (+ `.is-closing`) rules, and the
   `prefers-reduced-motion` override exactly as shown in Target above.
2. Create `src/hooks/useClosingTransition.js` exactly as shown in Target
   above.
3. In `src/components/PhotoScanModal.jsx`:
   - Import `useClosingTransition` from `'../hooks/useClosingTransition'`.
   - At the top of the component body: `const { closing, close } = useClosingTransition(onClose);`
   - Change the outer `<div onClick={onClose} ...>` (line 100) to
     `<div onClick={close} className={`modal-backdrop${closing ? ' is-closing' : ''}`} style={{...same style, minus nothing...}}>`.
   - Change the inner panel `<div onClick={e => e.stopPropagation()} ...>` (line 101)
     to add `className={`modal-panel${closing ? ' is-closing' : ''}`}`.
   - Change the `✕` button's `onClick={onClose}` (line 104) to `onClick={close}`.
4. In `src/pages/FoodSearch.jsx`, apply the identical pattern (hook call,
   backdrop/panel className, close button) to both `ScanModal` (lines
   474-489) and `ModalShell` (lines 493-505). Each is its own function
   component, so each needs its own `useClosingTransition(onClose)` call
   at the top of that component's body.
5. In `src/pages/Settings.jsx`, apply the same pattern to the logout
   confirm block (lines 681-704): the outer conditional is
   `{showLogoutConfirm && (...)}`, so wrap the hook call using
   `() => setShowLogoutConfirm(false)` as the `onClose` argument, and
   apply it to the backdrop `onClick` (line 682), the backdrop
   `className`, the panel `className`, and the "Cancel" button's
   `onClick` (line 692) — do NOT apply it to the "Exit anyway" button
   (line 698, `handleLogout`), which should keep navigating away
   immediately rather than waiting on a close animation that will never
   be seen.

## Boundaries

- Do NOT touch `BarcodeScanner`, `PhotoScanModal`'s internal analyzing/
  result UI, or any other content *inside* the modals — animation
  classes on the backdrop/panel wrapper only.
- Do NOT add a new dependency (no Framer Motion) — plain CSS keyframes
  only, per this repo's existing all-CSS motion approach.
- Do NOT change `zIndex`, `maxWidth`, backdrop opacity value, or any
  other non-motion styling.
- If any of the four call sites' code doesn't match the excerpts above
  (drift since commit `2c2a5e5`), stop and report instead of guessing
  where to apply the classes.

## Verification

- **Mechanical**: `npm run lint` (clean) and `npm run build` (succeeds)
  from `/Users/sriram/attune`.
- **Feel check**: run the dev server, open each of the 4 modals
  (Photo scan from Dashboard/FoodSearch, barcode scan, create-food from
  FoodSearch, logout confirm from Settings while in a guest session) and
  confirm:
  - The backdrop fades in and the panel fades+scales+lifts in together,
    no flash-to-full-size.
  - Clicking the backdrop or the close/cancel control plays a visible
    (if quick) shrink+fade before the modal actually disappears — it
    should not still be an instant cut.
  - "Exit anyway" in the Settings logout modal still logs out
    immediately with no added delay.
  - In DevTools Rendering panel, set `prefers-reduced-motion: reduce`
    and confirm the panel still fades but no longer scales/translates.
- **Done when**: all 4 modals show a visible enter+exit transition, lint
  and build are clean, and the reduced-motion check above passes.
