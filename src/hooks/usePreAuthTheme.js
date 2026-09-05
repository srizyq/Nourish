// Theme selection on any pre-auth screen (onboarding, login) — before
// there's a profile row to read/write theme from. Stored under its own
// sessionStorage key (not the onboarding draft) so it works the same way
// on Login, which has no draft at all. `touched` tells a caller whether
// the person actually interacted with the toggle this session, as
// opposed to just seeing the default — Login uses that to decide whether
// to overwrite an existing account's saved theme.
import { useCallback, useState } from 'react';

const KEY = 'attune_preauth_theme';

function readTheme() {
  try {
    return sessionStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function usePreAuthTheme() {
  const [theme, setThemeState] = useState(readTheme);
  const [touched, setTouched] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) != null;
    } catch {
      return false;
    }
  });

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { sessionStorage.setItem(KEY, next); } catch { /* ignore */ }
      return next;
    });
    setTouched(true);
  }, []);

  return { theme, toggleTheme, touched };
}
