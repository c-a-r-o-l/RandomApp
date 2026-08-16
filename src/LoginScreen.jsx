import React from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './data/firebase.js';
import { SK, SK_FONT, flatBox } from './ui.jsx';

export function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("hmm, that didn't work — try again? ♡");
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: '100%', padding: '10px 12px', background: SK.paper,
    fontFamily: SK_FONT.hand, fontSize: 16, color: SK.ink,
    ...flatBox(10, 2.5), outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(120% 90% at 15% 10%, #f7ead8 0%, transparent 55%), radial-gradient(120% 90% at 85% 90%, #ecefe0 0%, transparent 55%), #efe7d6',
      fontFamily: SK_FONT.hand,
    }}>
      <div style={{
        width: 300, padding: '32px 28px', background: SK.card,
        ...flatBox(18, 3),
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="5" y="5" width="34" height="34" rx="6" fill={SK.butter} stroke={SK.border} strokeWidth="2.5" />
          <path d="M22 7v30" stroke={SK.border} strokeWidth="2" />
          <path d="M11 14h7M11 20h7M11 26h5" stroke={SK.inkSoft} strokeWidth="2" strokeLinecap="round" />
          <path d="M26 14h7M26 20h7M26 26h5" stroke={SK.inkSoft} strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: SK_FONT.script, fontSize: 26, color: SK.ink, fontWeight: 700, lineHeight: 1.1 }}>
            secret sketchbook
          </div>
          <div style={{ fontSize: 14, color: SK.inkSoft, marginTop: 6 }}>just for us ♡</div>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={fieldStyle}
          />

          {error && (
            <div style={{ fontSize: 14, color: SK.peachD, textAlign: 'center', lineHeight: 1.4 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: '12px', background: SK.peachD, color: '#fff',
              fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 18,
              ...flatBox(12, 2.5), cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
            }}
          >
            {loading ? 'opening...' : 'log in ♡'}
          </button>
        </form>
      </div>
    </div>
  );
}
