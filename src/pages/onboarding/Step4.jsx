// src/pages/onboarding/Step4.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/OnboardingLayout';

export default function Step4() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saveChoice, setSaveChoice] = useState(null); // 'save' | 'guest'
  const [hovered, setHovered] = useState(null);

  const handleFinish = (mode) => {
    const existing = JSON.parse(sessionStorage.getItem('nourish_onboarding') || '{}');
    sessionStorage.setItem('nourish_onboarding', JSON.stringify({
      ...existing,
      name: name || 'Guest',
      email,
      mode, // 'save' or 'guest'
      guestStartDate: new Date().toISOString(),
      guestDaysRemaining: 7,
    }));
    navigate('/dashboard');
  };

  const inputStyle = (filled) => ({
    background: '#141414',
    border: `1px solid ${filled ? '#3a5a3a' : '#1e1e1e'}`,
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#e8e8e8',
    fontSize: '16px',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

  return (
    <OnboardingLayout step={4}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>

        {/* Celebration icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#0f1a0f',
          border: '1px solid #1e3a1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 24px',
        }}>
          🌿
        </div>

        <p style={{ color: '#555', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          you're all set
        </p>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          color: '#e8e8e8',
          lineHeight: 1.2,
          marginBottom: '8px',
        }}>
          Ready to start tracking
        </h1>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '36px' }}>
          Save your progress to pick up where you left off, or dive in as a guest for 7 days free.
        </p>

        {/* Save progress option */}
        <div style={{ marginBottom: '12px', textAlign: 'left' }}>
          <button
            onClick={() => setSaveChoice('save')}
            onMouseEnter={() => setHovered('save')}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: '100%',
              background: saveChoice === 'save' ? '#0f1a0f' : '#141414',
              border: `1px solid ${saveChoice === 'save' ? '#3a5a3a' : (hovered === 'save' ? '#2a2a2a' : '#1e1e1e')}`,
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: saveChoice === 'save' ? '16px' : '0' }}>
              <div>
                <div style={{ color: '#e8e8e8', fontWeight: 600, fontSize: '15px', fontFamily: "'Syne', sans-serif", marginBottom: '3px' }}>
                  Save my progress
                </div>
                <div style={{ color: '#555', fontSize: '13px' }}>Create a free account — takes 30 seconds</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${saveChoice === 'save' ? '#8fbc8f' : '#2a2a2a'}`,
                background: saveChoice === 'save' ? '#8fbc8f' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {saveChoice === 'save' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0f0f0f' }} />}
              </div>
            </div>

            {/* Inline email fields — expand when selected */}
            {saveChoice === 'save' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#4a7a4a'}
                  onBlur={e => e.target.style.borderColor = name ? '#3a5a3a' : '#1e1e1e'}
                  style={inputStyle(name)}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#4a7a4a'}
                  onBlur={e => e.target.style.borderColor = email ? '#3a5a3a' : '#1e1e1e'}
                  style={inputStyle(email)}
                />
                <button
                  disabled={!email}
                  onClick={(e) => { e.stopPropagation(); if (email) handleFinish('save'); }}
                  style={{
                    padding: '14px',
                    background: email ? '#8fbc8f' : '#181818',
                    border: `1px solid ${email ? '#8fbc8f' : '#2a2a2a'}`,
                    borderRadius: '10px',
                    color: email ? '#0f0f0f' : '#333',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: email ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  Create account & continue →
                </button>
              </div>
            )}
          </button>
        </div>

        {/* Guest option */}
        <button
          onClick={() => handleFinish('guest')}
          onMouseEnter={() => setHovered('guest')}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${hovered === 'guest' ? '#2a2a2a' : '#1e1e1e'}`,
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            outline: 'none',
            marginBottom: '16px',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#ccc', fontWeight: 500, fontSize: '15px', marginBottom: '3px' }}>
              Continue as guest
            </div>
            <div style={{ color: '#444', fontSize: '13px' }}>Full access for 7 days, no account needed</div>
          </div>
          <span style={{ color: '#444', fontSize: '18px' }}>→</span>
        </button>

        {/* Fine print */}
        <p style={{ color: '#333', fontSize: '12px', lineHeight: 1.6 }}>
          No credit card. No spam. Your data stays on your device in guest mode.
        </p>
      </div>
    </OnboardingLayout>
  );
}
