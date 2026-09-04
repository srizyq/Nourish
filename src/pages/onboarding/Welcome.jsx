// src/pages/onboarding/Welcome.jsx
import { useNavigate, Link } from 'react-router-dom';

// The very first screen — deliberately bare (no progress bar, no step
// counter, no skip link) since it isn't part of the numbered flow yet.
// Matches the user's own sketch: centered wordmark, one button below it.
export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 'clamp(40px, 12vw, 64px)',
        color: '#e8e8e8',
        letterSpacing: '-1px',
        marginBottom: '48px',
      }}>
        attune
      </span>

      <button
        onClick={() => navigate('/onboarding/step1')}
        style={{
          width: '100%',
          maxWidth: '320px',
          padding: '18px',
          background: '#8fbc8f',
          border: 'none',
          borderRadius: '12px',
          color: '#0f0f0f',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Let's begin
      </button>

      <Link
        to="/login"
        style={{
          marginTop: '20px',
          color: '#555',
          fontSize: '13px',
          textDecoration: 'none',
        }}
      >
        Already have an account? <span style={{ color: '#8fbc8f' }}>Log in</span>
      </Link>
    </div>
  );
}
