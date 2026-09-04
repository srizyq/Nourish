// src/App.jsx
import { Fragment } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import RequireAuth from './components/RequireAuth'
import Step1 from './pages/onboarding/Step1'
import Step2 from './pages/onboarding/Step2'
import Step3 from './pages/onboarding/Step3'
import Step4 from './pages/onboarding/Step4'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FoodSearch from "./pages/FoodSearch";
import Progress from "./pages/Progress";
import AIInsights from "./pages/AIInsights";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Nutrients from "./pages/Nutrients";
import DailyLog from "./pages/DailyLog";
import DashboardRedesignHarness from "./prototypes/dashboard-redesign/Harness";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Navigate to="/onboarding/step1" replace />} />
          <Route path="/onboarding/step1" element={<Step1 />} />
          <Route path="/onboarding/step2" element={<Step2 />} />
          <Route path="/onboarding/step3" element={<Step3 />} />
          <Route path="/onboarding/step4" element={<Step4 />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/food" element={<RequireAuth><FoodSearch /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/nutrients" element={<RequireAuth><Nutrients /></RequireAuth>} />
          <Route path="/log" element={<RequireAuth><DailyLog /></RequireAuth>} />
          <Route path="/insights" element={<RequireAuth><AIInsights /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/prototypes/dashboard-redesign" element={<DashboardRedesignHarness />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// ─── Landing page — "Proof" direction ───────────────────────────────────
// Persuades through real product surface rather than typography or copy:
// the Pattern Engine feature renders as an actual insight card in the
// app's own voice, the hero mockup mirrors the real Dashboard hero, and
// pricing is a genuine feature-comparison table. Picked over two other
// prototyped directions (a closer 1:1 match to the app's own UI, and a
// bolder full-bleed marketing treatment) via /prototypes/landing-redesign.
//
// Scoped to a wrapper div carrying no data-theme attribute, so it's
// unaffected by the app's light/dark theme system — same as onboarding
// and login, it always renders against :root's dark values.

const ACCENT = '#8fbc8f';
const WATER_BLUE = '#6aabcf';
const AI_PURPLE = '#9f97e8';

const FEATURES = [
  { icon: 'ti-git-branch', title: 'Pattern Engine', desc: 'Attune correlates your logged food with your mood and energy check-ins to surface real patterns — like how protein timing actually affects your afternoon energy.', badge: 'Only on Attune' },
  { icon: 'ti-bowl-chopsticks', title: 'Aus & Asian Database', desc: 'Laksa, pho, biryani, dim sum, meat pie — dozens of Asian and Australian-specific foods with restaurant-accurate macros, plus live search across USDA and Open Food Facts.', badge: 'Only on Attune' },
  { icon: 'ti-mood-smile', title: 'Mood & Energy Check-in', desc: '3 taps, 5 seconds. Every check-in feeds the pattern engine — the more you log, the sharper your insights get.', badge: 'Only on Attune' },
  { icon: 'ti-chart-line', title: 'Progress Tracking', desc: "Weight trends, streak calendar, macro averages. See what's actually working over 7, 30, and 90 days." },
  { icon: 'ti-barcode', title: 'Barcode Scanning', desc: 'Scan any packaged food and get instant macros pulled straight from the product database.' },
  { icon: 'ti-clipboard-heart', title: 'Trainer Dashboard', desc: 'Share your data with a trainer via invite link. You control exactly what they see and can revoke access anytime.', badge: 'Coming soon' },
];

const AUS_CARDS = [
  { icon: 'ti-bowl-chopsticks', title: 'Asian cuisines', desc: 'Vietnamese, Chinese, Indian, Thai, Korean, Japanese, Malaysian — all with accurate local portions.' },
  { icon: 'ti-pizza', title: 'Aussie classics', desc: "Meat pie, sausage roll, Vegemite toast, Tim Tam — foods other apps just don't have." },
  { icon: 'ti-coffee', title: 'Melbourne cafés', desc: 'Smashed avo, long black, acai bowl — logged from your actual local spots.' },
  { icon: 'ti-tools-kitchen-2', title: 'Restaurant accurate', desc: 'Not generic estimates. Macros matched to how Melbourne and Sydney restaurants actually cook.' },
];

const PRICING_PLANS = [
  { name: 'Free', price: '$0', desc: 'Perfect to get started', features: ['Basic food logging', 'Aus & Asian database', 'Full logging history', 'Manual mood check-in', 'Pattern engine insights', 'Barcode scanning'] },
  { name: 'Pro', price: '$9.99', period: '/mo', desc: 'For serious trackers', features: ['Everything in Free', 'Exact-time logging', 'Hourly log timeline', 'Priority support'], highlight: true },
  { name: 'Team', price: '$29', period: '/mo', desc: 'For trainers & coaches', features: ['Everything in Pro', 'Up to 20 clients', 'Trainer dashboard', 'Client progress reports', 'Priority support'] },
];

const wrap = { maxWidth: 1140, margin: '0 auto', padding: '0 24px' };
const card = { background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)', borderRadius: 16 };
const label = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' };

function Landing() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Nav navigate={navigate} />
      <Hero navigate={navigate} />
      <Features />
      <AusSection />
      <RecapCards />
      <Pricing />
      <Footer />
    </div>
  )
}

function Nav({ navigate }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-strong)' }}>
      <div style={{ ...wrap, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>attune</span>
        <div style={{ display: 'flex', gap: 28 }}>
          <a href="#features" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Features</a>
          <a href="#aus" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>For Australians</a>
          <a href="#pricing" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Pricing</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Log in</button>
          <button onClick={() => navigate('/onboarding/step1')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#0f0f0f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Start free</button>
        </div>
      </div>
    </div>
  )
}

// Same construction as Dashboard.jsx's real hero trend line, fed static
// preview numbers.
function MiniTrend({ color }) {
  const pts = [1400, 1900, 1650, 2100, 1950, 2200, 1840];
  const max = Math.max(...pts), min = Math.min(...pts);
  const norm = v => 40 - ((v - min) / (max - min)) * 34 - 3;
  const line = pts.map((v, i) => `${(i / (pts.length - 1)) * 260},${norm(v)}`).join(' ');
  return (
    <svg viewBox="0 0 260 44" style={{ width: '100%', height: 48 }} preserveAspectRatio="none">
      <polygon points={`0,44 ${line} 260,44`} fill={color} opacity="0.1" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// A fuller, more detailed mockup than a bare stat card — hero + macro
// grid + a real insight callout, closer to the actual Dashboard.
function ProductMockup() {
  return (
    <div style={{ ...card, padding: 22, maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={label}>TODAY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>1,840</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/ 2,200 kcal</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={label}>REMAINING</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--accent)' }}>360</div>
        </div>
      </div>
      <MiniTrend color={ACCENT} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-default)', marginBottom: 16 }}>
        <div style={{ borderRight: '1px solid var(--border-default)' }}>
          <div style={{ ...label, marginBottom: 3 }}>PROTEIN</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: ACCENT }}>142g</div>
        </div>
        <div style={{ borderRight: '1px solid var(--border-default)', paddingLeft: 12 }}>
          <div style={{ ...label, marginBottom: 3 }}>CARBS</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: WATER_BLUE }}>198g</div>
        </div>
        <div style={{ paddingLeft: 12 }}>
          <div style={{ ...label, marginBottom: 3 }}>FAT</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: AI_PURPLE }}>54g</div>
        </div>
      </div>
      {/* Same construction as AIInsights.jsx's InsightCard */}
      <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
        <i className="ti ti-sparkles" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 2 }} />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          You average 7.8/10 energy on days you log 100g+ protein before noon, vs 5.2/10 otherwise.
        </p>
      </div>
    </div>
  )
}

function Hero({ navigate }) {
  return (
    <section style={{ ...wrap, paddingTop: 72, paddingBottom: 72, display: 'grid', gridTemplateColumns: '0.85fr 1fr', gap: 56, alignItems: 'center' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, marginBottom: 22 }}>
          🇦🇺 Built for Melbourne
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px, 3.4vw, 44px)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 18 }}>
          Track food. Feel the pattern.<br /><span style={{ color: 'var(--accent)' }}>Actually stick to it.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 26 }}>
          Attune connects what you log to how you actually feel — real correlations between your food, mood, and energy, on top of an Aus &amp; Asian food database that gets what a laksa is.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <button onClick={() => navigate('/onboarding/step1')} style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '13px 24px', color: '#0f0f0f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Start for free — no credit card</button>
          <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>Full app for 7 days, no credit card</span>
        </div>
      </div>
      <ProductMockup />
    </section>
  )
}

// The Pattern Engine feature is shown as a real insight card in the
// app's own voice; the rest of the feature set follows underneath as a
// plainer supporting list — the proof does the persuading, not the
// adjectives.
function Features() {
  const [patternFeature, ...rest] = FEATURES;
  return (
    <section id="features" style={{ ...wrap, padding: '64px 24px' }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        Everything you need. Nothing you don't.
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Not a mockup — this is what a real pattern looks like once you've logged a couple of weeks.</p>

      <div style={{ ...card, padding: 20, marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${patternFeature.icon}`} style={{ fontSize: 16, color: 'var(--accent)' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{patternFeature.title}</h3>
            <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{patternFeature.badge}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>{patternFeature.desc}</p>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "You average 7.8/10 energy on days you log 100g+ protein before noon, vs 5.2/10 otherwise — a real correlation from your own logged data."
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {rest.map((f, i) => (
          <div key={i} style={{ ...card, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <i className={`ti ${f.icon}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{f.title}</h4>
              {f.badge && <span style={{ marginLeft: 'auto', fontSize: 9, color: f.badge === 'Coming soon' ? 'var(--text-hint)' : 'var(--accent)', textTransform: 'uppercase' }}>{f.badge}</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AusSection() {
  return (
    <section id="aus" style={{ ...wrap, padding: '64px 24px' }}>
      <div style={{ ...label, marginBottom: 10, color: 'var(--accent)' }}>Built for how Australians eat</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.5px', maxWidth: 600 }}>
        Finally, a tracker that knows what a laksa is.
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 500, marginBottom: 28 }}>
        Every other app makes you search "Asian noodle soup" and guess. Attune has the real thing.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {AUS_CARDS.map((c, i) => (
          <div key={i} style={{ ...card, padding: 18 }}>
            <i className={`ti ${c.icon}`} style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 10, display: 'block' }} />
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{c.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecapCards() {
  return (
    <section style={{ ...wrap, padding: '64px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, alignItems: 'center' }}>
      <div>
        <div style={{ ...label, marginBottom: 10, color: 'var(--accent)' }}>Coming soon</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.5px' }}>
          Share your week. Inspire your feed.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
          A weekly recap card with your stats, streak, and mood highlights — ready to share to Instagram Stories.
        </p>
        <p style={{ color: 'var(--text-hint)', fontSize: 12 }}>Your progress is the best marketing we have.</p>
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--accent)', fontSize: 13 }}>attune</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Week 12 recap</span>
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
          <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>5/7</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>days on track</div></div>
          <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>142g</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>avg protein</div></div>
          <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>🔥12</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>day streak</div></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Best mood day</span>
          <span style={{ color: 'var(--accent)', fontSize: 11 }}>Tuesday 😊</span>
        </div>
      </div>
    </section>
  )
}

// Plan copy uses "Everything in X" umbrella entries — each plan's
// feature list is resolved recursively before building rows, so
// "Everything in Free" expands into Free's real features instead of
// rendering as its own nonsense row.
function resolvePlanFeatures(planName, plans, seen = new Set()) {
  if (seen.has(planName)) return [];
  seen.add(planName);
  const plan = plans.find(p => p.name === planName);
  if (!plan) return [];
  return plan.features.flatMap(f => {
    const inherited = f.match(/^Everything in (.+)$/);
    return inherited ? resolvePlanFeatures(inherited[1], plans, seen) : [f];
  });
}

function Pricing() {
  const resolvedByPlan = PRICING_PLANS.map(p => resolvePlanFeatures(p.name, PRICING_PLANS));
  const allFeatures = [...new Set(resolvedByPlan.flat())];
  const has = (planIndex, feat) => resolvedByPlan[planIndex].includes(feat);
  return (
    <section id="pricing" style={{ ...wrap, padding: '64px 24px' }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.5px' }}>Simple pricing.</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Start free, upgrade when you're ready.</p>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(3, 1fr)' }}>
          <div style={{ padding: 18 }} />
          {PRICING_PLANS.map((p, i) => (
            <div key={i} style={{ padding: 18, textAlign: 'center', borderLeft: '1px solid var(--border-default)', background: p.highlight ? 'var(--accent-bg)' : 'transparent' }}>
              {p.highlight && <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Most popular</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
              <div><span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{p.price}</span>{p.period && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.period}</span>}</div>
            </div>
          ))}
          {allFeatures.map((feat, r) => (
            <Fragment key={feat}>
              <div style={{ padding: '12px 18px', fontSize: 13, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-default)' }}>{feat}</div>
              {PRICING_PLANS.map((p, c) => (
                <div key={`c${r}-${c}`} style={{ padding: '12px 18px', textAlign: 'center', borderTop: '1px solid var(--border-default)', borderLeft: '1px solid var(--border-default)', background: p.highlight ? 'var(--accent-bg)' : 'transparent' }}>
                  {has(c, feat) ? <i className="ti ti-check" style={{ color: 'var(--accent)', fontSize: 15 }} /> : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                </div>
              ))}
            </Fragment>
          ))}
          <div style={{ padding: 18, borderTop: '1px solid var(--border-default)' }} />
          {PRICING_PLANS.map((p, i) => (
            <div key={i} style={{ padding: 18, borderTop: '1px solid var(--border-default)', borderLeft: '1px solid var(--border-default)', background: p.highlight ? 'var(--accent-bg)' : 'transparent' }}>
              <button style={{
                width: '100%', background: p.highlight ? 'var(--accent)' : 'transparent',
                border: p.highlight ? 'none' : '1px solid var(--border-strong)',
                borderRadius: 8, padding: '9px', color: p.highlight ? '#0f0f0f' : 'var(--text-primary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {p.name === 'Free' ? 'Get started' : 'Start trial'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-strong)', padding: '32px 24px', textAlign: 'center' }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>attune</span>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '8px 0' }}>Built for Australians. Understands your patterns. Designed in Melbourne.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12 }}>
        <a href="#" style={{ color: 'var(--text-hint)', textDecoration: 'none' }}>Privacy</a>
        <a href="#" style={{ color: 'var(--text-hint)', textDecoration: 'none' }}>Terms</a>
        <a href="#" style={{ color: 'var(--text-hint)', textDecoration: 'none' }}>Contact</a>
      </div>
      {/* Required FatSecret Platform API attribution — must not be
          reworded per their attribution policy. */}
      <a href="https://platform.fatsecret.com" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 12, fontSize: 11, color: 'var(--text-hint)' }}>Powered by fatsecret Platform API</a>
    </footer>
  )
}
