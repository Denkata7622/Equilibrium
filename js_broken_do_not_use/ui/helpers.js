// Auto-extracted helpers
export function getPoint(id) {
  for (const s of STEPS) for (const p of s.points) if (p.id === id) return p;
  return null;
}

export function getFlatPoints() {
  const arr = [];
  for (const s of STEPS) for (const p of s.points) arr.push({ step: s, point: p });
  return arr;
}

export function matchFilter(p) {
  const meta = Store.getPoint(p.id);
  const f = Store.state.ui.filter;
  if (f === 'all') return true;
  if (f === 'done') return meta.done;
  if (f === 'todo') return !meta.done;
  if (f === 'fav') return meta.fav;
  if (f === 'easy') return meta.diff === 'easy';
  if (f === 'med') return meta.diff === 'med';
  if (f === 'hard') return meta.diff === 'hard';
  return true;
}

export function matchSearch(p) {
  const q = State.searchQuery;
  if (!q) return true;
  const lq = q.toLowerCase();
  const meta = Store.getPoint(p.id);
  return p.title.toLowerCase().includes(lq) ||
         p.desc.toLowerCase().includes(lq) ||
         p.source.toLowerCase().includes(lq) ||
         (p.explanation || '').toLowerCase().includes(lq) ||
         (meta.notes || '').toLowerCase().includes(lq) ||
         p.id.includes(lq);
}