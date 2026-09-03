# 005 — Consolidate duplicated spin keyframes + tighten high-frequency hover transitions

- **Status**: DONE
- **Commit**: 2c2a5e5
- **Severity**: LOW-MEDIUM
- **Category**: Cohesion & tokens / Performance
- **Estimated scope**: 5 files

## Problem

**Duplicated keyframes.** The identical loading-spinner keyframe is
declared four separate times instead of once:

```jsx
// src/components/RequireAuth.jsx:18 — current
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
```
```jsx
// src/pages/FoodSearch.jsx:477 — current
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
```
```jsx
// src/pages/FoodSearch.jsx:1334 — current
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
```
```jsx
// src/pages/AIInsights.jsx:172 — current (inside a larger <style> block
// that also defines @keyframes pulse and other page-scoped CSS)
        @keyframes spin  { to{transform:rotate(360deg)} }
```
`src/components/PhotoScanModal.jsx:133` and `src/pages/FoodSearch.jsx:413,1154`
already reference `animation: 'spin 0.8s linear infinite'` relying on
whichever of these gets injected into the DOM first — this is fragile
duplication AUDIT.md category 7 calls out directly ("duplicated
near-identical easings/durations").

**Bare `transition: all` on tens-of-times/day elements.** Three controls
a user touches constantly use `transition: all`, which animates every
animatable property (including ones that were never intended to
transition) instead of the specific property that actually changes:

```jsx
// src/pages/Dashboard.jsx:190 — current (water glass toggle, tapped daily)
<button key={i} onClick={() => setGlasses(i < glasses ? i : i + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${i < glasses ? '#2a4a6a' : '#1e1e1e'}`, background: i < glasses ? '#6aabcf22' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'all 0.15s', color: i < glasses ? '#6aabcf' : '#2a2a2a' }}>
```
```jsx
// src/pages/Dashboard.jsx:212 — current (mood picker, tapped daily)
<button key={m.id} onClick={() => setMood(m.id)} title={m.label} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${mood === m.id ? '#3a5a3a' : '#1e1e1e'}`, background: mood === m.id ? '#0f1a0f' : 'transparent', cursor: 'pointer', fontSize: '20px', transition: 'all 0.15s' }}>
```
```jsx
// src/pages/Dashboard.jsx:319 — current (dashboard shortcut cards)
<button key={i} onClick={s.action} style={{ flex: 1, maxWidth: 160, background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3a5a3a'} onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
```

**Nav has zero transition.** The primary sidebar/bottom nav — the single
highest-frequency interaction in the app — switches active-tab color
with no transition whatsoever:

```css
/* src/appshell.css:40-43 — current */
.app-nav-icon.is-active {
  color: #8fbc8f;
  background: #0f1a0f;
}
```
```css
/* src/appshell.css:108-110 — current */
.app-bottom-icon.is-active {
  color: #8fbc8f;
}
```

Per AUDIT.md category 1, a 100+-times/day element should have no
animation or a drastically reduced one — a bare, cheap `color`/
`background` transition (no transform, no bounce) is exactly the
"drastically reduced" end of that spectrum, not a violation of it.

## Target

```css
/* target — src/App.css, replaces the 4 duplicate declarations */
@keyframes spin { to { transform: rotate(360deg); } }
```

```jsx
// target — Dashboard.jsx:190 (water glass)
transition: 'background 0.15s, border-color 0.15s, color 0.15s',
```
```jsx
// target — Dashboard.jsx:212 (mood picker)
transition: 'background 0.15s, border-color 0.15s',
```
```jsx
// target — Dashboard.jsx:319 (shortcut cards)
transition: 'border-color 0.15s',
```

```css
/* target — src/appshell.css */
.app-nav-icon {
  /* ...existing properties... */
  transition: color 150ms ease, background 150ms ease;
}
.app-bottom-icon {
  /* ...existing properties... */
  transition: color 150ms ease;
}
```

`ease` (bare, no custom curve) is correct here per AUDIT.md category 2's
decision order — these are all "hover / color change" cases, not
entrances or on-screen movement, so the built-in `ease` is the specified
target, not a finding on its own.

## Repo conventions to follow

- `src/App.css` is the file plan 001 and plan 003 also add global
  `@keyframes` to — if either of those plans has already been applied,
  add `@keyframes spin` to the same file, just as a new top-level block;
  do not nest it inside their rules.
- Multi-property `transition` lists (comma-separated, one duration each)
  are not yet used anywhere in this codebase, but this is standard CSS
  and matches how each button already lists multiple style properties
  inline — no new pattern is introduced, just tightening an existing
  one.

## Steps

1. Add `@keyframes spin { to { transform: rotate(360deg); } }` once to
   `src/App.css`.
2. In `src/components/RequireAuth.jsx`, delete line 18
   (`<style>{...}</style>`) entirely — the component still references
   `animation: 'spin 0.8s linear infinite'` at line 16, which now
   resolves against the global keyframe.
3. In `src/pages/FoodSearch.jsx`, delete line 477 and line 1334 (the two
   identical `<style>{`@keyframes spin...`}</style>` tags) — the
   `animation: 'spin 0.8s linear infinite'` references at lines 413 and
   1154 (and inside the now-deleted line 477's sibling modal) continue
   to resolve against the global keyframe.
4. In `src/pages/AIInsights.jsx`, remove only line 172
   (`@keyframes spin  { to{transform:rotate(360deg)} }`) from inside the
   `<style>{...}</style>` template at lines 170-174 — leave
   `@keyframes pulse` and the rest of that block untouched.
5. In `src/pages/Dashboard.jsx`, update the three `transition: 'all
   0.15s'` occurrences at lines 190, 212, and 319 to the explicit
   multi-property lists shown in Target above (each button's
   transitioned properties are exactly the ones that change between its
   states — `border-color`/`background`/`color`).
6. In `src/appshell.css`, add `transition: color 150ms ease, background
   150ms ease;` to the `.app-nav-icon` rule (lines 25-38) and
   `transition: color 150ms ease;` to the `.app-bottom-icon` rule (lines
   95-106).

## Boundaries

- Do NOT touch any other `transition: 'all ...'` occurrence in the
  codebase beyond the three Dashboard.jsx lines listed — this plan is
  scoped to the highest-frequency elements identified in the audit, not
  an exhaustive repo-wide sweep.
- Do NOT change any duration values (0.15s / 150ms stay as-is) — only
  the animated-property list and the keyframe location change.
- Do NOT remove or rename the `spin` keyframe's name or timing
  (`0.8s linear infinite` stays exactly as each call site already has
  it) — only its declaration site moves.
- If any listed line's content doesn't match the excerpt shown (drift
  since commit `2c2a5e5`), stop and report instead of guessing.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` from
  `/Users/sriram/attune`, both clean. Additionally run
  `grep -rn "@keyframes spin" src` and confirm exactly one match (in
  `src/App.css`).
- **Feel check**:
  - Trigger every spinner that used to reference a local keyframe
    (RequireAuth's initial auth-loading state — reload the app logged
    in; FoodSearch's barcode-lookup spinner; FoodSearch's live-search
    spinner) and confirm each still spins smoothly — this is the
    concrete regression check for the keyframe consolidation.
  - On Dashboard, tap water glasses and mood emoji and confirm the
    color/background/border transitions still feel identical to before
    (same 0.15s cheap fade, nothing new snapping or missing).
  - Hover a Dashboard shortcut card and confirm the border-color
    transition still animates smoothly.
  - Switch between nav tabs (sidebar on desktop width, bottom nav under
    860px) and confirm the active-tab color now eases in over ~150ms
    instead of an instant cut, without feeling sluggish.
- **Done when**: exactly one `@keyframes spin` exists in the codebase,
  all previously-spinning elements still animate correctly, the three
  Dashboard hover buttons and the nav use explicit transitioned
  properties, lint and build are clean.
