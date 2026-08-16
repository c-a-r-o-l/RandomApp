import React from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SK, SK_FONT, useStored, paperBg } from './ui.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } from './TweaksPanel.jsx';
import { Home, HomeStats } from './Home.jsx';
import { Thoughts } from './Thoughts.jsx';
import { Gallery } from './Gallery.jsx';
import { Scrapbook } from './Scrapbook.jsx';
import { LoginScreen } from './LoginScreen.jsx';
import { auth } from './data/firebase.js';
import { subscribeThoughts } from './data/thoughts.js';
import { subscribePhotos } from './data/photos.js';
import { subscribeSettings, saveSetting } from './data/settings.js';

const DEFAULT_TAGS = [
  { id: 't_love',   name: 'Important',        color: '#7c9560' },
  { id: 't_likes',  name: 'About him',        color: '#cf8466' },
  { id: 't_date',   name: 'Memory',           color: '#7fa6ac' },
  { id: 't_gift',   name: 'Random thoughts',  color: '#b89bd1' },
  { id: 't_crash',  name: 'Appreciation',     color: '#df9a9a' },
  { id: 't_random', name: 'Ideas',            color: '#a9794f' },
];


const SETTING_DEFAULTS = {
  startISO: '2024-01-01T12:00:00',
  metISO: '2023-12-01T12:00:00',
  tags: DEFAULT_TAGS,
  countdowns: [],
  hiddenToken: '!hidden!',
};

// Firestore-synced settings. Firestore is the source of truth; localStorage is
// the first-paint cache and the one-time migration source for pre-sync devices.
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem('ss_' + key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeLocal(key, val) {
  try { localStorage.setItem('ss_' + key, JSON.stringify(val)); } catch (e) {}
}

function useSyncedSettings() {
  const [settings, setSettings] = React.useState(() => {
    const init = {};
    Object.keys(SETTING_DEFAULTS).forEach(k => { init[k] = readLocal(k, SETTING_DEFAULTS[k]); });
    return init;
  });
  const cur = React.useRef(settings);
  const migrated = React.useRef(false);
  React.useEffect(() => subscribeSettings(remote => {
    const present = {}, missing = [];
    Object.keys(SETTING_DEFAULTS).forEach(k => {
      if (remote && remote[k] !== undefined) present[k] = remote[k];
      else missing.push(k);
    });
    if (Object.keys(present).length) {
      cur.current = { ...cur.current, ...present };
      setSettings(cur.current);
      Object.keys(present).forEach(k => writeLocal(k, present[k]));
    }
    if (missing.length && !migrated.current) {
      migrated.current = true;
      missing.forEach(k => saveSetting(k, cur.current[k]));
    }
  }), []);
  const set = React.useCallback((key, value) => {
    const v = typeof value === 'function' ? value(cur.current[key]) : value;
    cur.current = { ...cur.current, [key]: v };
    setSettings(cur.current);
    writeLocal(key, v);
    saveSetting(key, v);
  }, []);
  return [settings, set];
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeStyle": "card",
  "accent": "#cf8466",
  "paper": "dots",
  "mascot": true
}/*EDITMODE-END*/;

const TABS = [
  { id: 'home',      label: 'home',      title: 'secret sketchbook' },
  { id: 'scrapbook', label: 'scrapbook', title: 'scrapbook' },
  { id: 'thoughts',  label: 'thoughts',  title: 'thoughts' },
  { id: 'photos',    label: 'photos',    title: 'photos' },
];

function TabIcon({ id, active, color }) {
  const c = active ? color : SK.inkSoft;
  const sw = 2.2;
  const p = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="25" height="25" viewBox="0 0 24 24">
      {id === 'home' && <path d="M4 11l8-6 8 6M6 10v9h12v-9" {...p} />}
      {id === 'scrapbook' && <g {...p}><path d="M12 6v13" /><path d="M12 6C10 4.5 7 4.5 4 5v13c3-.5 6-.5 8 1 2-1.5 5-1.5 8-1V5c-3-.5-6-.5-8 1z" /></g>}
      {id === 'thoughts' && <g {...p}><rect x="5" y="4" width="14" height="16" rx="2.5" /><path d="M8.5 9h7M8.5 13h7M8.5 17h4" /></g>}
      {id === 'photos' && <g {...p}><rect x="4" y="5" width="16" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" /></g>}
    </svg>
  );
}

function TabBar({ tab, setTab, accent }) {
  return (
    <div style={{
      display: 'flex', borderTop: `3px solid ${SK.border}`, background: SK.card,
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: 8, position: 'relative', zIndex: 35,
    }}>
      {TABS.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '2px 0',
          }}>
            <div style={{
              padding: '3px 8px', borderRadius: 13,
              background: active ? accent + '22' : 'transparent', transition: 'background .15s',
            }}>
              <TabIcon id={t.id} active={active} color={accent} />
            </div>
            <span style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 12, color: active ? accent : SK.inkSoft }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ title, onLogout }) {
  return (
    <div style={{
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 8, paddingLeft: 18, paddingRight: 16,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      position: 'relative', zIndex: 6, ...paperBg(), backgroundColor: SK.paper,
      borderBottom: `3px solid ${SK.border}`,
    }}>
      <div style={{ fontFamily: SK_FONT.script, fontSize: 26, fontWeight: 700, color: SK.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>{title}</div>
      <button onClick={onLogout} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        fontFamily: SK_FONT.hand, fontSize: 12, color: SK.inkSoft, lineHeight: 1,
      }}>bye~</button>
    </div>
  );
}


function AuthedApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useStored('tab', 'home');
  const [synced, setSynced] = useSyncedSettings();
  const { startISO, metISO, tags, countdowns, hiddenToken } = synced;
  const setStart = v => setSynced('startISO', v);
  const setMet = v => setSynced('metISO', v);
  const setTags = v => setSynced('tags', v);
  const setCountdowns = v => setSynced('countdowns', v);
  const setHiddenToken = v => setSynced('hiddenToken', v);
  const [thoughts, setThoughtsLocal] = React.useState([]);
  React.useEffect(() => subscribeThoughts(setThoughtsLocal), []);
  const [photos, setPhotosLocal] = React.useState([]);
  React.useEffect(() => subscribePhotos(setPhotosLocal), []);

  const accent = t.accent;
  const go = (id) => setTab(id);

  const data = {
    startISO, setStart, metISO, setMet, thoughts, tags, setTags,
    countdowns, setCountdowns, hiddenToken, setHiddenToken, photos, go,
    accent, mascot: t.mascot, homeStyle: t.homeStyle,
  };

  const cur = TABS.find(x => x.id === tab);

  return (
    <React.Fragment>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', ...paperBg(t.paper), backgroundColor: SK.paper }}>
        <TopBar title={cur.title} onLogout={() => signOut(auth)} />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
          {tab === 'home' && (
            <div style={{ position: 'relative' }}>
              <Home data={data} />
              <HomeStats data={data} />
            </div>
          )}
          {tab === 'scrapbook' && (
            <div style={{ position: 'relative', height: '100%' }}>
              <Scrapbook data={data} />
            </div>
          )}
          {tab === 'thoughts' && <Thoughts data={data} />}
          {tab === 'photos' && <Gallery data={data} kind="photos" />}
        </div>
        <TabBar tab={tab} setTab={setTab} accent={accent} />
      </div>

      <TweaksPanel>
        <TweakSection label="Home screen" />
        <TweakRadio label="Layout" value={t.homeStyle} options={['card', 'scrapbook', 'journal']}
                    onChange={v => setTweak('homeStyle', v)} />
        <TweakSection label="Look & feel" />
        <TweakColor label="Accent" value={t.accent}
                    options={['#cf8466', '#7c9560', '#df9a9a', '#a9794f', '#7fa6ac']}
                    onChange={v => setTweak('accent', v)} />
        <TweakRadio label="Paper" value={t.paper} options={['dots', 'lines', 'blank']}
                    onChange={v => setTweak('paper', v)} />
        <TweakToggle label="Squirrel mascot" value={t.mascot} onChange={v => setTweak('mascot', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

export default function App() {
  // undefined = loading, null = signed out, object = signed in
  const [authUser, setAuthUser] = React.useState(undefined);
  React.useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  if (authUser === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(120% 90% at 15% 10%, #f7ead8 0%, transparent 55%), radial-gradient(120% 90% at 85% 90%, #ecefe0 0%, transparent 55%), #efe7d6',
        fontFamily: SK_FONT.hand, fontSize: 18, color: SK.inkSoft,
      }}>
        opening...
      </div>
    );
  }

  if (!authUser) return <LoginScreen />;

  return <AuthedApp />;
}
