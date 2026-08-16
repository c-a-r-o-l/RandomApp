import React from 'react';
import squirrelSrc from '../assets/squirrel.png';

export const SK = {
  paper:   '#f5efe0',
  paper2:  '#efe7d3',
  card:    '#fbf7ec',
  ink:     '#56463a',
  inkSoft: '#8a7867',
  line:    '#d9cdb6',
  sage:    '#9fb886',
  sageD:   '#7c9560',
  peach:   '#e3a486',
  peachD:  '#cf8466',
  pink:    '#f0bcbc',
  pinkD:   '#df9a9a',
  walnut:  '#b08d6a',
  walnutD: '#8c6a49',
  butter:  '#f3d79a',
  sky:     '#a9c6cb',
  border:  '#856139',
};

// flat 2D box: thick dark-brown border, no shadow
export function flatBox(radius = 14, w = 3) {
  return { border: `${w}px solid ${SK.border}`, borderRadius: radius, boxShadow: 'none' };
}

export const SK_FONT = {
  hand: "'Gaegu', 'Comic Sans MS', cursive",
  script: "'Caveat', cursive",
  mono: "'Courier New', monospace",
};

// ── persistent state hook ────────────────────────────────────
export function useStored(key, initial) {
  const [val, setVal] = React.useState(() => {
    try {
      const raw = localStorage.getItem('ss_' + key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch (e) { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('ss_' + key, JSON.stringify(val)); } catch (e) {}
  }, [key, val]);
  return [val, setVal];
}

// ── tiny id ──────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 9);

// ── date <input type=date> helpers (local, no TZ drift) ──────
export function toDateInput(ts) {
  const d = new Date(ts); const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// keep the time-of-day of the previous timestamp, just swap the calendar day
export function dateInputToTs(v, prevTs) {
  if (!v) return prevTs;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(prevTs || Date.now());
  dt.setFullYear(y, m - 1, d);
  return dt.getTime();
}

// ── Squirrel mascot ──────────────────────────────────────────
const SQUIRREL_SRC = squirrelSrc;
export function Squirrel({ size = 110, flip = false, style = {} }) {
  return (
    <img src={SQUIRREL_SRC} alt="squirrel" draggable={false}
         style={{
           width: size, height: 'auto', display: 'block',
           transform: flip ? 'scaleX(-1)' : 'none', pointerEvents: 'none',
           userSelect: 'none', ...style,
         }} />
  );
}

// ── Washi tape strip ─────────────────────────────────────────
export function Washi({ color = SK.sage, w = 92, h = 26, rot = -6, style = {}, pattern = 'stripe' }) {
  const pid = React.useMemo(uid, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
         style={{ transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.12))', ...style }}>
      <defs>
        <pattern id={'wp' + pid} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          {pattern === 'stripe'
            ? <rect width="6" height="12" fill="rgba(255,255,255,0.45)" />
            : <circle cx="6" cy="6" r="2.4" fill="rgba(255,255,255,0.5)" />}
        </pattern>
      </defs>
      <rect width={w} height={h} fill={color} opacity="0.82" />
      <rect width={w} height={h} fill={`url(#wp${pid})`} />
      <rect width={w} height={h} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </svg>
  );
}

// ── Paperclip ────────────────────────────────────────────────
export function Paperclip({ color = '#cf8466', size = 34, style = {} }) {
  return (
    <svg width={size} height={size * 1.7} viewBox="0 0 20 34" fill="none"
         style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))', ...style }}>
      <path d="M14 8v16a4 4 0 01-8 0V6a3 3 0 016 0v16a2 2 0 01-4 0V9"
            stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Heart (favorite) ─────────────────────────────────────────
export function Heart({ filled = false, size = 22, color = SK.pinkD }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         fill={filled ? color : 'none'} stroke={color} strokeWidth="2.2"
         strokeLinejoin="round" style={{ transition: 'transform .15s' }}>
      <path d="M12 21s-7.5-4.7-9.7-9C.7 8.7 2 5 5.4 5c2 0 3.3 1.2 4 2.4l.6 1 .6-1c.7-1.2 2-2.4 4-2.4 3.4 0 4.7 3.7 2.5 7-1.8 4.3-9.7 9-9.7 9z" />
    </svg>
  );
}

// ── Paper background with dotted-grid texture ────────────────
export function paperBg(variant = 'dots') {
  const grid = variant === 'lines'
    ? `repeating-linear-gradient(${SK.line}55 0 1px, transparent 1px 28px)`
    : variant === 'blank'
      ? 'none'
      : `radial-gradient(${SK.line}66 1.4px, transparent 1.5px)`;
  return {
    backgroundColor: SK.paper,
    backgroundImage: grid,
    backgroundSize: variant === 'dots' ? '22px 22px' : 'auto',
  };
}

// shared little button style
export const miniBtn = {
  border: 'none', borderRadius: 9, padding: '4px 12px', color: '#fff',
  fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15, cursor: 'pointer',
};

// pill + outline action buttons (Gallery toolbar, Thoughts select bar)
export function pillBtn(bg) {
  return {
    border: 'none', borderRadius: 20, padding: '7px 16px',
    background: bg, color: '#fff', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

export const outlineBtn = {
  borderRadius: 20, padding: '7px 16px',
  background: 'transparent', color: SK.ink,
  fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15,
  cursor: 'pointer', whiteSpace: 'nowrap',
  border: `2px solid ${SK.border}`,
};

// ── floating "+" button above the tab bar ────────────────────
export function Fab({ onClick, color, label = 'add' }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      position: 'fixed', right: 18, bottom: 92, width: 60, height: 60, borderRadius: '50%',
      background: color, color: '#fff', border: '3px solid #fff', cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(86,70,58,0.3)', fontFamily: SK_FONT.hand, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 36, fontSize: 34,
    }}>
      <span style={{ marginTop: -4 }}>+</span>
    </button>
  );
}

// ── click-and-hold gesture ───────────────────────────────────
// Returns [props, firedRef]. Spread `props` on the element; in its onClick,
// check-and-reset firedRef.current so the click that lands after the hold
// fires doesn't also act. Movement past 10px (scrolling) cancels the hold.
export function useLongPress(onHold, ms = 450) {
  const timer = React.useRef(null);
  const origin = React.useRef(null);
  const fired = React.useRef(false);
  const cb = React.useRef(onHold);
  cb.current = onHold;
  const stop = () => { clearTimeout(timer.current); timer.current = null; origin.current = null; };
  const props = {
    onPointerDown: (e) => {
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { fired.current = true; cb.current(); }, ms);
    },
    onPointerMove: (e) => {
      if (!origin.current) return;
      if (Math.abs(e.clientX - origin.current.x) > 10 || Math.abs(e.clientY - origin.current.y) > 10) stop();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onContextMenu: (e) => e.preventDefault(),
  };
  return [props, fired];
}

// ── filter chip (Thoughts tag rail, Gallery filters) ─────────
export function Chip({ children, active, onClick, color, dashed }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
      border: dashed ? `2px dashed ${color}` : `2px solid ${color}`,
      background: active ? color : 'transparent',
      color: active ? '#fff' : SK.ink, fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15,
      whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

// ── drag-down-to-dismiss for sheets & viewers ────────────────
// Attach `ref` to the element that should follow the finger and spread `style`
// onto it. Uses native listeners because React's delegated touch handlers are
// passive, so a synthetic preventDefault() can't stop the page from scrolling.
export function useDragDismiss({ onDismiss, canStart, threshold = 90 } = {}) {
  const ref = React.useRef(null);
  const [dy, setDy] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const st = React.useRef(null);
  const dyRef = React.useRef(0);
  const cbs = React.useRef({});
  cbs.current = { onDismiss, canStart, threshold };

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Internal scrolling wins: only allow a dismiss drag when nothing between
    // the touch target and the element is scrolled down, and the touch didn't
    // land on a text field (those need their own gestures).
    const okToStart = (target) => {
      if (cbs.current.canStart && cbs.current.canStart(target) === false) return false;
      let node = target;
      while (node && node.nodeType === 1) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)) return false;
        if (node.scrollTop > 0) return false;
        if (node === el) break;
        node = node.parentElement;
      }
      return true;
    };

    const begin = (x, y, target) => { st.current = { x, y, decided: false, active: false, ok: okToStart(target) }; };
    const move = (x, y, ev) => {
      const s = st.current; if (!s) return;
      const dx = x - s.x, d = y - s.y;
      if (!s.decided) {
        if (Math.abs(dx) < 6 && Math.abs(d) < 6) return;
        s.decided = true;
        s.active = s.ok && d > 0 && Math.abs(d) > Math.abs(dx);
        if (s.active) setDragging(true);
      }
      if (!s.active) return;
      if (ev.cancelable) ev.preventDefault();
      dyRef.current = Math.max(0, d);
      setDy(dyRef.current);
    };
    const end = () => {
      const s = st.current; st.current = null;
      if (!s || !s.active) return;
      setDragging(false);
      if (dyRef.current > cbs.current.threshold) {
        setLeaving(true);
        setTimeout(() => cbs.current.onDismiss && cbs.current.onDismiss(), 220);
      } else {
        dyRef.current = 0;
        setDy(0);
      }
    };

    const onTouchStart = (e) => { const t = e.touches[0]; begin(t.clientX, t.clientY, e.target); };
    const onTouchMove = (e) => { const t = e.touches[0]; move(t.clientX, t.clientY, e); };
    const onMouseDown = (e) => {
      begin(e.clientX, e.clientY, e.target);
      const mm = (ev) => move(ev.clientX, ev.clientY, ev);
      const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); end(); };
      window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    };
    // images inside the panel would otherwise start a native drag and swallow
    // the mousemove stream before our gesture gets going
    const onDragStart = (e) => e.preventDefault();
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('dragstart', onDragStart);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, []);

  const style = {
    transform: leaving ? 'translateY(110%)' : (dy ? `translateY(${dy}px)` : 'none'),
    transition: dragging ? 'none' : (leaving ? 'transform .22s ease-in' : 'transform .25s cubic-bezier(.4,0,.2,1)'),
  };
  return { ref, style, leaving };
}

// ── bottom sheet (viewer/editor overlay) ─────────────────────
export function Sheet({ children, onClose, title }) {
  const backdropRef = React.useRef(null);
  const { ref: panelRef, style: dragStyle } = useDragDismiss({ onDismiss: onClose });

  React.useEffect(() => {
    const backdrop = backdropRef.current;
    // Non-passive touchmove listener is the only safe way to prevent iOS scroll-through.
    // We intentionally avoid touching overflow/style on any ancestor — setting the
    // `overflow` shorthand on a React-controlled element wipes the `overflowY` longhand
    // and is never fully restored on cleanup, which breaks scroll and collapses the layout.
    // Touches inside the panel are exempt so its own content can still scroll.
    const prevent = (e) => { if (!panelRef.current || !panelRef.current.contains(e.target)) e.preventDefault(); };
    backdrop.addEventListener('touchmove', prevent, { passive: false });
    return () => backdrop.removeEventListener('touchmove', prevent);
  }, []);

  return (
    <div ref={backdropRef} onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(86,70,58,0.32)',
      display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(1.5px)',
    }}>
      <div ref={panelRef} onClick={e => e.stopPropagation()} style={{
        width: '100%', boxSizing: 'border-box', maxHeight: '86%', overflowY: 'auto',
        overscrollBehavior: 'contain', background: SK.paper,
        borderRadius: '24px 24px 0 0', border: `3px solid ${SK.border}`, borderBottom: 'none',
        padding: '14px 18px calc(20px + env(safe-area-inset-bottom))',
        ...dragStyle,
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 4, background: SK.line, margin: '0 auto 12px' }} />
        <div style={{ fontFamily: SK_FONT.script, fontSize: 28, fontWeight: 700, color: SK.ink, textAlign: 'center', marginBottom: 12 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
