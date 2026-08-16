import React from 'react';
import { SK, SK_FONT, useStored, Squirrel, Washi, paperBg, useDragDismiss } from './ui.jsx';
import { dayStart } from './Home.jsx';

function startOfWeek(ts) {
  const d = new Date(ts); d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  return d.getTime();
}
const weekLabel = ws => 'week of ' + new Date(ws).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const weekShort = ws => new Date(ws).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const dayLabel = ts => new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });

function buildEntries(thoughts, photos) {
  const e = [];
  thoughts.forEach(t => { if (t.scrap && !t.hidden) e.push({ kind: 'thought', id: t.id, created: t.created, d: t }); });
  photos.forEach(p => { if (p.scrap) e.push({ kind: 'photo', id: p.id, created: p.created, d: p }); });
  e.sort((a, b) => a.created - b.created);
  return e;
}

// measure photo aspect ratios at runtime (not stored in Firestore); cached per URL
const arCache = new Map();
function useAspects(entries) {
  const [ver, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    entries.forEach(e => {
      if (e.kind !== 'photo' || !e.d.src || arCache.has(e.d.src)) return;
      arCache.set(e.d.src, 0); // loading
      const img = new Image();
      img.onload = () => { arCache.set(e.d.src, img.naturalWidth / img.naturalHeight); bump(); };
      img.src = e.d.src;
    });
  }, [entries]);
  return ver;
}
const isWide = e => e.kind === 'photo' && (arCache.get(e.d.src) || 0) > 1.15;

// pack a week's items into rows of 2 slots: wide photos take a full row, thin
// items pair up with the next thin one even if a wide photo sits between them
function packRows(items) {
  const rows = [];
  let open = null;
  for (const e of items) {
    if (isWide(e)) rows.push({ wide: true, items: [e] });
    else if (open) { open.items.push(e); open = null; }
    else { open = { wide: false, items: [e] }; rows.push(open); }
  }
  return rows;
}

const ROWS_PER_PAGE = 2;
function buildPages(entries) {
  const pages = [{ type: 'cover' }];
  if (!entries.length) { pages.push({ type: 'empty' }); return pages; }
  const weeks = [];
  let cur = null;
  for (const e of entries) {
    const ws = startOfWeek(e.created);
    if (!cur || cur.ws !== ws) { cur = { ws, items: [] }; weeks.push(cur); }
    cur.items.push(e);
  }
  for (const w of weeks) {
    const rows = packRows(w.items);
    const count = Math.ceil(rows.length / ROWS_PER_PAGE);
    for (let p = 0; p < count; p++) {
      pages.push({ type: 'week', ws: w.ws, first: p === 0, n: p + 1, of: count,
        rows: rows.slice(p * ROWS_PER_PAGE, p * ROWS_PER_PAGE + ROWS_PER_PAGE) });
    }
  }
  return pages;
}

function ScrapItem({ e, rot, accent, onOpen }) {
  const tilt = rot;
  if (e.kind === 'photo') {
    return (
      <div onClick={onOpen} style={{ width: '100%', boxSizing: 'border-box', background: '#fff', padding: '6px 6px 8px', borderRadius: 3, transform: `rotate(${tilt}deg)`, position: 'relative', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(' + (-tilt) + 'deg)' }}>
          <Washi color={SK.peach} w={42} h={15} rot={0} />
        </div>
        <img src={e.d.src} alt="" style={{ width: '100%', display: 'block', borderRadius: 2, maxHeight: 170, objectFit: 'cover', background: SK.paper2 }} />
        <div style={{ fontFamily: SK_FONT.hand, fontSize: 13.5, color: SK.ink, textAlign: 'center', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {e.d.caption && <>{e.d.caption} · </>}<span style={{ color: SK.inkSoft }}>{dayLabel(e.created)}</span>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onOpen} style={{ width: '100%', boxSizing: 'border-box', background: e.d.color || '#f6e7c6', padding: '10px 12px', borderRadius: 4, border: `3px solid ${SK.border}`, transform: `rotate(${tilt}deg)`, position: 'relative', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(' + (-tilt) + 'deg)' }}>
        <Washi color={accent} w={42} h={15} rot={0} />
      </div>
      {e.d.title && <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15, color: SK.ink, lineHeight: 1.15 }}>{e.d.title}</div>}
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.ink, opacity: 0.9, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{e.d.body}</div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 11.5, color: SK.inkSoft, marginTop: 5 }}>{dayLabel(e.created)}</div>
    </div>
  );
}

function Page({ page, accent, onOpen }) {
  if (page.type === 'cover') {
    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: '100%', height: '100%', borderRadius: 16,
          border: `3px solid ${SK.border}`, overflow: 'hidden',
          background:
            'repeating-linear-gradient(96deg, rgba(94,62,38,0.10) 0 7px, transparent 7px 15px),' +
            'radial-gradient(130% 80% at 30% 10%, #b07f4f 0%, transparent 60%),' +
            'linear-gradient(150deg, #a06f43 0%, #8a5c36 55%, #7a4f2e 100%)',
        }}>
          <div style={{ position: 'absolute', inset: 16, borderRadius: 10, border: `2.5px dashed rgba(247,238,214,0.55)` }} />
          {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h],i) => (
            <div key={i} style={{ position: 'absolute', [v]: 8, [h]: 8, width: 30, height: 30, [`border${v[0].toUpperCase()+v.slice(1)}`]: `4px solid rgba(60,40,24,0.55)`, [`border${h[0].toUpperCase()+h.slice(1)}`]: `4px solid rgba(60,40,24,0.55)`, borderRadius: v==='top'&&h==='left'?'8px 0 0 0':v==='top'?'0 8px 0 0':h==='left'?'0 0 0 8px':'0 0 8px 0' }} />
          ))}
        </div>
      </div>
    );
  }

  let inner;
  if (page.type === 'empty') {
    inner = (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 26px' }}>
        <Squirrel size={130} />
        <div style={{ fontFamily: SK_FONT.hand, fontSize: 17, color: SK.inkSoft, marginTop: 10, lineHeight: 1.35 }}>
          nothing pinned in here yet — open a thought or photo and tap <b style={{ color: SK.sageD }}>add to sketchbook</b> ♡
        </div>
      </div>
    );
  } else {
    inner = (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 26px 16px', overflow: 'hidden' }}>
        {page.first
          ? (<div style={{ alignSelf: 'center', marginBottom: 2 }}><Washi color={accent} w={170} h={30} rot={-2} pattern="dot" /><div style={{ fontFamily: SK_FONT.script, fontSize: 24, fontWeight: 700, color: SK.ink, textAlign: 'center', marginTop: -30, position: 'relative' }}>{weekLabel(page.ws)}</div></div>)
          : (<div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, textAlign: 'center' }}>{weekShort(page.ws)} · cont'd ({page.n}/{page.of})</div>)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: page.rows.length < 2 ? 'center' : 'flex-start', overflow: 'hidden' }}>
          {page.rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {row.items.map((e, i) => (
                <div key={e.kind + e.id} style={{
                  flex: row.wide ? '0 1 88%' : '1 1 44%',
                  maxWidth: row.wide ? '90%' : '47%',
                  minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                }}>
                  <ScrapItem e={e} rot={(ri + i) % 2 ? 2.2 : -2.4} accent={accent} onOpen={() => onOpen(e)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 8, bottom: 8, right: -5, width: 6, background: SK.paper2, borderRadius: 4, border: `2px solid ${SK.border}` }} />
      <div style={{ position: 'absolute', top: 5, bottom: 5, right: -10, width: 6, background: SK.card, borderRadius: 4, border: `2px solid ${SK.border}` }} />
      <div style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: 14,
        background: SK.card, ...paperBg('lines'), backgroundColor: SK.card, overflow: 'hidden',
        border: `2px solid ${SK.border}`,
      }}>
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{inner}</div>
      </div>
    </div>
  );
}

function ToolIcon({ kind }) {
  const p = { fill: 'none', stroke: SK.border, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {kind === 'cal' && <g {...p}><rect x="4" y="6" width="16" height="14" rx="2.5" /><path d="M4 10h16M8 4v4M16 4v4" /><circle cx="12" cy="15" r="1.4" fill={SK.border} stroke="none" /></g>}
      {kind === 'dice' && <g {...p}><rect x="4.5" y="4.5" width="15" height="15" rx="3.5" /><circle cx="9" cy="9" r="1.3" fill={SK.border} stroke="none" /><circle cx="15" cy="9" r="1.3" fill={SK.border} stroke="none" /><circle cx="9" cy="15" r="1.3" fill={SK.border} stroke="none" /><circle cx="15" cy="15" r="1.3" fill={SK.border} stroke="none" /></g>}
    </svg>
  );
}

const toolBtn = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderRadius: 13,
  border: `2px solid ${SK.border}`, background: '#fdf7ea', color: SK.ink, cursor: 'pointer',
  fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
};

export function Scrapbook({ data }) {
  const { thoughts, photos, tags, accent } = data;
  const entries = React.useMemo(() => buildEntries(thoughts, photos), [thoughts, photos]);
  const arVer = useAspects(entries);
  const pages = React.useMemo(() => buildPages(entries), [entries, arVer]);
  const [page, setPage] = useStored('scrapPage', 0);
  const clamped = Math.min(Math.max(0, page), pages.length - 1);
  React.useEffect(() => { if (page !== clamped) setPage(clamped); }, [pages.length]);

  const [open, setOpen] = React.useState(null);
  const [dragX, setDragX] = React.useState(0);
  const [trans, setTrans] = React.useState(false);
  const wrapRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const drag = React.useRef(null);
  const W = () => (trackRef.current ? trackRef.current.clientWidth : (wrapRef.current ? wrapRef.current.clientWidth - 36 : 360));

  const [calOpen, setCalOpen] = React.useState(false);

  const animateTo = (delta) => {
    const target = clamped + delta;
    if (target < 0 || target >= pages.length) { snapBack(); return; }
    setTrans(true); setDragX(-delta * W());
    setTimeout(() => { setTrans(false); setDragX(0); setPage(target); }, 300);
  };
  const snapBack = () => { setTrans(true); setDragX(0); setTimeout(() => setTrans(false), 260); };

  const onDown = (ev) => {
    const p = ev.touches ? ev.touches[0] : ev;
    drag.current = { x: p.clientX, y: p.clientY, active: true, decided: false, horiz: false };
  };
  const onMove = (ev) => {
    if (!drag.current || !drag.current.active) return;
    const p = ev.touches ? ev.touches[0] : ev;
    const dx = p.clientX - drag.current.x, dy = p.clientY - drag.current.y;
    if (!drag.current.decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.current.decided = true; drag.current.horiz = Math.abs(dx) > Math.abs(dy);
    }
    if (!drag.current.horiz) return;
    if (ev.cancelable) ev.preventDefault();
    let nx = dx;
    if ((clamped === 0 && dx > 0) || (clamped === pages.length - 1 && dx < 0)) nx = dx * 0.28;
    setDragX(Math.max(-W(), Math.min(W(), nx)));
  };
  const onUp = () => {
    if (!drag.current) return;
    const horiz = drag.current.horiz; drag.current.active = false;
    if (!horiz) return;
    const th = W() * 0.22;
    if (dragX < -th) animateTo(1);
    else if (dragX > th) animateTo(-1);
    else snapBack();
  };

  const weekPages = React.useMemo(() => {
    const m = [];
    pages.forEach((pg, i) => { if (pg.type === 'week' && pg.first) m.push({ ws: pg.ws, idx: i }); });
    return m;
  }, [pages]);
  const daysWithEntries = React.useMemo(() => {
    const s = new Set();
    entries.forEach(e => s.add(dayStart(e.created)));
    return s;
  }, [entries]);
  const jump = (idx) => { setTrans(false); setDragX(0); setPage(Math.min(Math.max(0, idx), pages.length - 1)); };
  const jumpToDate = (ts) => {
    if (!weekPages.length) { jump(0); return; }
    const ws = startOfWeek(ts);
    let best = weekPages[0], bestDiff = Infinity;
    weekPages.forEach(w => { const diff = Math.abs(w.ws - ws); if (diff < bestDiff) { bestDiff = diff; best = w; } });
    jump(best.idx); setCalOpen(false);
  };
  const randomPage = () => {
    const pool = pages.map((p, i) => i).filter(i => pages[i].type === 'week');
    if (!pool.length) { jump(0); return; }
    let n = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && n === clamped) n = pool[(pool.indexOf(n) + 1) % pool.length];
    jump(n);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', ...deskBg() }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px 6px', flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <button onClick={() => setCalOpen(true)} style={toolBtn}><ToolIcon kind="cal" /> date</button>
        </div>
        <PageJumper page={clamped} total={pages.length} onJump={jump} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={randomPage} style={toolBtn}><ToolIcon kind="dice" /> random</button>
        </div>
      </div>

      <div ref={wrapRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '6px 18px 20px' }}
           onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
           onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
        {/* -100% of the track's own width = one page, so the current page is centered
            on first paint without measuring anything (refs aren't mounted yet then). */}
        <div ref={trackRef} style={{ position: 'absolute', inset: '6px 18px 20px', display: 'flex', transform: `translateX(calc(-100% + ${dragX}px))`, transition: trans ? 'transform .3s cubic-bezier(.4,0,.2,1)' : 'none', touchAction: 'pan-y' }}>
          {[clamped - 1, clamped, clamped + 1].map((i, k) => (
            <div key={i} style={{ position: 'absolute', left: `${k * 100}%`, top: 0, width: '100%', height: '100%' }}>
              {i >= 0 && i < pages.length
                ? <Page page={pages[i]} accent={accent} onOpen={setOpen} />
                : null}
            </div>
          ))}
        </div>
      </div>

      {calOpen && <CalendarJump daysWithEntries={daysWithEntries} accent={accent} onPick={jumpToDate} onClose={() => setCalOpen(false)} />}
      {open && <ScrapPeek e={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PageJumper({ page, total, onJump }) {
  const [val, setVal] = React.useState(String(page + 1));
  React.useEffect(() => { setVal(String(page + 1)); }, [page]);
  const commit = () => {
    const n = parseInt(val, 10);
    if (!isNaN(n)) onJump(n - 1);
    else setVal(String(page + 1));
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: SK_FONT.hand, fontSize: 15, color: '#f3ecd9' }}>
      <input value={val} inputMode="numeric"
             onChange={e => setVal(e.target.value.replace(/[^0-9]/g, ''))}
             onFocus={e => e.target.select()}
             onBlur={commit}
             onKeyDown={e => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
             style={{
               width: 38, textAlign: 'center', padding: '5px 4px', borderRadius: 10,
               border: `2px solid ${SK.border}`, background: '#fdf7ea', color: SK.ink,
               fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, outline: 'none',
             }} />
      <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>/ {total}</span>
    </div>
  );
}

function CalendarJump({ daysWithEntries, accent, onPick, onClose }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.getTime(); });
  const base = new Date(month);
  const y = base.getFullYear(), mo = base.getMonth();
  const first = new Date(y, mo, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const monthName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const today = dayStart(Date.now());
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 66, background: 'rgba(56,44,36,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22, backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: SK.paper, border: `3px solid ${SK.border}`, borderRadius: 18, padding: '16px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => setMonth(new Date(y, mo - 1, 1).getTime())} style={calArrow}>‹</button>
          <div style={{ fontFamily: SK_FONT.script, fontSize: 24, fontWeight: 700, color: SK.ink }}>{monthName}</div>
          <button onClick={() => setMonth(new Date(y, mo + 1, 1).getTime())} style={calArrow}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} style={{ textAlign: 'center', fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (d == null) return <div key={i} />;
            const ts = new Date(y, mo, d).getTime();
            const has = daysWithEntries.has(ts);
            const isToday = ts === today;
            return (
              <button key={i} onClick={() => onPick(ts)} style={{
                aspectRatio: '1', borderRadius: 10, cursor: 'pointer',
                border: isToday ? `2.5px solid ${SK.border}` : `2px solid ${has ? accent : 'transparent'}`,
                background: has ? accent + '2a' : 'transparent', color: SK.ink,
                fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15, position: 'relative',
              }}>
                {d}
                {has && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: accent }} />}
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, textAlign: 'center', marginTop: 12 }}>tap a day to flip to that week ♡</div>
      </div>
    </div>
  );
}
const calArrow = {
  width: 38, height: 38, borderRadius: '50%', border: `2px solid ${SK.border}`, background: '#fdf7ea',
  color: SK.ink, fontSize: 22, fontFamily: SK_FONT.hand, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
};

function ScrapPeek({ e, onClose }) {
  const { ref, style: dragStyle } = useDragDismiss({ onDismiss: onClose });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(56,44,36,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22, backdropFilter: 'blur(2px)' }}>
      <div ref={ref} onClick={ev => ev.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '80%', overflowY: 'auto', ...dragStyle }}>
        {e.kind === 'photo' ? (
          <div style={{ background: '#fff', padding: '12px 12px 14px', borderRadius: 4, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', transform: 'rotate(-1deg)' }}>
            <img src={e.d.src} alt="" style={{ maxWidth: '100%', maxHeight: '56vh', display: 'block', borderRadius: 2 }} />
            {e.d.caption && <div style={{ fontFamily: SK_FONT.hand, fontSize: 17, color: SK.ink, textAlign: 'center', marginTop: 8 }}>{e.d.caption}</div>}
            <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, textAlign: 'center' }}>{new Date(e.created).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        ) : (
          <div style={{ background: e.d.color || '#f6e7c6', padding: '18px 18px', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', minWidth: 240 }}>
            {e.d.title && <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 22, color: SK.ink, marginBottom: 6 }}>{e.d.title}</div>}
            <div style={{ fontFamily: SK_FONT.hand, fontSize: 18, color: SK.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{e.d.body}</div>
            <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, marginTop: 10 }}>{new Date(e.created).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function deskBg() {
  return {
    background:
      'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.06), transparent 60%),' +
      'repeating-linear-gradient(91deg, #b78a5e 0 38px, #b07f50 38px 76px),' +
      'linear-gradient(#b78a5e, #a8754a)',
  };
}
