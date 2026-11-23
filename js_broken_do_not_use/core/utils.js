export const Utils = {
  pdfUrl(path, page) {
    if (!path) return '';
    const url = path.split('/').map(encodeURIComponent).join('/') + '.pdf';
    return page ? url + '#page=' + page : url;
  },
  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },
  todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  },
  iconSVG(name, size = 14, color) {
    if (!window.lucide) return '';
    try {
      const set = lucide.icons || (lucide.default && lucide.default.icons);
      if (!set || !set[name]) return '';
      const node = lucide.createElement(set[name]);
      node.setAttribute('width', String(size));
      node.setAttribute('height', String(size));
      if (color) node.style.color = color;
      return node.outerHTML;
    } catch (e) { return ''; }
  },
  toast(msg, icon) {
    const t = document.getElementById('toast');
    if (!t) return;
    const inner = icon
      ? `<i data-lucide="${icon}"></i><span>${Utils.escapeHtml(msg)}</span>`
      : `<span>${Utils.escapeHtml(msg)}</span>`;
    t.innerHTML = inner + '<div class="toast-progress"></div>';
    t.classList.add('show');
    Utils.refreshIcons();
    clearTimeout(Utils._toastTimer);
    Utils._toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  },
  refreshIcons() {
    if (!window.lucide) {
      if (!this._lucideRetries) this._lucideRetries = 0;
      if (this._lucideRetries++ > 80) return;
      setTimeout(() => this.refreshIcons(), 100);
      return;
    }
    this._lucideRetries = 0;
    if (this._iconRunning) { this._iconRescan = true; return; }
    this._iconRunning = true;
    setTimeout(() => this._renderIconsChunked(), 0);
  },
  _renderIconsChunked() {
    if (!window.lucide) { this._iconRunning = false; return; }
    const set = lucide.icons || (lucide.default && lucide.default.icons);
    if (!set) { this._iconRunning = false; return; }

    // Determine VISIBLE mode cache — skip icons inside hidden caches
    const visibleMode = Store.state.ui.topicView || 'absolute';

    const pending = Array.from(document.querySelectorAll('[data-lucide]'))
      .filter(el => {
        if (el.tagName === 'svg' || el.tagName === 'SVG') return false;
        // Skip icons inside hidden mode caches
        const cache = el.closest('.mode-cache');
        if (cache && cache.dataset.mode !== visibleMode) return false;
        return true;
      });

    if (!pending.length) {
      this._iconRunning = false;
      if (this._iconRescan) { this._iconRescan = false; this.refreshIcons(); }
      return;
    }

    let i = 0;
    const BUDGET_MS = 8;
    const CHUNK = 30;
    const t0 = performance.now();
    let chunkCount = 0;
    let skipped = 0;

    const processChunk = () => {
      chunkCount++;
      const start = performance.now();
      let processed = 0;
      while (i < pending.length && processed < CHUNK) {
        const el = pending[i];
        i++;
        processed++;
        if (!el.isConnected) { skipped++; continue; }
        const name = el.dataset.lucide;
        if (!name) { skipped++; continue; }
        const iconName = name.split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('');
        const iconData = set[iconName];
        if (!iconData) { skipped++; continue; }
        try {
          const svg = lucide.createElement(iconData);
          svg.classList.add('lucide');
          svg.classList.add('lucide-' + iconName.toLowerCase());
          for (const attr of el.attributes) {
            if (attr.name !== 'data-lucide') {
              try { svg.setAttribute(attr.name, attr.value); } catch (e) {}
            }
          }
          if (el.className && typeof el.className === 'string') {
            el.className.split(/\s+/).forEach(c => c && svg.classList.add(c));
          }
          el.replaceWith(svg);
        } catch (e) {
          skipped++;
          console.warn('[icon]', iconName, e);
        }
        if (performance.now() - start > BUDGET_MS) break;
      }

      if (i < pending.length) {
        setTimeout(processChunk, 0);
      } else {
        console.log('[icons] done:', (performance.now() - t0).toFixed(0) + 'ms,',
          'chunks:', chunkCount, 'total:', pending.length, 'skipped:', skipped);
        this._iconRunning = false;
        if (this._iconRescan) { this._iconRescan = false; this.refreshIcons(); }
      }
    };

    setTimeout(processChunk, 0);
  },
};

export const State = {
  searchQuery: '',
  currentModalId: null,
  currentIndex: -1,
};