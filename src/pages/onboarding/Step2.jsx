// src/pages/onboarding/Step2.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/OnboardingLayout';

const activityLevels = [
  { id: 'sedentary', label: 'Mostly sitting', desc: 'Office job, little exercise', multiplier: 1.2 },
  { id: 'light', label: 'Lightly active', desc: '1–3 workouts a week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately active', desc: '3–5 workouts a week', multiplier: 1.55 },
  { id: 'very', label: 'Very active', desc: '6–7 hard workouts a week', multiplier: 1.725 },
];

export default function Step2() {
  const navigate = useNavigate();
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('');
  const [unit, setUnit] = useState('metric'); // metric (kg/cm) or imperial (lbs/ft)

  const isComplete = age && weight && height && activity;

  const handleNext = () => {
    if (!isComplete) return;
    const existing = JSON.parse(sessionStorage.getItem('nourish_onboarding') || '{}');
    sessionStorage.setItem('nourish_onboarding', JSON.stringify({
      ...existing,
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      activity,
      unit,
    }));
    navigate('/onboarding/step3');
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

  const labelStyle = {
    color: '#666',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <OnboardingLayout step={2}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            quick stats
          </p>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 700,
            color: '#e8e8e8',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}>
            Tell us about yourself
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            Used only to calculate your calorie needs — never stored or shared.
          </p>
        </div>

        {/* Unit toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'flex-end' }}>
          {['metric', 'imperial'].map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${unit === u ? '#3a5a3a' : '#1e1e1e'}`,
                background: unit === u ? '#0f1a0f' : 'transparent',
                color: unit === u ? '#8fbc8f' : '#555',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {u === 'metric' ? 'kg / cm' : 'lbs / in'}
            </button>
          ))}
        </div>

        {/* Stat inputs row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>Age</label>
            <input
              type="number"
              placeholder="25"
              value={age}
              min="10" max="100"
              onChange={e => setAge(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#4a7a4a'}
              onBlur={e => e.target.style.borderColor = age ? '#3a5a3a' : '#1e1e1e'}
              style={inputStyle(age)}
            />
          </div>
          <div>
            <label style={labelStyle}>Weight ({unit === 'metric' ? 'kg' : 'lbs'})</label>
            <input
              type="number"
              placeholder={unit === 'metric' ? '70' : '154'}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#4a7a4a'}
              onBlur={e => e.target.style.borderColor = weight ? '#3a5a3a' : '#1e1e1e'}
              style={inputStyle(weight)}
            />
          </div>
          <div>
            <label style={labelStyle}>Height ({unit === 'metric' ? 'cm' : 'in'})</label>
            <input
              type="number"
              placeholder={unit === 'metric' ? '170' : '67'}
              value={height}
              onChange={e => setHeight(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#4a7a4a'}
              onBlur={e => e.target.style.borderColor = height ? '#3a5a3a' : '#1e1e1e'}
              style={inputStyle(height)}
            />
          </div>
        </div>

        {/* Activity level */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ ...labelStyle, marginBottom: '10px' }}>Activity level</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {activityLevels.map(a => {
              const isSelected = activity === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  style={{
                    background: isSelected ? '#0f1a0f' : '#141414',
                    border: `1px solid ${isSelected ? '#3a5a3a' : '#1e1e1e'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                >
                  <div style={{
                    color: isSelected ? '#8fbc8f' : '#ccc',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '3px',
                    fontFamily: "'Syne', sans-serif",
                    transition: 'color 0.2s',
                  }}>
                    {a.label}
                  </div>
                  <div style={{ color: '#444', fontSize: '12px' }}>{a.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back + Next */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/onboarding/step1')}
            style={{
              flex: '0 0 auto',
              padding: '16px 20px',
              background: 'transparent',
              border: '1px solid #1e1e1e',
              borderRadius: '10px',
              color: '#555',
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ←
          </button>
          <button
            onClick={handleNext}
            disabled={!isComplete}
            style={{
              flex: 1,
              padding: '16px',
              background: isComplete ? '#8fbc8f' : '#181818',
              border: `1px solid ${isComplete ? '#8fbc8f' : '#2a2a2a'}`,
              borderRadius: '10px',
              color: isComplete ? '#0f0f0f' : '#333',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isComplete ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
