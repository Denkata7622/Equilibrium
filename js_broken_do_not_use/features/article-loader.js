import { Utils } from '../core/utils.js';

/**
 * ArticleLoader — fetch() на article.json с кеш.
 * Замества integrate.py: article.json се генерира от pipeline.py след всяка статия.
 */
export const ArticleLoader = {
  _cache: new Map(),
  _BASE: 'generated/articles/',

  _safeId(pid) { return pid.replace('.', '_'); },

  load(pid) {
    if (this._cache.has(pid)) return this._cache.get(pid);
    const url = `${this._BASE}${this._safeId(pid)}/article.json`;
    const p = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .catch(err => {
        console.warn(`[ArticleLoader] ${pid}:`, err.message);
        return null;
      });
    this._cache.set(pid, p);
    return p;
  },

  invalidate(pid) {
    if (pid) this._cache.delete(pid);
    else this._cache.clear();
  },

  /**
   * Рендерира versions UI. Fallback към Versions.render ако няма bundle.
   * @param {string} pid
   * @param {'versions'|'deep_versions'} field
   * @param {string} fallbackContent
   * @param {string} cssClass
   * @param {(s:string)=>string} processor
   */
  async render(pid, field, fallbackContent, cssClass = '', processor = s => Utils.escapeHtml(s)) {
    const bundle = await this.load(pid);
    const versions = bundle ? (bundle[field] || []) : [];
    if (!versions.length) {
      return `<div class="version-content active ${cssClass}">${processor(fallbackContent || '')}</div>`;
    }
    const sorted = [...versions].sort((a, b) => a.v - b.v);
    const latest = sorted[sorted.length - 1].v;
    const btns = sorted.map(v =>
      `<button class="ver-btn${v.v === latest ? ' active' : ''}" data-version="${v.v}">v${v.v}</button>`
    ).join('');
    const panes = sorted.map(v =>
      `<div class="version-content${v.v === latest ? ' active' : ''} ${cssClass}" data-version="${v.v}">${processor(v.content || '')}</div>`
    ).join('');
    return `<div class="versions">${btns}</div>${panes}`;
  },

  install() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.ver-btn');
      if (!btn) return;
      const versions = btn.closest('.versions');
      if (!versions) return;
      const targetV = btn.dataset.version;
      const parent = versions.parentElement;
      versions.querySelectorAll('.ver-btn').forEach(b =>
        b.classList.toggle('active', b === btn));
      parent.querySelectorAll(':scope > .version-content').forEach(c => {
        c.classList.toggle('active', c.dataset.version === targetV);
      });
      const active = parent.querySelector(':scope > .version-content.active');
      if (active && window.MathRender) {
        active.dataset.mathDone = '';
        window.MathRender.apply(active);
      }
      e.stopPropagation();
    });
  },
};