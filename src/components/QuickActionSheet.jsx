import { useNavigate } from 'react-router-dom';
import { useClosingTransition } from '../hooks/useClosingTransition';

// The mobile bottom nav's center "+" — everything that used to need its
// own nav slot (barcode scan, photo scan, saved meals, custom food) lives
// here instead. Menu scan isn't listed yet since that feature doesn't
// exist yet — add it once it's built, not before (a visible "coming
// soon" row was considered and explicitly turned down).
//
// Only barcode scan and photo scan deep-link straight into their modal
// (via existing/new location-state flags on FoodSearch) — log weight,
// saved meals, and custom food land on the general page instead
// (Dashboard / Food search) rather than deep-linking, per explicit
// scope: general-page landing is an accepted tradeoff for those three,
// not a shortcut taken without asking.
const TOP_ACTIONS = [
  { id: 'log-food', label: 'Log food', icon: 'ti-search', to: '/food' },
  { id: 'barcode', label: 'Scan barcode', icon: 'ti-barcode', to: '/food', state: { openScan: true } },
  { id: 'photo', label: 'Scan photo', icon: 'ti-camera', to: '/food', state: { openPhotoScan: true } },
];
const BOTTOM_ACTIONS = [
  { id: 'weight', label: 'Log weight', icon: 'ti-scale', to: '/dashboard' },
  { id: 'saved-meals', label: 'Saved meals', icon: 'ti-bookmark', to: '/food' },
  { id: 'custom-food', label: 'Custom food', icon: 'ti-plus', to: '/food' },
];

function ActionRow({ action, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(action.to, action.state)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        background: 'none', border: 'none', padding: '12px 4px', cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${action.icon}`} style={{ fontSize: 17, color: 'var(--accent)' }} />
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{action.label}</span>
    </button>
  );
}

export default function QuickActionSheet({ onClose }) {
  const navigate = useNavigate();
  const { closing, close } = useClosingTransition(onClose);

  function go(to, state) {
    navigate(to, state ? { state } : undefined);
    close();
  }

  return (
    <div
      onClick={close}
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`modal-panel${closing ? ' is-closing' : ''}`}
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)', borderBottom: 'none', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 460, padding: '10px 20px 24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-strong)', margin: '6px auto 16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {TOP_ACTIONS.map(a => <ActionRow key={a.id} action={a} onNavigate={go} />)}
        </div>
        <div style={{ height: 1, background: 'var(--border-default)', margin: '8px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {BOTTOM_ACTIONS.map(a => <ActionRow key={a.id} action={a} onNavigate={go} />)}
        </div>
      </div>
    </div>
  );
}
