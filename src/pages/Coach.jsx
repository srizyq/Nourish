// src/pages/Coach.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useMyClients, useTrainerComments } from '../hooks/useCoach';
import { getFoodLogsForDate, getWeightLogsForRange, getLatestWeightLog, getCheckinForDate } from '../lib/db';
import { todayLocalDate, dateNDaysAgo } from '../lib/patterns';
import { round1 } from '../lib/format';
import DaySelector from '../components/DaySelector';
import LogoMark from '../components/LogoMark';

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  return code;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-subtle)',
      border: '1px solid var(--border-default)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
      {children}
    </p>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function MacroReadout({ value, unit, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}{unit}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Coach() {
  const navigate = useNavigate();
  const { profile, save: saveProfile } = useProfile();
  const { clients, loading: clientsLoading, redeemCode, revoke } = useMyClients();
  const [selectedClient, setSelectedClient] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Coach Mode requires the pass — a direct /coach visit without it (or
  // after the pass lapses) bounces back to Settings rather than showing an
  // empty dashboard.
  useEffect(() => {
    if (profile && !profile.coach_pass) navigate('/settings');
  }, [profile, navigate]);

  if (!profile || !profile.coach_pass) return null;

  const exitCoachMode = async () => {
    await saveProfile({ coach_mode: false });
    navigate('/dashboard');
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    setCodeError(null);
    try {
      let lastErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await saveProfile({ coach_invite_code: generateInviteCode() });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err; // likely a code collision — retry with a fresh one
        }
      }
      if (lastErr) throw lastErr;
    } catch (err) {
      setCodeError(err.message || "Couldn't generate a code — try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!profile.coach_invite_code) return;
    try {
      await navigator.clipboard.writeText(profile.coach_invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the code is still visible to copy by hand.
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px 16px',
          paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-default)',
          position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={24} />
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Coach Mode
              </h2>
              <p style={{ color: 'var(--text-hint)', fontSize: 13, margin: '2px 0 0' }}>
                {selectedClient ? (selectedClient.name || 'Client') : 'Your connected clients'}
              </p>
            </div>
          </div>
          <button
            onClick={selectedClient ? () => setSelectedClient(null) : exitCoachMode}
            style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {selectedClient ? '← All clients' : 'Exit Coach Mode'}
          </button>
        </div>

        <div className="page-pad">
          {!selectedClient ? (
            <ClientListView
              profile={profile}
              clients={clients}
              loading={clientsLoading}
              generating={generating}
              codeError={codeError}
              copied={copied}
              onGenerate={handleGenerateCode}
              onCopy={handleCopyCode}
              onSelect={setSelectedClient}
              onRevoke={revoke}
              redeemCode={redeemCode}
            />
          ) : (
            <ClientDetailView client={selectedClient} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Client list + invite code ────────────────────────────────────────────────
function ClientListView({ profile, clients, loading, generating, codeError, copied, onGenerate, onCopy, onSelect, onRevoke }) {
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <Card style={{ marginBottom: 0 }}>
        <SectionLabel>Invite a client</SectionLabel>
        {profile.coach_invite_code ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                borderRadius: 8, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.1em',
                color: 'var(--accent)', textAlign: 'center',
              }}>
                {profile.coach_invite_code}
              </div>
              <button
                onClick={onCopy}
                style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
              Share this code — a client enters it to connect their data to your dashboard.
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>Generate a code to start inviting clients.</p>
        )}
        {codeError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 12px' }}>{codeError}</p>}
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          {generating ? 'Generating…' : profile.coach_invite_code ? 'Regenerate code' : 'Generate code'}
        </button>
      </Card>

      <Card style={{ marginBottom: 0 }}>
        <SectionLabel>Your clients</SectionLabel>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
        ) : clients.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No clients connected yet — share your invite code to get started.</p>
        ) : (
          clients.map(row => (
            <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
              <button
                onClick={() => onSelect(row.client)}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{row.client?.name || 'Unnamed client'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Connected {new Date(row.created_at).toLocaleDateString()}</div>
              </button>
              <button
                onClick={() => onRevoke(row.id)}
                title="Disconnect"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

// ─── Single client's dashboard ────────────────────────────────────────────────
function ClientDetailView({ client }) {
  const [date, setDate] = useState(todayLocalDate());
  const [foodLogs, setFoodLogs] = useState([]);
  const [latestWeight, setLatestWeight] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const { comments, addComment, removeComment } = useTrainerComments(client.id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rangeStart = dateNDaysAgo(14, new Date(`${date}T00:00:00`));
        const [logs, latest, history, ci] = await Promise.all([
          getFoodLogsForDate(client.id, date),
          getLatestWeightLog(client.id),
          getWeightLogsForRange(client.id, rangeStart, date),
          getCheckinForDate(client.id, date),
        ]);
        if (cancelled) return;
        setFoodLogs(logs);
        setLatestWeight(latest);
        setWeightHistory(history);
        setCheckin(ci);
      } catch (err) {
        console.error('Failed to load client data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [client.id, date]);

  const totals = foodLogs.reduce((acc, l) => ({
    cal: acc.cal + (l.calories || 0),
    protein: acc.protein + (l.protein_g || 0),
    carbs: acc.carbs + (l.carbs_g || 0),
    fat: acc.fat + (l.fat_g || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 });

  const handleAddComment = async () => {
    const body = commentBody.trim();
    if (!body) return;
    setCommentBody('');
    await addComment(body, date);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <DaySelector selectedDate={date} onSelect={setDate} />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel>Food log — {date}</SectionLabel>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
          ) : foodLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nothing logged this day.</p>
          ) : (
            <>
              <div className="grid-3-fixed" style={{ marginBottom: 16 }}>
                <MacroReadout value={Math.round(totals.cal)} unit="" label="kcal" color="var(--accent)" />
                <MacroReadout value={round1(totals.protein)} unit="g" label="protein" color="#6aabcf" />
                <MacroReadout value={round1(totals.carbs)} unit="g" label="carbs" color="#9f97e8" />
              </div>
              {foodLogs.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{l.food_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, textTransform: 'capitalize' }}>{l.meal}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, flexShrink: 0 }}>{Math.round(l.calories)} kcal</div>
                </div>
              ))}
            </>
          )}
        </Card>

        <div>
          <Card>
            <SectionLabel>Weight</SectionLabel>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
              {latestWeight ? `${latestWeight.weight}${latestWeight.unit}` : '—'}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
              {weightHistory.length > 0 ? `${weightHistory.length} entr${weightHistory.length === 1 ? 'y' : 'ies'} in the last 14 days` : 'No recent entries'}
            </p>
          </Card>

          <Card>
            <SectionLabel>Check-in — {date}</SectionLabel>
            {checkin ? (
              <>
                <StatRow label="Mood" value={checkin.mood || '—'} />
                <StatRow label="Energy" value={checkin.energy ? `${checkin.energy}/10` : '—'} />
                <StatRow label="Water" value={`${checkin.water_glasses || 0} glasses`} />
                {checkin.note && <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '10px 0 0' }}>{checkin.note}</p>}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No check-in logged this day.</p>
            )}
          </Card>
        </div>
      </div>

      <Card style={{ marginBottom: 0 }}>
        <SectionLabel>Comments</SectionLabel>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            placeholder={`Leave a note for ${client.name || 'this client'}…`}
            onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
            style={{ flex: 1, minWidth: 0, padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={handleAddComment}
            disabled={!commentBody.trim()}
            style={{ padding: '9px 16px', background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 8, color: '#0f0f0f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
          >
            Post
          </button>
        </div>
        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No comments yet.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{c.body}</p>
                <p style={{ color: 'var(--text-hint)', fontSize: 11, margin: '4px 0 0' }}>
                  {c.comment_date ? `On ${c.comment_date} · ` : ''}{new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => removeComment(c.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}
              >
                <i className="ti ti-trash" />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
