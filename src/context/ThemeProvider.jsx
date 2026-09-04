import { useCallback } from 'react';
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
export function ThemeProvider({ children }) {
  const { profile, save } = useProfile();
  const theme = profile?.theme === 'light' ? 'light' : 'dark';

  const setTheme = useCallback((next) => {
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
