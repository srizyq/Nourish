// Small icon button used on pre-auth screens (onboarding, login) to flip
// between light and dark before there's a profile to read theme from —
// see usePreAuthTheme.
export default function PreAuthThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} />
    </button>
  );
}
