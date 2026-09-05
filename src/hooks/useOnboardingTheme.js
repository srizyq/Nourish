// Theme selection during onboarding, before any account/profile exists yet.
// Stored inside the same 'attune_onboarding' sessionStorage draft other
// steps already use, so it survives navigating between onboarding routes
// (each of which is a full remount) without needing its own key or a
// context provider. Step4 reads draft.theme and saves it onto the real
// profile once an account exists, handing off to ThemeProvider from then on.
import { useCallback, useState } from 'react';

const KEY = 'attune_onboarding';

function readTheme() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY) || '{}');
    return draft.theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function writeTheme(theme) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY) || '{}');
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, theme }));
  } catch { /* ignore */ }
}

export function useOnboardingTheme() {
  const [theme, setThemeState] = useState(readTheme);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
