import React from 'react';
import { SK, SK_FONT, uid, Squirrel, Washi, Paperclip, Heart, paperBg, miniBtn } from './ui.jsx';
import celebrateSrc from '../assets/celebrate.gif';

export function useCounter(startISO) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const start = new Date(startISO).getTime();
  let diff = Math.max(0, now - start);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

function fmtStart(iso) {
  const dt = new Date(iso);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// calendar-accurate years / months / days since the start date
function ymdSince(startISO) {
  const s = new Date(startISO), e = new Date();
  let years = e.getFullYear() - s.getFullYear();
  let months = e.getMonth() - s.getMonth();
  let days = e.getDate() - s.getDate();
  if (days < 0) { months--; days += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

function useNow() {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return now;
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let h = d.getHours(); const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return `${date} · ${h}:${String(m).padStart(2, '0')} ${ampm}`;
}
function toLocalInput(iso) {
  const d = new Date(iso); const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fromLocalInput(v) { return v ? new Date(v).toISOString() : new Date().toISOString(); }

function DateTimeCaption({ iso, setIso }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(() => toLocalInput(iso));
  React.useEffect(() => { setVal(toLocalInput(iso)); }, [iso]);
  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <input type="datetime-local" value={val} onChange={e => setVal(e.target.value)}
               style={{ fontFamily: SK_FONT.hand, fontSize: 14, padding: '3px 6px', border: `2px solid ${SK.line}`, borderRadius: 8, background: '#fff', color: SK.ink, colorScheme: 'light' }} />
        <button onClick={() => { setIso(fromLocalInput(val)); setEditing(false); }} style={{ ...miniBtn, background: SK.sage }}>save</button>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {fmtDateTime(iso)} ✎
    </button>
  );
}

function Total({ n, label, color, flex = 1 }) {
  return (
    <div style={{ flex, minWidth: 0, background: SK.paper2, border: `1.5px solid ${SK.line}`, borderRadius: 12, padding: '7px 3px', textAlign: 'center' }}>
      <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15.5, color: color || SK.ink, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.toLocaleString()}</div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 11.5, color: SK.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FlipTile({ value, label, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        position: 'relative', width: '100%', borderRadius: 8, background: color,
        overflow: 'hidden', textAlign: 'center', padding: '5px 0 4px',
      }}>
        {/* flip-clock seam, behind the digits */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, marginTop: -0.5, background: SK.inkSoft, opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1, letterSpacing: 0.5 }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 11, color: SK.inkSoft, marginTop: 4, letterSpacing: 0.8 }}>{label}</div>
    </div>
  );
}

function CounterCard({ label, emoji, daysLabel, iso, setIso, accent }) {
  const now = useNow();
  const start = new Date(iso).getTime();
  const diff = Math.max(0, now - start);
  const totalSec = Math.floor(diff / 1000);
  const totalMin = Math.floor(diff / 60000);
  const totalHrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let r = diff - days * 86400000;
  const h = Math.floor(r / 3600000); r -= h * 3600000;
  const m = Math.floor(r / 60000); r -= m * 60000;
  const s = Math.floor(r / 1000);
  const dur = ymdSince(iso);
  return (
    <div style={{ background: SK.card, border: `3px solid ${SK.border}`, borderRadius: 18, padding: '15px 16px 14px' }}>
      <div style={{ textAlign: 'center', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15, color: accent }}>{emoji} {label}</div>
      <div style={{ textAlign: 'center', marginTop: 1 }}><DateTimeCaption iso={iso} setIso={setIso} /></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <FlipTile value={dur.years} label="YRS" color={SK.sky} />
        <FlipTile value={dur.months} label="MOS" color={SK.sage} />
        <FlipTile value={dur.days} label="DAYS" color={SK.sage} />
        <FlipTile value={h} label="HRS" color={SK.pink} />
        <FlipTile value={m} label="MIN" color={SK.pink} />
        <FlipTile value={s} label="SEC" color={SK.pink} />
      </div>
      <div style={{ textAlign: 'center', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 21, color: SK.ink, marginTop: 9 }}>
        {days.toLocaleString()} {daysLabel}
      </div>
      <div style={{ height: 2, background: SK.line, opacity: 0.5, borderRadius: 2, margin: '11px 6px 9px' }} />
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, textAlign: 'center', marginBottom: 6 }}>altogether, that's</div>
      <div style={{ display: 'flex', gap: 7 }}>
        <Total n={totalHrs} label="hours" color={SK.sageD} flex={1} />
        <Total n={totalMin} label="minutes" color={SK.peachD} flex={1.4} />
        <Total n={totalSec} label="seconds" color={SK.walnutD} flex={1.9} />
      </div>
    </div>
  );
}

function CounterDeck({ startISO, setStart, metISO, setMet, accent }) {
  const ref = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  const anchors = [
    { label: 'together since', emoji: '♡', daysLabel: 'days together', iso: startISO, set: setStart },
    { label: 'since we first met', emoji: '✦', daysLabel: 'days since we met', iso: metISO, set: setMet },
  ];
  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const goTo = (i) => { const el = ref.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); };
  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      <div ref={ref} onScroll={onScroll} style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {anchors.map((a, i) => (
          <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', boxSizing: 'border-box', padding: '0 1px' }}>
            <CounterCard label={a.label} emoji={a.emoji} daysLabel={a.daysLabel} iso={a.iso} setIso={a.set} accent={accent} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 9 }}>
        {anchors.map((a, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={a.label} style={{
            width: i === idx ? 22 : 9, height: 9, borderRadius: 6, border: 'none', padding: 0,
            background: i === idx ? accent : SK.line, cursor: 'pointer', transition: 'width .2s',
          }} />
        ))}
      </div>
    </div>
  );
}

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

// days until the next occurrence of month/day, by device-local calendar day
function daysUntil(month, day, now) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  let target = new Date(today.getFullYear(), month, day);
  if (target < today) target = new Date(today.getFullYear() + 1, month, day);
  return Math.round((target - today) / 86400000);
}

function CalendarCountdown({ month, day, title, accent, onRemove }) {
  const now = useNow();
  const days = daysUntil(month, day, now);
  return (
    <div style={{ position: 'relative', minWidth: 0, paddingTop: 9 }}>
      {/* binder ring */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        width: 17, height: 17, borderRadius: '50%', background: SK.paper, border: `3px solid ${SK.border}`,
      }} />
      <div style={{ background: SK.card, border: `3px solid ${SK.border}`, borderRadius: 14, overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ background: accent, padding: '6px 4px 4px', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 1.5 }}>
          {MONTH_NAMES[month]} {day}
        </div>
        <div style={{ padding: '7px 6px 8px' }}>
          <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16.5, color: accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {days === 0
            ? <img src={celebrateSrc} alt="it's today!" style={{ height: 64, display: 'block', margin: '2px auto 0' }} />
            : <div style={{ fontFamily: SK_FONT.hand, fontSize: 44, fontWeight: 700, color: accent, lineHeight: 1, marginTop: 1 }}>{days}</div>}
        </div>
      </div>
      {onRemove && (
        <button onClick={() => { if (confirm(`remove "${title}"?`)) onRemove(); }} aria-label="remove countdown"
                style={{ position: 'absolute', top: 13, right: 7, zIndex: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, lineHeight: 1, padding: 2 }}>
          ×
        </button>
      )}
    </div>
  );
}

function CountdownEditor({ accent, onSave, onCancel }) {
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const inp = {
    fontFamily: SK_FONT.hand, fontSize: 15, padding: '6px 9px', border: `2px solid ${SK.line}`,
    borderRadius: 10, background: '#fff', color: SK.ink, colorScheme: 'light', outline: 'none',
  };
  const save = () => {
    if (!name.trim() || !date) return;
    const d = new Date(date + 'T00:00');
    onSave({ id: uid(), name: name.trim(), month: d.getMonth(), day: d.getDate() });
  };
  return (
    <div style={{ background: SK.card, border: `3px solid ${SK.border}`, borderRadius: 14, padding: '12px 14px 13px', textAlign: 'center' }}>
      <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, color: accent, marginBottom: 8 }}>⧖ new countdown</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input placeholder="name it ♡" value={name} onChange={e => setName(e.target.value)} style={{ ...inp, flex: 1, minWidth: 110 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
        <button onClick={save} style={{ ...miniBtn, background: SK.sage }}>add</button>
        <button onClick={onCancel} style={{ ...miniBtn, background: SK.paper2, color: SK.ink }}>cancel</button>
      </div>
    </div>
  );
}

function CountdownRow({ startISO, accent, customs, onRemove, adding, onSave, onCancel }) {
  const anniv = new Date(startISO);
  const now = Date.now();
  const cards = [
    { key: 'anniv', month: anniv.getMonth(), day: anniv.getDate(), title: 'anniversary' },
    ...customs.map(c => ({ key: c.id, month: c.month, day: c.day, title: c.name, remove: () => onRemove(c.id) })),
  ].sort((a, b) => daysUntil(a.month, a.day, now) - daysUntil(b.month, b.day, now));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 2 }}>
      {cards.map(c => (
        <div key={c.key} style={{ width: 'calc(50% - 6px)', boxSizing: 'border-box' }}>
          <CalendarCountdown month={c.month} day={c.day} title={c.title} accent={accent} onRemove={c.remove} />
        </div>
      ))}
      {adding && (
        <div style={{ width: '100%' }}>
          <CountdownEditor accent={accent} onSave={onSave} onCancel={onCancel} />
        </div>
      )}
    </div>
  );
}

function importantPool(thoughts, tags) {
  const imp = (tags || []).find(t => (t.name || '').toLowerCase() === 'important') || { id: 't_love' };
  return (thoughts || []).filter(t => !t.hidden && (t.tags || []).includes(imp.id) && (t.title || t.body));
}
export function SquirrelSays({ thoughts, tags, size = 96, flip = false }) {
  const pool = importantPool(thoughts, tags);
  const [i, setI] = React.useState(() => (pool.length ? Math.floor(Math.random() * pool.length) : 0));
  const reshuffle = () => {
    if (pool.length < 2) return;
    setI(p => { let n; do { n = Math.floor(Math.random() * pool.length); } while (n === p); return n; });
  };
  const note = pool.length ? pool[i % pool.length] : null;
  const text = note ? (note.title || note.body) : 'pop an Important thought in & i\'ll remember it for you ♡';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: pool.length > 1 ? 'pointer' : 'default' }} onClick={reshuffle}>
      <div style={{
        position: 'relative', maxWidth: 230, background: SK.card, border: `3px solid ${SK.border}`,
        borderRadius: 16, padding: '8px 13px', fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink,
        lineHeight: 1.25, textAlign: 'center', marginBottom: 8,
      }}>
        <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{text}</span>
        {/* tail */}
        <div style={{ position: 'absolute', bottom: -11, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, background: SK.card, borderRight: `3px solid ${SK.border}`, borderBottom: `3px solid ${SK.border}`, transform: 'translateX(-50%) rotate(45deg)' }} />
      </div>
      <Squirrel size={size} flip={flip} />
      {pool.length > 1 && <div style={{ fontFamily: SK_FONT.hand, fontSize: 11, color: SK.inkSoft, marginTop: 2 }}>tap me for another ♡</div>}
    </div>
  );
}

export function PinnedBoard({ pinned, go }) {
  if (!pinned.length) {
    return (
      <div onClick={() => go('thoughts')} style={{
        border: `2.5px dashed ${SK.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
        fontFamily: SK_FONT.hand, fontSize: 15.5, color: SK.inkSoft, textAlign: 'center', lineHeight: 1.35,
      }}>
        ♡ tap the heart on any thought to pin it here — what he's up to, his plans, things to remember
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft, marginBottom: 6 }}>♡ pinned for me</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pinned.slice(0, 4).map((t, i) => (
          <StickyNote key={t.id} t={t} rot={i % 2 ? 1.2 : -1.2} color={t.color || SK.butter} full onClick={() => go('thoughts')} />
        ))}
      </div>
    </div>
  );
}

function StartCaption({ startISO, setStart }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(() => startISO.slice(0, 16));
  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <input type="datetime-local" value={val} onChange={e => setVal(e.target.value)}
               style={{ fontFamily: SK_FONT.hand, fontSize: 15, padding: '3px 6px', border: `2px solid ${SK.line}`, borderRadius: 8, background: '#fff', color: SK.ink }} />
        <button onClick={() => { setStart(new Date(val).toISOString()); setEditing(false); }}
                style={{ ...miniBtn, background: SK.sage }}>save</button>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      since {fmtStart(startISO)} · noon ✎
    </button>
  );
}

function QuickRow({ onAddCountdown }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button onClick={onAddCountdown} style={{
        width: '100%', maxWidth: 310, padding: '9px 6px', border: `3px solid ${SK.border}`,
        borderRadius: 14, background: SK.card, cursor: 'pointer',
        fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, color: SK.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span style={{ color: SK.sky, fontSize: 20 }}>⧖</span>+ countdown
      </button>
    </div>
  );
}

function SquirrelQuickRow({ thoughts, tags, onAddCountdown }) {
  const Btn = ({ onClick, c, e, label }) => (
    <button onClick={onClick} style={{
      padding: '11px 16px', border: `3px solid ${SK.border}`, borderRadius: 14,
      background: SK.card, cursor: 'pointer', fontFamily: SK_FONT.hand, fontWeight: 700,
      fontSize: 16, color: SK.ink, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    }}>
      <span style={{ color: c, fontSize: 20 }}>{e}</span>+ {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <Btn onClick={onAddCountdown} c={SK.sky} e="⧖" label="countdown" />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <SquirrelSays thoughts={thoughts} tags={tags} size={82} />
      </div>
    </div>
  );
}

export function Home({ data }) {
  const { startISO, setStart, metISO, setMet, thoughts, tags, photos, go, accent, mascot, homeStyle, countdowns, setCountdowns } = data;
  const c = useCounter(startISO);
  const dur = ymdSince(startISO);
  const [addingCd, setAddingCd] = React.useState(false);
  const fav = photos.find(p => p.fav) || photos[0];
  const recent = thoughts.filter(t => !t.hidden).slice().sort((a, b) => b.created - a.created).slice(0, 3);
  const pinned = thoughts.filter(t => t.pin && !t.hidden).sort((a, b) => b.created - a.created);

  const header = (
    <div style={{ textAlign: 'center', paddingTop: 2 }}>
      <StartCaption startISO={startISO} setStart={setStart} />
    </div>
  );

  // ── DIRECTION A: counter card ──────────────────────────────
  if (homeStyle === 'card') {
    return (
      <div style={{ padding: '10px 18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CounterDeck startISO={startISO} setStart={setStart} metISO={metISO} setMet={setMet} accent={accent} />
        <CountdownRow startISO={startISO} accent={accent} customs={countdowns}
                      onRemove={id => setCountdowns(countdowns.filter(x => x.id !== id))}
                      adding={addingCd}
                      onSave={cd => { setCountdowns([...countdowns, cd]); setAddingCd(false); }}
                      onCancel={() => setAddingCd(false)} />
        {mascot
          ? <SquirrelQuickRow thoughts={thoughts} tags={tags} onAddCountdown={() => setAddingCd(true)} />
          : <QuickRow onAddCountdown={() => setAddingCd(true)} />}
        <PinnedBoard pinned={pinned} go={go} />
      </div>
    );
  }

  // ── DIRECTION B: scrapbook ─────────────────────────────────
  if (homeStyle === 'scrapbook') {
    return (
      <div style={{ padding: '6px 18px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {header}
        <div style={{ position: 'relative', height: 318, marginTop: 6 }}>
          {/* polaroid */}
          <div style={{
            position: 'absolute', left: '50%', top: 8, transform: 'translateX(-52%) rotate(-4deg)',
            background: '#fff', padding: '10px 10px 34px', borderRadius: 4,
            border: `3px solid ${SK.border}`, width: 188,
          }}>
            <div style={{ width: 168, height: 168, overflow: 'hidden', background: SK.paper2, borderRadius: 2 }}>
              {fav
                ? <img src={fav.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Placeholder label="favourite photo" h={168} />}
            </div>
            <div style={{ fontFamily: SK_FONT.script, fontSize: 26, color: SK.ink, textAlign: 'center', marginTop: 4 }}>us ♡</div>
          </div>
          <div style={{ position: 'absolute', left: '50%', top: 2, transform: 'translateX(-50%) rotate(2deg)', zIndex: 3 }}>
            <Washi color={accent} w={84} h={24} rot={2} />
          </div>
          {/* counter tag */}
          <div style={{
            position: 'absolute', right: 6, top: 150, transform: 'rotate(7deg)', zIndex: 4,
            background: SK.butter, border: `3px solid ${SK.border}`, borderRadius: '4px 14px 14px 4px',
            padding: '8px 14px 8px 18px',
          }}>
            <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: SK.walnutD }} />
            <div style={{ fontFamily: SK_FONT.script, fontSize: 38, fontWeight: 700, color: SK.walnutD, lineHeight: 0.9 }}>{c.d}</div>
            <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.ink }}>days · {String(c.h).padStart(2,'0')}h {String(c.m).padStart(2,'0')}m</div>
          </div>
          {mascot && <div style={{ position: 'absolute', left: 0, bottom: -6, transform: 'rotate(-6deg)' }}><Squirrel size={86} /></div>}
          {/* decorative hearts */}
          <div style={{ position: 'absolute', left: 30, top: 0, transform: 'rotate(-12deg)' }}><Heart filled size={26} color={SK.pinkD} /></div>
          <div style={{ position: 'absolute', right: 40, bottom: 26, transform: 'rotate(10deg)', fontSize: 24 }}>✦</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          {pinned.slice(0, 2).map((t, i) => (
            <StickyNote key={t.id} t={t} rot={i ? 3 : -3} color={i ? SK.sage : SK.peach} onClick={() => go('thoughts')} />
          ))}
          {pinned.length === 0 && <EmptyHint go={go} />}
        </div>
      </div>
    );
  }

  // ── DIRECTION C: journal spread ────────────────────────────
  return (
    <div style={{ padding: '6px 14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {header}
      <div style={{
        position: 'relative', background: SK.card, borderRadius: 14,
        border: `3px solid ${SK.border}`,
        display: 'flex', minHeight: 250, overflow: 'hidden',
      }}>
        {/* spine */}
        <div style={{ position: 'absolute', left: '50%', top: 8, bottom: 8, width: 2, transform: 'translateX(-50%)', background: SK.border }} />
        {/* left page */}
        <div style={{ flex: 1, padding: '18px 12px', textAlign: 'center', ...paperBg('lines'), backgroundColor: 'transparent' }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft }}>it has been</div>
          <div style={{ fontFamily: SK_FONT.script, fontSize: 74, fontWeight: 700, color: accent, lineHeight: 0.85, marginTop: 2 }}>{c.d}</div>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 18, color: SK.ink }}>days ♡</div>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft, marginTop: 8 }}>
            {String(c.h).padStart(2,'0')}h {String(c.m).padStart(2,'0')}m {String(c.s).padStart(2,'0')}s
          </div>
          {mascot && <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}><Squirrel size={66} acorn={false} /></div>}
        </div>
        {/* right page */}
        <div style={{ flex: 1, padding: '18px 12px' }}>
          <div style={{ fontFamily: SK_FONT.script, fontSize: 26, color: SK.ink, marginBottom: 8 }}>lately…</div>
          <LatelyRow e="✎" n={thoughts.length} label="thoughts kept" c={SK.sageD} />
          <LatelyRow e="❑" n={photos.length} label="photos saved" c={SK.peachD} />
          <div style={{ height: 1, background: SK.line, margin: '10px 0' }} />
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, marginBottom: 4 }}>pinned for me:</div>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 16, color: SK.ink, lineHeight: 1.2 }}>
            {pinned[0] ? `"${pinned[0].title || pinned[0].body.slice(0, 40)}"` : 'tap ♡ on a thought to keep it here'}
          </div>
        </div>
      </div>
    </div>
  );
}

function LatelyRow({ e, n, label, c }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
      <span style={{ color: c, fontSize: 18, width: 18 }}>{e}</span>
      <span style={{ fontFamily: SK_FONT.script, fontSize: 26, fontWeight: 700, color: SK.ink, lineHeight: 1 }}>{n}</span>
      <span style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.inkSoft }}>{label}</span>
    </div>
  );
}

export function StickyNote({ t, rot = 0, color = SK.butter, onClick, full }) {
  return (
    <div onClick={onClick} style={{
      flex: full ? undefined : 1, background: color, padding: '10px 12px', borderRadius: 4,
      transform: `rotate(${rot}deg)`, border: `3px solid ${SK.border}`,
      cursor: onClick ? 'pointer' : 'default', minWidth: 0,
    }}>
      {t.title && <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, color: SK.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>}
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.ink, opacity: 0.85, display: '-webkit-box', WebkitLineClamp: full ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25 }}>{t.body}</div>
    </div>
  );
}

export function EmptyHint({ go }) {
  return (
    <div onClick={() => go('thoughts')} style={{
      flex: 1, border: `2px dashed ${SK.line}`, borderRadius: 12, padding: '14px',
      textAlign: 'center', fontFamily: SK_FONT.hand, fontSize: 16, color: SK.inkSoft, cursor: 'pointer',
    }}>
      no thoughts yet — tap to scribble your first one ✎
    </div>
  );
}

export function Placeholder({ label, h = 160 }) {
  return (
    <div style={{
      height: h, width: '100%',
      background: `repeating-linear-gradient(45deg, ${SK.paper2} 0 8px, ${SK.card} 8px 16px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SK_FONT.mono, fontSize: 12, color: SK.inkSoft, letterSpacing: 0.5,
    }}>{label}</div>
  );
}

// ── Contribution stats heatmap ───────────────────────────────
export const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
function startOfWeekH(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.getTime(); }

function withA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function HomeStats({ data }) {
  const { thoughts, photos, accent } = data;
  const counts = React.useMemo(() => {
    const m = {};
    const add = arr => arr.forEach(x => { const k = dayStart(x.created); m[k] = (m[k] || 0) + 1; });
    add(thoughts); add(photos);
    return m;
  }, [thoughts, photos]);

  const WEEKS = 13;
  const firstWeek = startOfWeekH(Date.now()) - (WEEKS - 1) * 7 * 86400000;
  const today = dayStart(Date.now());
  const total = thoughts.length + photos.length;

  let streak = 0; for (let i = 0; ; i++) { const k = today - i * 86400000; if (counts[k]) streak++; else break; }

  const shade = c => c === 0 ? SK.paper2 : c === 1 ? withA(accent, 0.32) : c === 2 ? withA(accent, 0.6) : accent;

  return (
    <div style={{ padding: '4px 18px 20px' }}>
      <div style={{ background: SK.card, border: `3px solid ${SK.border}`, borderRadius: 16, padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: SK_FONT.script, fontSize: 24, fontWeight: 700, color: SK.ink }}>contributions</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Tally n={thoughts.length} label="thoughts" c={SK.sageD} />
          <Tally n={photos.length} label="photos" c={SK.peachD} />
          <Tally n={streak} label="day streak" c={SK.pinkD} />
        </div>
        {/* heatmap */}
        <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2 }}>
          {Array.from({ length: WEEKS }).map((_, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: 7 }).map((_, d) => {
                const k = firstWeek + (w * 7 + d) * 86400000;
                const future = k > today;
                const c = counts[k] || 0;
                return <div key={d} title={new Date(k).toLocaleDateString() + ': ' + c}
                  style={{ width: 13, height: 13, borderRadius: 3, background: future ? 'transparent' : shade(c), border: future ? 'none' : `1px solid ${SK.line}66`, flexShrink: 0 }} />;
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 7 }}>
          <span style={{ fontFamily: SK_FONT.hand, fontSize: 12, color: SK.inkSoft }}>less</span>
          {[0, 1, 2, 3].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: 3, background: shade(c), border: `1px solid ${SK.line}66` }} />)}
          <span style={{ fontFamily: SK_FONT.hand, fontSize: 12, color: SK.inkSoft }}>more</span>
        </div>
      </div>
    </div>
  );
}

function Tally({ n, label, c }) {
  return (
    <div style={{ flex: 1, background: withA(c, 0.13), border: `2px solid ${withA(c, 0.4)}`, borderRadius: 12, padding: '7px 4px', textAlign: 'center' }}>
      <div style={{ fontFamily: SK_FONT.script, fontSize: 26, fontWeight: 700, color: c, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 12, color: SK.inkSoft, lineHeight: 1.05, marginTop: 1 }}>{label}</div>
    </div>
  );
}

