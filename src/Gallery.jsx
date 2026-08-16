import React from 'react';
import { SK, SK_FONT, uid, toDateInput, dateInputToTs, Squirrel, Washi, Heart, useDragDismiss, useLongPress, Chip, Fab, pillBtn, outlineBtn } from './ui.jsx';
import { addPhoto, deletePhoto, toggleFavorite, toggleScrapbook, updatePhoto, setCreatedDate } from './data/photos.js';

function useColCount() {
  const get = () => window.innerWidth < 500 ? 2 : 3;
  const [cols, setCols] = React.useState(get);
  React.useEffect(() => {
    const upd = () => setCols(get());
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return cols;
}

// Stripe item[i] into column (i % numCols) so dates stay roughly aligned
// across columns. items must be sorted newest-first.
function buildColumns(items, numCols) {
  const cols = Array.from({ length: numCols }, () => []);
  items.forEach((item, i) => cols[i % numCols].push(item));
  return cols;
}

function rotFor(id) {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  return ((h % 9) - 4);
}
const fmtPhotoDate = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Resize + JPEG-compress a File/Blob before upload (caps dimensions, reduces quality)
async function compressImage(file, maxPx = 1920, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else        { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

// Read EXIF DateTimeOriginal from a File. Returns ms timestamp or null.
async function readExifDate(file) {
  try {
    const exifr = (await import('exifr')).default;
    const result = await exifr.parse(file, ['DateTimeOriginal']);
    const d = result?.DateTimeOriginal;
    if (d instanceof Date && !isNaN(d.getTime())) return d.getTime();
  } catch (_) {}
  return null;
}

// Upload one photo with up to `maxRetries` automatic retries.
async function uploadWithRetry(id, blob, meta, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { await addPhoto(id, blob, meta); return true; } catch (_) {}
  }
  return false;
}

export function Gallery({ data }) {
  const { photos, accent } = data;
  const [filter, setFilter] = React.useState('all');
  const [viewing, setViewing] = React.useState(null);
  // progress: null while idle, { total, done, failed: string[] } while uploading
  const [progress, setProgress] = React.useState(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteResult, setDeleteResult] = React.useState(null);
  const fileRef = React.useRef(null);
  const numCols = useColCount();

  let list = photos.slice().sort((a, b) => b.created - a.created);
  if (filter === 'fav') list = list.filter(i => i.fav);
  const columns = buildColumns(list, numCols);

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
  const selectAll = () => setSelected(new Set(list.map(it => it.id)));
  const deselectAll = () => setSelected(new Set());

  const bulkDelete = async () => {
    const ids = [...selected];
    setDeleting(true);
    const failedIds = [];
    await Promise.all(ids.map(async id => {
      try { await deletePhoto(id); console.log('deleted photo from Firebase:', id); }
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

  const onFiles = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    if (!files.length) return;
    const total = files.length;
    let done = 0;
    const failed = [];
    setProgress({ total, done: 0, failed: [] });

    let qIdx = 0;
    const worker = async () => {
      while (qIdx < files.length) {
        const i = qIdx++;
        const file = files[i];
        const id = uid();
        let ok = false;
        try {
          // GIFs skip compression — canvas re-encoding would drop the animation
          const [exifTs, blob] = await Promise.all([
            readExifDate(file),
            file.type === 'image/gif' ? file : compressImage(file),
          ]);
          const captureDate = exifTs ?? Date.now();
          const meta = { created: captureDate, scrap: true, markedDate: exifTs ?? null };
          ok = await uploadWithRetry(id, blob, meta);
        } catch (_) {}
        if (!ok) failed.push(file.name);
        done++;
        setProgress({ total, done, failed: [...failed] });
      }
    };

    // 4 concurrent workers
    await Promise.all(Array.from({ length: Math.min(4, total) }, worker));

    if (failed.length === 0) {
      setTimeout(() => setProgress(null), 2000);
    }
    // if there were failures, leave progress visible so the user sees which ones
  };

  const toggleFav = it => toggleFavorite(it.id, it.fav).catch(err => console.error('toggleFav failed:', err));
  const toggleScrap = it => toggleScrapbook(it.id, it.scrap).catch(err => console.error('toggleScrap failed:', err));
  const del = it => {
    setViewing(null);
    deletePhoto(it.id).catch(err => console.error('deletePhoto failed:', err));
  };
  const setCaption = (it, caption) => updatePhoto(it.id, { caption }).catch(err => console.error('setCaption failed:', err));

  const fresh = it => list.find(x => x.id === it.id) || it;

  return (
    <div style={{ padding: '4px 14px 96px' }}>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />

      {/* toolbar — hold a photo to start selecting */}
      {!selectMode ? (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 12, overflowX: 'auto' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} color={SK.walnut}>all</Chip>
          <Chip active={filter === 'fav'} onClick={() => setFilter('fav')} color={SK.pinkD}>♡ favourites</Chip>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
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
              🗑 {selected.size}
            </button>
          )}
        </div>
      )}

      {/* delete confirmation banner */}
      {confirmDelete && (
        <div style={{ marginBottom: 12, padding: '12px 14px', background: SK.card, borderRadius: 12, border: `2px solid ${SK.pinkD}` }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 16, color: SK.ink, marginBottom: 10 }}>
            Delete {selected.size} photo{selected.size !== 1 ? 's' : ''}? This can't be undone.
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

      {progress && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: SK.card, borderRadius: 12, border: `2px solid ${SK.line}` }}>
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 16, color: SK.ink }}>
            {progress.done < progress.total
              ? `uploading ${progress.done} of ${progress.total} ♡`
              : progress.failed.length === 0
                ? 'all done ♡'
                : `done — ${progress.total - progress.failed.length} saved, ${progress.failed.length} failed`}
          </div>
          <div style={{ marginTop: 6, height: 6, borderRadius: 4, background: SK.line, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: progress.failed.length > 0 && progress.done === progress.total ? SK.pinkD : SK.sage,
              width: `${(progress.done / progress.total) * 100}%`,
              transition: 'width 0.25s',
            }} />
          </div>
          {progress.failed.length > 0 && progress.done === progress.total && (
            <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.pinkD, marginTop: 6 }}>
              failed: {progress.failed.join(', ')}
            </div>
          )}
          {progress.failed.length > 0 && progress.done === progress.total && (
            <button onClick={() => setProgress(null)} style={{ marginTop: 6, background: 'none', border: 'none', fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, cursor: 'pointer', padding: 0 }}>
              dismiss
            </button>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '46px 16px' }}>
          <Squirrel size={96} />
          <div style={{ fontFamily: SK_FONT.hand, fontSize: 18, color: SK.inkSoft, marginTop: 6 }}>
            no photos yet — add every single one of him ♡
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <button onClick={() => fileRef.current.click()} style={{ ...pillBtn(accent), fontSize: 17, padding: '8px 18px' }}>＋ add photos</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {col.map(it => (
                <PolaroidCard
                  key={it.id}
                  it={it}
                  onOpen={() => setViewing(it)}
                  onFav={() => toggleFav(it)}
                  selectMode={selectMode}
                  isSelected={selected.has(it.id)}
                  onSelect={() => toggleSelect(it.id)}
                  onHold={() => selectMode ? toggleSelect(it.id) : enterSelectMode(it.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!selectMode && <Fab color={accent} onClick={() => fileRef.current.click()} label="add photos" />}

      {viewing && !selectMode && (
        <Viewer
          it={fresh(viewing)}
          onClose={() => setViewing(null)}
          onFav={() => toggleFav(viewing)}
          onScrap={() => toggleScrap(viewing)}
          onDelete={() => del(viewing)}
          onCaption={c => setCaption(viewing, c)}
          onDate={ts => setCreatedDate(viewing.id, ts).catch(err => console.error('setDate failed:', err))}
        />
      )}
    </div>
  );
}

function PolaroidCard({ it, onOpen, onFav, selectMode, isSelected, onSelect, onHold }) {
  const tilt = rotFor(it.id);
  const [holdProps, holdFired] = useLongPress(onHold);
  const handleClick = () => {
    if (holdFired.current) { holdFired.current = false; return; }
    (selectMode ? onSelect : onOpen)();
  };
  return (
    <div {...holdProps} onClick={handleClick} style={{
      background: '#fff', padding: '8px 8px 10px', borderRadius: 3, cursor: 'pointer',
      border: `3px solid ${isSelected ? SK.walnut : SK.border}`,
      transform: `rotate(${tilt}deg)`,
      position: 'relative', width: '100%', boxSizing: 'border-box',
      boxShadow: isSelected ? `0 0 0 2px ${SK.walnut}` : undefined,
      userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
    }}>
      {/* washi pin */}
      <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%) rotate(' + (-tilt) + 'deg)', zIndex: 2 }}>
        <Washi color={SK.peach} w={52} h={18} rot={0} />
      </div>
      {/* select mode checkmark */}
      {selectMode && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 4,
          width: 22, height: 22, borderRadius: '50%',
          border: `2.5px solid ${SK.walnut}`,
          background: isSelected ? SK.walnut : 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isSelected && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
        </div>
      )}
      <div style={{ width: '100%', background: SK.paper2, borderRadius: 2, overflow: 'hidden' }}>
        <img src={it.src} alt="" loading="lazy" style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, paddingLeft: 3 }}>
        <span style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.ink, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {it.caption || ''}
        </span>
        {!selectMode && (
          <button onClick={e => { e.stopPropagation(); onFav(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <Heart filled={it.fav} size={18} />
          </button>
        )}
      </div>
      <div style={{ fontFamily: SK_FONT.hand, fontSize: 13, color: SK.inkSoft, textAlign: 'right', paddingRight: 3, marginTop: 1 }}>{fmtPhotoDate(it.created)}</div>
    </div>
  );
}

function Viewer({ it, onClose, onFav, onScrap, onDelete, onCaption, onDate }) {
  const [cap, setCap] = React.useState(it.caption || '');
  const backdropRef = React.useRef(null);
  const { ref: cardRef, style: dragStyle } = useDragDismiss({ onDismiss: onClose });

  React.useEffect(() => {
    const backdrop = backdropRef.current;
    // Non-passive touchmove listener is the only safe way to prevent iOS scroll-through.
    // We intentionally avoid touching overflow/style on any ancestor — setting the
    // `overflow` shorthand on a React-controlled element wipes the `overflowY` longhand
    // and is never fully restored on cleanup, which breaks scroll and collapses the layout.
    const prevent = e => e.preventDefault();
    backdrop.addEventListener('touchmove', prevent, { passive: false });
    return () => backdrop.removeEventListener('touchmove', prevent);
  }, []);

  return (
    <div ref={backdropRef} onClick={onClose} onWheel={e => e.stopPropagation()} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(56,44,36,0.78)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 18, backdropFilter: 'blur(2px)',
    }}>
      <div ref={cardRef} onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%', ...dragStyle }}>
        <div style={{ background: '#fff', padding: '12px 12px 14px', borderRadius: 4, border: `3px solid ${SK.border}`, maxWidth: '100%', transform: 'rotate(-1deg)' }}>
          <img src={it.src} alt="" style={{ maxWidth: '100%', maxHeight: '46vh', display: 'block', borderRadius: 2, background: SK.paper2 }} />
          <input value={cap} onChange={e => setCap(e.target.value)} onBlur={() => onCaption(cap)} placeholder="add a little caption…"
                 style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: `1.5px dashed ${SK.line}`, background: 'transparent', fontFamily: SK_FONT.hand, fontSize: 17, color: SK.ink, textAlign: 'center', marginTop: 8, padding: '4px 0', outline: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontFamily: SK_FONT.hand, fontSize: 14, color: SK.inkSoft }}>dated</span>
            <input type="date" value={toDateInput(it.created)} max={toDateInput(Date.now())}
                   onChange={e => onDate(dateInputToTs(e.target.value, it.created))}
                   style={{ border: `2px solid ${SK.line}`, borderRadius: 8, background: '#fff', fontFamily: SK_FONT.hand, fontSize: 15, color: SK.ink, padding: '3px 6px', outline: 'none', colorScheme: 'light' }} />
          </div>
        </div>
        <button onClick={onScrap} style={{
          marginTop: 14, padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
          border: `3px solid ${it.scrap ? SK.sage : 'rgba(255,255,255,0.5)'}`,
          background: it.scrap ? SK.sage : 'rgba(255,255,255,0.15)', color: '#fff',
          fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 15,
        }}>📖 {it.scrap ? 'in sketchbook' : 'add to sketchbook'}</button>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button onClick={onFav} style={roundAction('#fff')}><Heart filled={it.fav} size={24} /></button>
          <button onClick={onClose} style={{ ...roundAction(SK.card), fontFamily: SK_FONT.hand, fontWeight: 700, fontSize: 17, color: SK.ink, width: 'auto', padding: '0 22px', borderRadius: 26 }}>done</button>
          <button onClick={onDelete} style={roundAction('#fff')}><span style={{ color: SK.pinkD, fontSize: 22, fontFamily: SK_FONT.hand }}>🗑</span></button>
        </div>
      </div>
    </div>
  );
}

function roundAction(bg) {
  return {
    width: 52, height: 52, borderRadius: '50%', background: bg, border: `3px solid ${SK.border}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}
