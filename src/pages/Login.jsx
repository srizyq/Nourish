import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : signInError.message);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      flexDirection: 'column', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #1e1e1e' }}>
        <Link to="/" style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
          color: '#8fbc8f', letterSpacing: '-0.5px', textDecoration: 'none',
        }}>attune</Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: 700, color: '#e8e8e8', marginBottom: '8px', textAlign: 'center',
          }}>Welcome back</h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px', textAlign: 'center' }}>
            Log in to pick up where you left off.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
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
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#4a7a4a'}
              onBlur={e => e.target.style.borderColor = password ? '#3a5a3a' : '#1e1e1e'}
              style={inputStyle(password)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              background: '#1a0f0f', border: '1px solid #c0707040', borderRadius: '8px',
              padding: '10px 14px', fontSize: '13px', color: '#c07070', marginBottom: '16px',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={!email || !password || loading}
            style={{
              width: '100%', padding: '14px',
              background: email && password ? '#8fbc8f' : '#181818',
              border: `1px solid ${email && password ? '#8fbc8f' : '#2a2a2a'}`,
              borderRadius: '10px',
              color: email && password ? '#0f0f0f' : '#333',
              fontSize: '15px', fontWeight: 600,
              cursor: email && password && !loading ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
            }}
          >
            {loading ? 'Logging in…' : 'Log in →'}
          </button>

          <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
            New here? <Link to="/onboarding/step1" style={{ color: '#8fbc8f' }}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
