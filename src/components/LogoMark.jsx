export default function LogoMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size,
      background: 'transparent',
      border: `${Math.max(1.5, size * 0.045)}px solid #8fbc8f`,
      borderRadius: size * 0.21,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxSizing: 'border-box',
    }}>
      <span style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: size * 0.53, color: '#8fbc8f', lineHeight: 1,
      }}>a</span>
    </div>
  );
}
