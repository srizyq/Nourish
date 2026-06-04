// src/App.jsx
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Step1 from './pages/onboarding/Step1'
import Step2 from './pages/onboarding/Step2'
import Step3 from './pages/onboarding/Step3'
import Step4 from './pages/onboarding/Step4'
import Dashboard from './pages/Dashboard'
import FoodSearch from "./pages/FoodSearch";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Navigate to="/onboarding/step1" replace />} />
        <Route path="/onboarding/step1" element={<Step1 />} />
        <Route path="/onboarding/step2" element={<Step2 />} />
        <Route path="/onboarding/step3" element={<Step3 />} />
        <Route path="/onboarding/step4" element={<Step4 />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/food" element={<FoodSearch />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function Landing() {
  return (
    <div className="app">
      <Nav />
      <Hero />
      <Features />
      <AusSection />
      <RecapCards />
      <Pricing />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-logo">nourish</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#aus">For Australians</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-cta">
          <button className="btn-ghost">Log in</button>
          <button className="btn-primary" onClick={() => window.location.href = '/onboarding/step1'}>Start free</button>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">🇦🇺 Built for Melbourne</div>
      <h1>Track food.<br />Feel better.<br /><span className="accent">Actually stick to it.</span></h1>
      <p className="hero-sub">The only calorie tracker with an Aus & Asian food database, AI menu scanning, and a mood check-in that shows you what makes you feel your best.</p>
      <div className="hero-actions">
        <button className="btn-primary btn-lg" onClick={() => window.location.href = '/onboarding/step1'}>Start for free — no account needed</button>
        <span className="hero-hint">Full app for 7 days, no credit card</span>
      </div>
      <div className="hero-mockup">
        <div className="mockup-card">
          <div className="mockup-row">
            <span className="mockup-label">Today's calories</span>
            <span className="mockup-value accent">1,840 / 2,200</span>
          </div>
          <div className="mockup-bar-wrap">
            <div className="mockup-bar" style={{width: '83%'}}></div>
          </div>
          <div className="mockup-macros">
            <div className="macro"><span>Protein</span><span className="accent">142g</span></div>
            <div className="macro"><span>Carbs</span><span>198g</span></div>
            <div className="macro"><span>Fat</span><span>54g</span></div>
          </div>
          <div className="mockup-mood">
            <span>Mood</span>
            <div className="mood-dots">
              <span className="mood active">😊</span>
              <span className="mood">😐</span>
              <span className="mood">😴</span>
              <span className="mood">💪</span>
              <span className="mood">😤</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: '🍜', title: 'Aus & Asian Database', desc: 'Laksa, pho, biryani, dim sum, meat pie — 48k+ Asian and 12k+ Australian-specific foods with restaurant-accurate macros.', badge: 'Only on Nourish' },
    { icon: '📸', title: 'Menu Scanning', desc: 'Point your camera at any menu — printed, screen, or Instagram post. Get instant calories and swap suggestions.', badge: 'Only on Nourish' },
    { icon: '😊', title: 'Mood & Energy Check-in', desc: '3 taps, 5 seconds. Track how food and sleep affect your mood and energy over time.', badge: 'Only on Nourish' },
    { icon: '🤖', title: 'AI Coach', desc: 'Personalised nudges based on your actual patterns — not generic advice. Knows your Friday habits better than you do.' },
    { icon: '📊', title: 'Progress Tracking', desc: "Weight trends, streak calendar, macro averages. See what's actually working over 7, 30, and 90 days." },
    { icon: '🏋️', title: 'Trainer Dashboard', desc: 'Share your data with a trainer via invite link. You control exactly what they see and can revoke access anytime.' },
  ]

  return (
    <section className="features" id="features">
      <h2>Everything you need.<br />Nothing you don't.</h2>
      <div className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-text">
              <div className="feature-title-row">
                <h3>{f.title}</h3>
                {f.badge && <span className="badge">{f.badge}</span>}
              </div>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AusSection() {
  const cards = [
    { emoji: '🍜', title: 'Asian cuisines', desc: 'Vietnamese, Chinese, Indian, Thai, Korean, Japanese, Malaysian — all with accurate local portions.' },
    { emoji: '🥧', title: 'Aussie classics', desc: "Meat pie, sausage roll, Vegemite toast, Tim Tam — foods other apps just don't have." },
    { emoji: '☕', title: 'Melbourne cafés', desc: 'Smashed avo, long black, acai bowl — logged from your actual local spots.' },
    { emoji: '🍱', title: 'Restaurant accurate', desc: 'Not generic estimates. Macros matched to how Melbourne and Sydney restaurants actually cook.' },
  ]

  return (
    <section className="aus-section" id="aus">
      <div className="aus-tag">Built for how Australians eat</div>
      <h2>Finally, a tracker that knows what a laksa is.</h2>
      <p className="aus-sub">Every other app makes you search "Asian noodle soup" and guess. Nourish has the real thing.</p>
      <div className="aus-grid">
        {cards.map((c, i) => (
          <div className="aus-card" key={i}>
            <span className="aus-emoji">{c.emoji}</span>
            <h4>{c.title}</h4>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecapCards() {
  return (
    <section className="recap">
      <div className="recap-text">
        <div className="aus-tag">Social recap cards</div>
        <h2>Share your week.<br />Inspire your feed.</h2>
        <p>Every Sunday, Nourish generates a beautiful recap card with your stats, streak, and mood highlights — ready to share to Instagram Stories.</p>
        <p className="recap-hint">Your progress is the best marketing we have.</p>
      </div>
      <div className="recap-card-preview">
        <div className="recap-preview">
          <div className="rp-header">
            <span className="rp-logo">nourish</span>
            <span className="rp-week">Week 12 recap</span>
          </div>
          <div className="rp-stat-row">
            <div className="rp-stat"><span className="rp-num accent">5/7</span><span>days on track</span></div>
            <div className="rp-stat"><span className="rp-num accent">142g</span><span>avg protein</span></div>
            <div className="rp-stat"><span className="rp-num accent">🔥12</span><span>day streak</span></div>
          </div>
          <div className="rp-mood-row">
            <span>Best mood day</span>
            <span className="accent">Tuesday 😊</span>
          </div>
          <div className="rp-footer">nourish.app</div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    { name: 'Free', price: '$0', desc: 'Perfect to get started', features: ['Basic food logging', 'Aus & Asian database', '7-day history', 'Manual mood check-in'] },
    { name: 'Pro', price: '$9.99', period: '/mo', desc: 'For serious trackers', features: ['Everything in Free', 'AI menu scanning', 'Unlimited history', 'AI coach & insights', 'Social recap cards', 'Trainer sharing'], highlight: true },
    { name: 'Team', price: '$29', period: '/mo', desc: 'For trainers & coaches', features: ['Everything in Pro', 'Up to 20 clients', 'Trainer dashboard', 'Client progress reports', 'Priority support'] },
  ]

  return (
    <section className="pricing" id="pricing">
      <h2>Simple pricing.</h2>
      <p className="pricing-sub">Start free, upgrade when you're ready.</p>
      <div className="pricing-grid">
        {plans.map((p, i) => (
          <div className={`pricing-card ${p.highlight ? 'highlight' : ''}`} key={i}>
            {p.highlight && <div className="popular-badge">Most popular</div>}
            <h3>{p.name}</h3>
            <div className="price-row">
              <span className="price">{p.price}</span>
              {p.period && <span className="period">{p.period}</span>}
            </div>
            <p className="plan-desc">{p.desc}</p>
            <ul>
              {p.features.map((f, j) => (
                <li key={j}><span className="check">✓</span>{f}</li>
              ))}
            </ul>
            <button className={p.highlight ? 'btn-primary' : 'btn-outline'}>
              {p.name === 'Free' ? 'Get started' : 'Start free trial'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">nourish</div>
        <p>Built for Australians. Powered by AI. Designed in Melbourne.</p>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  )
}
