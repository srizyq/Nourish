// src/pages/onboarding/Step4.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OnboardingLayout from '../../components/OnboardingLayout';
import { supabase } from '../../lib/supabase';
import { upsertProfile } from '../../lib/db';

function draftToProfileFields(draft, name) {
  const targets = draft.targets || {};
  return {
    name: name || draft.name || 'there',
    goal: draft.goal || null,
    age: draft.age ?? null,
    weight: draft.weight ?? null,
    height: draft.height ?? null,
    unit: draft.unit || 'metric',
    activity: draft.activity || null,
    calorie_target: targets.calories ?? null,
    protein_g: targets.protein?.g ?? null,
    carbs_g: targets.carbs?.g ?? null,
    fat_g: targets.fat?.g ?? null,
    water_target: targets.water ?? 8,
    onboarding_completed: true,
  };
}

export default function Step4() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveChoice, setSaveChoice] = useState(null); // 'save' | 'guest'
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function finishWithProfile(userId) {
    const draft = JSON.parse(sessionStorage.getItem('attune_onboarding') || '{}');
    await upsertProfile(userId, draftToProfileFields(draft, name));
    sessionStorage.removeItem('attune_onboarding');
    navigate('/dashboard');
  }

  async function handleCreateAccount() {
    if (!email || password.length < 8) return;
    setLoading(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message.includes('already registered')
        ? 'That email is already registered — try logging in instead.'
        : signUpError.message);
      return;
    }
    if (!data.session) {
      // Email confirmation required before a session exists.
      setLoading(false);
      setNeedsEmailConfirm(true);
      return;
    }
    try {
      await finishWithProfile(data.user.id);
    } catch (err) {
      console.error(err);
      setError('Account created, but saving your profile failed. Try again from Settings.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setLoading(true);
    setError(null);
    const { data, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      setLoading(false);
      setError('Could not start a guest session. Try again, or create a real account.');
      return;
    }
    try {
      await finishWithProfile(data.user.id);
    } catch (err) {
      console.error(err);
      setError('Guest session started, but saving your profile failed.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

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

  if (needsEmailConfirm) {
    return (
      <OnboardingLayout step={4}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', background: '#0f1a0f',
            border: '1px solid #1e3a1e', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px', margin: '0 auto 24px',
          }}>✉️</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#e8e8e8', marginBottom: '8px' }}>
            Check your email
          </h1>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '24px' }}>
            We sent a confirmation link to <span style={{ color: '#ccc' }}>{email}</span>. Confirm it, then log in to pick up where you left off.
          </p>
          <Link to="/login" style={{
            display: 'inline-block', padding: '14px 28px', background: '#8fbc8f',
            border: '1px solid #8fbc8f', borderRadius: '10px', color: '#0f0f0f',
            fontSize: '15px', fontWeight: 600, textDecoration: 'none',
          }}>Go to login →</Link>
        </div>
      </OnboardingLayout>
    );
  }

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
          Create an account to keep your data across devices, or dive in as a guest for 7 days free.
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
                  Create my account
                </div>
                <div style={{ color: '#555', fontSize: '13px' }}>Takes 30 seconds</div>
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

            {/* Inline fields — expand when selected */}
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
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#4a7a4a'}
                  onBlur={e => e.target.style.borderColor = password ? '#3a5a3a' : '#1e1e1e'}
                  style={inputStyle(password)}
                  autoComplete="new-password"
                />
                {error && (
                  <div style={{
                    background: '#1a0f0f', border: '1px solid #c0707040', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '13px', color: '#c07070',
                  }}>{error}</div>
                )}
                <button
                  disabled={!email || password.length < 8 || loading}
                  onClick={(e) => { e.stopPropagation(); handleCreateAccount(); }}
                  style={{
                    padding: '14px',
                    background: email && password.length >= 8 ? '#8fbc8f' : '#181818',
                    border: `1px solid ${email && password.length >= 8 ? '#8fbc8f' : '#2a2a2a'}`,
                    borderRadius: '10px',
                    color: email && password.length >= 8 ? '#0f0f0f' : '#333',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: email && password.length >= 8 && !loading ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Creating account…' : 'Create account & continue →'}
                </button>
              </div>
            )}
          </button>
        </div>

        {/* Guest option */}
        <button
          onClick={handleGuest}
          disabled={loading}
          onMouseEnter={() => setHovered('guest')}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${hovered === 'guest' ? '#2a2a2a' : '#1e1e1e'}`,
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
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
            <div style={{ color: '#444', fontSize: '13px' }}>Full access for 7 days, no password needed</div>
          </div>
          <span style={{ color: '#444', fontSize: '18px' }}>→</span>
        </button>

        {/* Fine print */}
        <p style={{ color: '#333', fontSize: '12px', lineHeight: 1.6 }}>
          No credit card, ever. Guest data is saved to a temporary account you can upgrade any time from Settings.
        </p>
      </div>
    </OnboardingLayout>
  );
}
