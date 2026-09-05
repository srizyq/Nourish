import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ThemeContext } from './themeContext';

// The single owner of profile.theme — every page that wants to change
// theme calls setTheme from useTheme() rather than writing profile.theme
// through its own separate useProfile() call. useProfile() has no shared
// cache between instances (each call is its own independent fetch), so
// if Settings wrote theme via its own useProfile().save(), this
// provider's own copy would never find out and the rest of the app
// wouldn't visibly change theme until a full reload.
//
// data-theme is set on a wrapper div here, not document.documentElement,
// so only the authenticated app (wherever this provider is mounted —
// see RequireAuth) is theme-aware. The marketing site, onboarding, and
// login pages fall through to :root's existing values in index.css and
// are completely unaffected.

const THEME_CACHE_KEY = 'attune_theme';

export function ThemeProvider({ children }) {
  const { profile, save } = useProfile();

  // profile.theme isn't known until the async profile fetch resolves, so
  // deriving theme from profile alone means every single mount — every
  // app open, every full reload — briefly renders in a hardcoded 'dark'
  // fallback and then flashes to the real theme once the fetch finishes.
  // A light-theme user sees that as a black-then-white flicker on every
  // launch. Caching the last-known theme in localStorage lets the very
  // next mount apply the right theme synchronously from the start; only
  // a genuinely first-ever load (nothing cached yet) still falls back to
  // 'dark' until the fetch resolves, same as onboarding's own default.
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_CACHE_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (!profile) return;
    const resolved = profile.theme === 'light' ? 'light' : 'dark';
    setThemeState(resolved);
    try { localStorage.setItem(THEME_CACHE_KEY, resolved); } catch { /* ignore */ }
  }, [profile]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_CACHE_KEY, next); } catch { /* ignore */ }
    save({ theme: next });
  }, [save]);

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
