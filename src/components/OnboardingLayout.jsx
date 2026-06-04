// src/components/OnboardingLayout.jsx
import { useNavigate } from 'react-router-dom';

export default function OnboardingLayout({ children, step, totalSteps = 4 }) {
  const navigate = useNavigate();
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid #1e1e1e',
      }}>
        {/* Logo */}
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '20px',
          color: '#8fbc8f',
          letterSpacing: '-0.5px',
        }}>nourish</span>

        {/* Step counter */}
        <span style={{ color: '#555', fontSize: '13px' }}>
          step <span style={{ color: '#8fbc8f' }}>{step}</span> of {totalSteps}
        </span>

        {/* Skip link */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#8fbc8f'}
          onMouseLeave={e => e.target.style.color = '#555'}
        >
          skip for now →
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#181818' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: '#8fbc8f',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {children}
      </div>
    </div>
  );
}
