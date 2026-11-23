// Versions — sync fallback за versions UI.
// Основният път е ArticleLoader (async fetch от article.json).
// Този модул се ползва само ако bundle липсва.

import { Utils } from '../core/utils.js';

export const Versions = {
  render(versions, fallbackContent, cssClass = '', processor = (s) => Utils.escapeHtml(s)) {
    if (!versions || !versions.length) {
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
    console.warn('[Versions.install] deprecated — ArticleLoader.install() покрива това');
  },
};
