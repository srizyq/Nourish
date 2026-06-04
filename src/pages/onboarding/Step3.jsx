// src/pages/onboarding/Step3.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/OnboardingLayout';

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

const goalAdjustments = {
  lose: -400,
  maintain: 0,
  build: +300,
};

const goalMacroSplits = {
  lose:     { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  build:    { protein: 0.30, carbs: 0.45, fat: 0.25 },
};

function calcBMR(weight, height, age, unit) {
  // Mifflin-St Jeor (male as default; gender-neutral for now)
  let w = weight, h = height;
  if (unit === 'imperial') {
    w = weight * 0.453592;   // lbs to kg
    h = height * 2.54;       // inches to cm
  }
  return 10 * w + 6.25 * h - 5 * age + 5;
}

function AnimatedNumber({ target, duration = 1000 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{display.toLocaleString()}</>;
}

function MacroBar({ label, grams, calories, pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct * 100), 300 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
        <span style={{ color: '#ccc', fontSize: '14px', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#666', fontSize: '13px' }}>
          <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{grams}g</span>
          {' '}· {calories} kcal
        </span>
      </div>
      <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

export default function Step3() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [targets, setTargets] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem('nourish_onboarding') || '{}');
    setData(saved);

    if (saved.age && saved.weight && saved.height && saved.activity && saved.goal) {
      const bmr = calcBMR(saved.weight, saved.height, saved.age, saved.unit || 'metric');
      const tdee = bmr * (activityMultipliers[saved.activity] || 1.55);
      const calorieTarget = Math.round(tdee + (goalAdjustments[saved.goal] || 0));

      const splits = goalMacroSplits[saved.goal] || goalMacroSplits.maintain;
      const proteinCal = calorieTarget * splits.protein;
      const carbsCal   = calorieTarget * splits.carbs;
      const fatCal     = calorieTarget * splits.fat;

      setTargets({
        calories: calorieTarget,
        protein: { g: Math.round(proteinCal / 4), cal: Math.round(proteinCal), pct: splits.protein },
        carbs:   { g: Math.round(carbsCal   / 4), cal: Math.round(carbsCal),   pct: splits.carbs   },
        fat:     { g: Math.round(fatCal      / 9), cal: Math.round(fatCal),     pct: splits.fat     },
        water: 8, // glasses default
      });
    }
  }, []);

  const handleNext = () => {
    const existing = JSON.parse(sessionStorage.getItem('nourish_onboarding') || '{}');
    sessionStorage.setItem('nourish_onboarding', JSON.stringify({ ...existing, targets }));
    navigate('/onboarding/step4');
  };

  if (!targets) {
    return (
      <OnboardingLayout step={3}>
        <p style={{ color: '#555' }}>Calculating your targets…</p>
      </OnboardingLayout>
    );
  }

  const goalLabels = { lose: 'weight loss', maintain: 'maintenance', build: 'muscle building' };

  return (
    <OnboardingLayout step={3}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            your targets
          </p>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 700,
            color: '#e8e8e8',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}>
            Here's your daily plan
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            Optimised for {goalLabels[data?.goal] || 'your goal'}. You can adjust these any time.
          </p>
        </div>

        {/* Calorie card */}
        <div style={{
          background: '#0f1a0f',
          border: '1px solid #1e3a1e',
          borderRadius: '16px',
          padding: '28px',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <p style={{ color: '#4a7a4a', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            daily calorie target
          </p>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(44px, 8vw, 64px)',
            fontWeight: 700,
            color: '#8fbc8f',
            lineHeight: 1,
            marginBottom: '4px',
          }}>
            <AnimatedNumber target={targets.calories} />
          </div>
          <p style={{ color: '#4a7a4a', fontSize: '14px' }}>kcal per day</p>
        </div>

        {/* Macro breakdown card */}
        <div style={{
          background: '#181818',
          border: '1px solid #1e1e1e',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
        }}>
          <p style={{ color: '#555', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>
            macro breakdown
          </p>
          <MacroBar label="Protein"       grams={targets.protein.g} calories={targets.protein.cal} pct={targets.protein.pct} color="#8fbc8f" delay={0}   />
          <MacroBar label="Carbohydrates" grams={targets.carbs.g}   calories={targets.carbs.cal}   pct={targets.carbs.pct}   color="#6aabcf" delay={100} />
          <MacroBar label="Fat"           grams={targets.fat.g}     calories={targets.fat.cal}      pct={targets.fat.pct}     color="#9f97e8" delay={200} />
        </div>

        {/* Water target */}
        <div style={{
          background: '#141414',
          border: '1px solid #1e1e1e',
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>💧</span>
            <div>
              <div style={{ color: '#ccc', fontSize: '14px', fontWeight: 500 }}>Water target</div>
              <div style={{ color: '#555', fontSize: '12px' }}>Based on your body weight</div>
            </div>
          </div>
          <div style={{ color: '#6aabcf', fontSize: '20px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
            8 <span style={{ fontSize: '13px', fontWeight: 400, color: '#555' }}>glasses</span>
          </div>
        </div>

        {/* Back + Next */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/onboarding/step2')}
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
            style={{
              flex: 1,
              padding: '16px',
              background: '#8fbc8f',
              border: '1px solid #8fbc8f',
              borderRadius: '10px',
              color: '#0f0f0f',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Let's go →
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
