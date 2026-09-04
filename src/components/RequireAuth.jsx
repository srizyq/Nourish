import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../context/ThemeProvider';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f0f', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid #2a2a2a', borderTopColor: '#8fbc8f',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/onboarding/step1" replace />;

  // Every authenticated page gets theme context from here — nothing
  // outside RequireAuth (marketing, onboarding, login) is theme-aware.
  return <ThemeProvider>{children}</ThemeProvider>;
}
