import React from 'react';
import { SK, SK_FONT, uid, toDateInput, dateInputToTs, Squirrel, miniBtn, Heart, Sheet, Chip, Fab, useLongPress, pillBtn, outlineBtn } from './ui.jsx';
import {
  saveThought, deleteThought,
  togglePin, toggleScrapbook, setHidden,
  removeTagFromThoughts, stripHiddenToken, DEFAULT_HIDDEN_TOKEN,
} from './data/thoughts.js';

export const NOTE_COLORS = ['#fbf7ec', '#eaf0e0', '#fbe6dd', '#fbe2e2', '#e6eef0', '#f6e7c6'];

const fmtNoteDate = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function Thoughts({ data }) {
  const { thoughts, tags, setTags, accent, hiddenToken, setHiddenToken } = data;
  const token = (hiddenToken || DEFAULT_HIDDEN_TOKEN).trim();
  const [filter, setFilter] = React.useState('all');
  const [editing, setEditing] = React.useState(null);
  const [viewing, setViewing] = React.useState(null);
  const [manageTags, setManageTags] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteResult, setDeleteResult] = React.useState(null);

  const tagById = id => tags.find(t => t.id === id);

  const revealHidden = query.trim().toLowerCase() === token.toLowerCase();
  // strict date order, newest first — mirrors the photo grid (pinned notes live in the ♡ filter)
  let list = thoughts.slice().sort((a, b) => b.created - a.created);
  if (revealHidden) {
    list = list.filter(t => t.hidden);
  } else {
    list = list.filter(t => !t.hidden);
    if (filter === 'fav') list = list.filter(t => t.pin);
    else if (filter !== 'all') list = list.filter(t => (t.tags || []).includes(filter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t => (t.title + ' ' + t.body).toLowerCase().includes(q));
    }
  }

  // close the sheet immediately and let Firestore sync in the background —
  // awaiting here leaves a stuck invisible backdrop if the write never resolves
  const save = (note) => {
    saveThought(note, token).catch(err => console.error('saveThought failed:', err));
    setEditing(null);
  };
  const del = (id) => {
    deleteThought(id).catch(err => console.error('deleteThought failed:', err));
    setEditing(null);
  };
  const newNote = () => setEditing({ id: uid(), title: '', body: '', tags: [], pin: false, color: NOTE_COLORS[0], created: Date.now() });

  const enterSelectMode = (id) => { setSelectMode(true); setSelected(new Set(id != null ? [id] : [])); setDeleteResult(null); };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmDelete(false);
    setDeleting(false);
    setDeleteResult(null);
  };
  const toggleSelect = id => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAll = () => setSelected(new Set(list.map(n => n.id)));
  const deselectAll = () => setSelected(new Set());

  const bulkDelete = async () => {
    const ids = [...selected];
    setDeleting(true);
    const failedIds = [];
    await Promise.all(ids.map(async id => {
      try { await deleteThought(id); }
      catch (err) { failedIds.push(id); console.error('bulk delete failed:', id, err); }
    }));
    setDeleting(false);
    if (failedIds.length === 0) {
      exitSelectMode();
    } else {
      setDeleteResult({ deleted: ids.length - failedIds.length, failedCount: failedIds.length });
      setSelected(new Set(failedIds));
      setConfirmDelete(false);
    }
  };

  return (
    <div style={{ padding: '4px 14px 96px' }}>
      {/* toolbar — hold a note to start selecting */}
      {!selectMode ? (
        <React.Fragment>
          {/* search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="search your thoughts…"
                   style={{
                     width: '100%', boxSizing: 'border-box', padding: '9px 14px', borderRadius: 13,
                     border: `2px solid ${SK.line}`, background: SK.card, color: SK.ink,
                     fontFamily: SK_FONT.hand, fontSize: 16, outline: 'none',
                   }} />
          </div>
          {/* tag filter rail */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
            <Chip active={filter === 'all'} onClick={() => setFilter('all')} color={SK.walnut}>all</Chip>
            <Chip active={filter === 'fav'} onClick={() => setFilter('fav')} color={SK.pinkD}>♡ pinned</Chip>
            {tags.map(t => (
              <Chip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} color={t.color}>{t.name}</Chip>
            ))}
            <Chip active={false} onClick={() => setManageTags(true)} color={SK.inkSoft} dashed>✎ tags</Chip>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <button onClick={exitSelectMode} style={outlineBtn}>✕ cancel</button>
          <span style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink, flexShrink: 0 }}>
            {selected.size} selected
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={selected.size === list.length ? deselectAll : selectAll}
            style={outlineBtn}
          >
            {selected.size === list.length ? 'none' : 'all'}
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              style={pillBtn(SK.pinkD)}
            >
              delete {selected.size}
            </button>
          )}
        </div>
      )}

      {/* delete confirmation banner */}
      {confirmDelete && (
        <div style={{ marginBottom: 12, padding: '12px 14px', background: SK.card, borderRadius: 12, border: `2px solid ${SK.pinkD}` }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 16, color: SK.ink, marginBottom: 10 }}>
            Delete {selected.size} thought{selected.size !== 1 ? 's' : ''}? This can't be undone.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={bulkDelete} disabled={deleting} style={pillBtn(SK.pinkD)}>
              {deleting ? 'deleting…' : `Delete ${selected.size}`}
            </button>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={outlineBtn}>
              cancel
            </button>
          </div>
        </div>
      )}

      {/* partial failure notice */}
      {deleteResult && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: SK.card, borderRadius: 12, border: `2px solid ${SK.pinkD}` }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink }}>
            {deleteResult.deleted > 0 && `${deleteResult.deleted} deleted. `}
            {deleteResult.failedCount} couldn't be removed — check your connection and try again.
          </div>
          <button
            onClick={() => setDeleteResult(null)}
            style={{ marginTop: 6, background: 'none', border: 'none', fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, cursor: 'pointer', padding: 0 }}
          >
            dismiss
          </button>
        </div>
      )}

      {revealHidden && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.peachD, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>🙈 hidden thoughts</div>
          <HiddenTokenEditor token={token} onChange={t => { setHiddenToken(t); setQuery(t); }} />
        </div>
      )}
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', fontFamily: SK_FONT.hand, fontSize: 18, color: SK.inkSoft }}>
          <div style={{ marginBottom: 8 }}><Squirrel size={88} /></div>
          {revealHidden ? 'nothing hidden away in here' : (thoughts.length === 0 ? 'nothing here yet — pour out your first thought of him ♡' : 'no thoughts match this filter')}
        </div>
      ) : (
        <div style={{ columns: 2, columnGap: 10 }}>
          {list.map(n => (
            <NoteCard key={n.id} n={n} tags={tags} tagById={tagById} onClick={() => setViewing(n)}
                      onPin={() => togglePin(n.id, n.pin)}
                      selectMode={selectMode}
                      isSelected={selected.has(n.id)}
                      onSelect={() => toggleSelect(n.id)}
                      onHold={() => selectMode ? toggleSelect(n.id) : enterSelectMode(n.id)} />
          ))}
        </div>
      )}

      {!selectMode && <Fab color={accent} onClick={newNote} label="new thought" />}

      {viewing && !editing && !selectMode && (() => {
        const liveNote = thoughts.find(x => x.id === viewing.id) || viewing;
        return (
          <NoteViewer note={liveNote} tags={tags} tagById={tagById}
                      onEdit={() => setEditing(viewing)} onClose={() => setViewing(null)}
                      onPin={() => togglePin(liveNote.id, liveNote.pin)}
                      onHide={() => setHidden(liveNote.id, !liveNote.hidden)}
                      onScrap={() => toggleScrapbook(liveNote.id, liveNote.scrap)} />
        );
      })()}
      {editing && <NoteEditor note={editing} tags={tags} setTags={setTags} hiddenToken={token} onSave={(nt) => { save(nt); setViewing(null); }} onDelete={(id) => { del(id); setViewing(null); }} onClose={() => setEditing(null)} />}
      {manageTags && <TagManager tags={tags} setTags={setTags} thoughts={thoughts} onClose={() => setManageTags(false)} />}
    </div>
  );
}

function NoteCard({ n, tags, tagById, onClick, onPin, selectMode, isSelected, onSelect, onHold }) {
  const noteTags = (n.tags || []).map(tagById).filter(Boolean);
  const [holdProps, holdFired] = useLongPress(onHold);
  const handleClick = () => {
    if (holdFired.current) { holdFired.current = false; return; }
    (selectMode ? onSelect : onClick)();
  };
  return (
    <div {...holdProps} onClick={handleClick} style={{
      breakInside: 'avoid', marginBottom: 10, background: n.color || NOTE_COLORS[0],
      border: `3px solid ${isSelected ? SK.walnut : SK.border}`, borderRadius: 12, padding: '11px 12px 12px',
      cursor: 'pointer', position: 'relative',
      boxShadow: isSelected ? `0 0 0 2px ${SK.walnut}` : undefined,
      userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
    }}>
      {selectMode ? (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 4,
          width: 22, height: 22, borderRadius: '50%',
          border: `2.5px solid ${SK.walnut}`,
          background: isSelected ? SK.walnut : 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isSelected && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
        </div>
      ) : (
        <button onClick={e => { e.stopPropagation(); onPin(); }} aria-label="pin"
                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart filled={n.pin} size={18} color={SK.pinkD} />
        </button>
      )}
      {n.title && <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 17, color: SK.ink, lineHeight: 1.15, paddingRight: 20, marginBottom: 3 }}>{n.title}</div>}
      {n.body && <div style={{ fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink, opacity: 0.9, lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: n.title ? 7 : 8, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {n.scrap && <span title="in sketchbook" style={{ fontSize: 13 }}>📖</span>}
        {noteTags.map(t => (
          <span key={t.id} style={{ fontFamily: SK_FONT.hand, fontSize: 12, fontWeight: 700, padding: '1px 8px', borderRadius: 10, background: t.color, color: '#fff' }}>{t.name}</span>
        ))}
      </div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 12, color: SK.inkSoft, marginTop: 6 }}>{fmtNoteDate(n.created)}</div>
    </div>
  );
}

export function ScrapToggle({ on, set }) {
  return (
    <button onClick={() => set(!on)} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box',
      padding: '9px 13px', marginBottom: 12, cursor: 'pointer', textAlign: 'left',
      borderRadius: 12, border: `2px solid ${on ? SK.sage : SK.line}`,
      background: on ? SK.sage + '22' : 'transparent',
    }}>
      <span style={{ fontSize: 20 }}>📖</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 16, color: SK.ink }}>add to sketchbook</div>
        <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft }}>show this in the scrapbook pages</div>
      </div>
      <div style={{ width: 44, height: 26, borderRadius: 14, background: on ? SK.sageD : SK.line, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </div>
    </button>
  );
}

export function NoteViewer({ note, tags, tagById, onEdit, onClose, onPin, onScrap, onHide }) {
  const noteTags = (note.tags || []).map(tagById).filter(Boolean);
  return (
    <Sheet onClose={onClose} title={note.title || 'a thought ♡'}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: -6, marginBottom: 10, flexWrap: 'wrap' }}>
        <button onClick={onPin} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink }}>
          <Heart filled={note.pin} size={18} /> {note.pin ? 'pinned' : 'pin'}
        </button>
        <button onClick={onScrap} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SK_FONT.hand, fontSize: 15, color: note.scrap ? SK.sageD : SK.inkSoft }}>
          📖 {note.scrap ? 'in sketchbook' : 'not in sketchbook'}
        </button>
        {note.hidden && (
          <button onClick={onHide} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SK_FONT.hand, fontSize: 15, color: SK.peachD }}>
            🙈 hidden · unhide
          </button>
        )}
      </div>
      <div style={{
        background: note.color || NOTE_COLORS[0], border: `3px solid ${SK.border}`, borderRadius: 14,
        padding: '14px 15px', maxHeight: '46vh', overflowY: 'auto',
        fontFamily: SK_FONT.hand, fontSize: 18, color: SK.ink, lineHeight: 1.4,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>{note.body || <span style={{ color: SK.inkSoft }}>(no words yet)</span>}</div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, textAlign: 'center', marginTop: 8 }}>written {fmtNoteDate(note.created)}</div>
      {noteTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {noteTags.map(t => (
            <span key={t.id} style={{ fontFamily: SK_FONT.hand, fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 12, background: t.color, color: '#fff' }}>{t.name}</span>
          ))}
        </div>
      )}
      <button onClick={onEdit} style={{ ...miniBtn, background: SK.sageD, width: '100%', padding: '10px', marginTop: 14, fontSize: 17 }}>✎ edit this thought</button>
    </Sheet>
  );
}

function HiddenTokenEditor({ token, onChange }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(token);
  if (!editing) {
    return (
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => { setVal(token); setEditing(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft }}>
          ✎ change my secret word
        </button>
      </div>
    );
  }
  const commit = () => {
    const t = val.trim();
    if (t) onChange(t);
    setEditing(false);
  };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()}
             placeholder="new secret word" style={{ ...editInput(false), width: 170, marginBottom: 0, padding: '5px 10px', fontSize: 14 }} />
      <button onClick={commit} style={{ ...miniBtn, background: SK.sage }}>save</button>
      <button onClick={() => setEditing(false)} style={{ ...miniBtn, background: 'transparent', color: SK.inkSoft, border: `2px solid ${SK.line}` }}>cancel</button>
    </div>
  );
}

function NoteEditor({ note, tags, setTags, hiddenToken, onSave, onDelete, onClose }) {
  const [title, setTitle] = React.useState(note.title);
  const [body, setBody] = React.useState(note.body);
  const [sel, setSel] = React.useState(note.tags || []);
  const [color, setColor] = React.useState(note.color || NOTE_COLORS[0]);
  const [scrap, setScrap] = React.useState(!!note.scrap);
  const [created, setCreated] = React.useState(note.created || Date.now());
  const [newTag, setNewTag] = React.useState('');
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const addTag = () => {
    const name = newTag.trim(); if (!name) return;
    const t = { id: uid(), name, color: SK_PALETTE_PICK(tags.length) };
    setTags(prev => [...prev, t]); setSel(s => [...s, t.id]); setNewTag('');
  };
  const commit = () => {
    const { title: t2, body: b2, tokenFound } = stripHiddenToken(title, body, hiddenToken);
    if (!t2 && !b2) { onDelete(note.id); return; }
    onSave({ ...note, title: t2, body: b2, tags: sel, color, scrap, created, hidden: tokenFound ? true : !!note.hidden });
  };
  return (
    <Sheet onClose={commit} title="a thought ♡">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="title (optional)"
             style={editInput(true)} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="write everything…" rows={6}
                style={{ ...editInput(false), resize: 'none', lineHeight: 1.35 }} />
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, margin: '4px 0 6px' }}>tags</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <button key={t.id} onClick={() => toggle(t.id)} style={{
            padding: '4px 11px', borderRadius: 16, cursor: 'pointer', fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 14,
            border: `2px solid ${t.color}`, background: sel.includes(t.id) ? t.color : 'transparent',
            color: sel.includes(t.id) ? '#fff' : SK.ink,
          }}>{t.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
               placeholder="+ new tag" style={{ ...editInput(false), flex: 1, padding: '6px 12px' }} />
        <button onClick={addTag} style={{ ...miniBtn, background: SK.sage }}>add</button>
      </div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, marginBottom: 6 }}>paper colour</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {NOTE_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
            border: color === c ? `3px solid ${SK.ink}` : `2px solid ${SK.line}`,
          }} />
        ))}
      </div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, marginBottom: 6 }}>date</div>
      <input type="date" value={toDateInput(created)} max={toDateInput(Date.now())}
             onChange={e => setCreated(dateInputToTs(e.target.value, created))}
             style={{ ...editInput(false), marginBottom: 14, colorScheme: 'light' }} />
      <ScrapToggle on={scrap} set={setScrap} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onDelete(note.id)} style={{ ...miniBtn, background: 'transparent', color: SK.pinkD, border: `2px solid ${SK.pink}`, flex: '0 0 auto' }}>delete</button>
        <button onClick={commit} style={{ ...miniBtn, background: SK.sageD, flex: 1, padding: '8px' }}>keep it ♡</button>
      </div>
    </Sheet>
  );
}

function TagManager({ tags, setTags, thoughts, onClose }) {
  const [adding, setAdding] = React.useState('');
  const rename = (id, name) => setTags(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  const recolor = (id, color) => setTags(prev => prev.map(t => t.id === id ? { ...t, color } : t));
  const remove = (id) => {
    setTags(prev => prev.filter(t => t.id !== id));
    removeTagFromThoughts(id, thoughts);
  };
  const add = () => {
    const name = adding.trim(); if (!name) return;
    setTags(prev => [...prev, { id: uid(), name, color: SK_PALETTE_PICK(tags.length) }]);
    setAdding('');
  };
  const swatches = [SK.sageD, SK.peachD, SK.pinkD, SK.walnut, SK.sky, SK.butter, '#b89bd1', '#88b0a6'];
  return (
    <Sheet onClose={onClose} title="my tags ✎">
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft, marginBottom: 10 }}>
        rename, recolour or delete — they're yours to change anytime.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {tags.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input value={t.name} onChange={e => rename(t.id, e.target.value)}
                   style={{ ...editInput(false), flex: 1, padding: '6px 10px', fontWeight: 700 }} />
            <div style={{ display: 'flex', gap: 3 }}>
              {swatches.slice(0, 5).map(c => (
                <button key={c} onClick={() => recolor(t.id, c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: t.color === c ? `2.5px solid ${SK.ink}` : 'none' }} />
              ))}
            </div>
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SK.pinkD, fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 18 }}>×</button>
          </div>
        ))}
        {tags.length === 0 && <div style={{ fontFamily: SK_FONT.hand, color: SK.inkSoft }}>no tags yet</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
               placeholder="+ new tag name" style={{ ...editInput(false), flex: 1, padding: '7px 12px' }} />
        <button onClick={add} style={{ ...miniBtn, background: SK.sage }}>add</button>
      </div>
    </Sheet>
  );
}

export function SK_PALETTE_PICK(i) {
  const cs = [SK.sageD, SK.peachD, SK.pinkD, SK.walnut, SK.sky, '#b89bd1', '#88b0a6', SK.butter];
  return cs[i % cs.length];
}

export function editInput(bold) {
  return {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px', marginBottom: 8,
    border: `2px solid ${SK.line}`, borderRadius: 11, background: '#fff', color: SK.ink,
    fontFamily: SK_FONT.hand, fontWeight: bold ? 700 : 400, fontSize: bold ? 19 : 16, outline: 'none',
  };
}
