import { useNavigate } from 'react-router-dom';
import LogoMark from './LogoMark';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard', path: '/dashboard' },
  { id: 'food', label: 'Food search', icon: 'ti-search', path: '/food' },
  { id: 'progress', label: 'Progress', icon: 'ti-chart-line', path: '/progress' },
  { id: 'meals', label: 'Meal plans', icon: 'ti-calendar', path: '/meals' },
  { id: 'insights', label: 'AI insights', icon: 'ti-sparkles', path: '/insights' },
];

// Desktop: left sidebar. Mobile/tablet (<=860px): bottom nav — same items,
// CSS media queries control which one renders, not JS, so it responds to
// real viewport width without a resize listener.
export default function AppNav({ active, initials }) {
  const navigate = useNavigate();

  return (
    <>
      <nav className="app-sidebar">
        <LogoMark size={28} />
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`app-nav-icon${active === item.id ? ' is-active' : ''}`}
            title={item.label}
            onClick={() => navigate(item.path)}
          >
            <i className={`ti ${item.icon}`} />
          </button>
        ))}
        <div className="app-sidebar-spacer" />
        <button
          className={`app-nav-avatar${active === 'settings' || active === 'profile' ? ' is-active' : ''}`}
          title="Settings"
          onClick={() => navigate('/settings')}
        >
          {initials}
        </button>
      </nav>

      <nav className="app-bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`app-bottom-icon${active === item.id ? ' is-active' : ''}`}
            title={item.label}
            onClick={() => navigate(item.path)}
          >
            <i className={`ti ${item.icon}`} />
          </button>
        ))}
        <button
          className={`app-bottom-icon${active === 'settings' || active === 'profile' ? ' is-active' : ''}`}
          title="Settings"
          onClick={() => navigate('/settings')}
        >
          <i className="ti ti-settings" />
        </button>
      </nav>
    </>
  );
}
