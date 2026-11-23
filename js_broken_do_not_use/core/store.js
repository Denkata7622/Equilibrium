// Auto-extracted from old index.html
import { CONFIG } from '../core/config.js';
import { Utils, State } from '../core/utils.js';
import { Store } from '../core/store.js';
import { LEVELS, PLAN_DAYS } from '../data/levels.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { PREREQS } from '../data/prereqs.js';
import { Theme, FontSize } from '../ui/theme.js';
import { MathRender } from '../ui/math.js';
import { Stats } from '../ui/stats.js';
import { UI, Tabs } from '../ui/ui.js';
import { Events } from '../ui/events.js';
import { getPoint, getFlatPoints, matchFilter, matchSearch } from '../ui/helpers.js';
import { Sidebar } from '../ui/sidebar.js';
import { Content, ModeSwitcher } from '../ui/content.js';
import { PointActions } from '../ui/point-actions.js';
import { Modal } from '../ui/modal.js';
import { DeepDive } from '../ui/deepdive.js';
import { Pomodoro } from '../features/pomodoro.js';
import { Palette, Help, SearchHistory } from '../features/palette.js';
import { Quiz } from '../features/quiz.js';
import { Achievements } from '../features/achievements.js';
import { Formulas } from '../features/formulas.js';
import { ProblemLog } from '../features/problem-log.js';
import { Report } from '../features/report.js';
import { Bookmarks } from '../features/bookmarks.js';
import { Scratchpad } from '../features/scratchpad.js';
import { ExamSim } from '../features/exam-sim.js';
import { SpacedRep } from '../features/spaced-rep.js';
import { Keys } from '../features/keys.js';
import { Plan } from '../features/plan.js';
import { Library } from '../features/library.js';
import { Tools } from '../features/tools.js';
import { StatsModal } from '../features/stats-modal.js';
import { Videos } from '../features/videos.js';
import { Today, Goal, Calendar, FormulaOfDay, Recent, Random, Focus } from '../features/today.js';
import { ExportNotes } from '../features/export-notes.js';
import { History } from '../features/history.js';
import { FirstHint } from '../features/first-hint.js';
import { TimeTracker } from '../features/time-tracker.js';
import { PageState } from '../features/page-state.js';
import { Versions } from '../features/versions.js';
import { ArticleLoader } from '../features/article-loader.js';

export const Store = {
  state: null,
  defaults() {
    return {
      progress: {},
      ui: { filter: 'all', collapsed: {}, scanlines: false, focus: false, tab: 'study', topicView: 'absolute' },
      streak: { count: 0, best: 0, lastDate: null, history: {} },
      pomodoroSessions: 0,
      sessions: [],
      dailyLog: {},
      dailyGoalMinutes: 120,
      quiz: {},
      achievements: [],
      bookmarks: {},
      problemLog: [],
      recentPoints: [],
      lastPoint: null,
      formulaOfDay: null,
      lastReportShown: null,
      planProgress: {},
      taskProgress: {},
      examHistory: [],
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(CONFIG.storeKey);
      if (raw) {
        const s = JSON.parse(raw);
        const def = this.defaults();
        return Object.assign(def, s, {
          progress: s.progress || {},
          ui: Object.assign(def.ui, s.ui || {}),
          streak: Object.assign(def.streak, s.streak || {}),
          dailyLog: s.dailyLog || {},
          sessions: s.sessions || [],
          quiz: s.quiz || {},
          achievements: s.achievements || [],
          bookmarks: s.bookmarks || {},
          problemLog: s.problemLog || [],
          recentPoints: s.recentPoints || [],
          planProgress: s.planProgress || {},
          taskProgress: s.taskProgress || {},
          examHistory: s.examHistory || [],
        });
      }
    } catch (e) {}
    for (const key of CONFIG.legacyKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const old = JSON.parse(raw);
        const s = this.defaults();
        if (old.progress) s.progress = old.progress;
        else Object.keys(old).forEach(id => {
          if (old[id]) s.progress[id] = { done: true, fav: false, diff: null, notes: '' };
        });
        if (old.ui) Object.assign(s.ui, old.ui);
        if (old.streak) s.streak = old.streak;
        return s;
      } catch (e) {}
    }
    return this.defaults();
  },
  save() {
    // Debounced — state is 100KB+, don't block main thread on every action
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(CONFIG.storeKey, JSON.stringify(this.state)); } catch (e) {}
    }, 200);
  },
  saveNow() {
    clearTimeout(this._saveTimer);
    try { localStorage.setItem(CONFIG.storeKey, JSON.stringify(this.state)); } catch (e) {}
  },
  getPoint(id) {
    if (!this.state.progress[id]) {
      this.state.progress[id] = { done: false, fav: false, diff: null, notes: '' };
    }
    return this.state.progress[id];
  },
  exportJSON() {
    const data = JSON.stringify(this.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'olympiad-progress-' + Utils.todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('Exported', 'download');
  },
  importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.progress) throw new Error('Invalid');
        this.state = Object.assign(this.defaults(), data);
        this.save();
        Sidebar.render(); Content.render(); Stats.update(); Plan.render();
        if (this.state.ui.scanlines) document.body.classList.add('scanlines');
        Utils.toast('Imported', 'upload');
      } catch (err) { alert('Invalid format'); }
    };
    r.readAsText(file);
    e.target.value = '';
  },
  resetAll() {
    if (!confirm('Reset ALL progress?')) return;
    this.state = this.defaults();
    this.save();
    Sidebar.render(); Content.render(); Stats.update(); Plan.render();
    Utils.toast('Everything reset', 'trash-2');
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: UTILS
   ═══════════════════════════════════════════════════════════════ */
const Utils = {
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
    const inner = icon
      ? `<i data-lucide="${icon}"></i><span>${Utils.escapeHtml(msg)}</span>`
      : `<span>${Utils.escapeHtml(msg)}</span>`;
    t.innerHTML = inner + '<div class="toast-progress"></div>';
    t.classList.add('show');
    Utils.refreshIcons();
    clearTimeout(Utils._toastTimer);
    Utils._toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
    const prog = t.querySelector('.toast-progress');
    if (prog) {
      prog.style.animation = 'none';
      void prog.offsetWidth;
      prog.style.animation = '';
    }
  },
  refreshIcons() {
    if (!window.lucide) {
      if (!this._lucideRetries) this._lucideRetries = 0;
      if (this._lucideRetries++ > 80) return; // give up after 8s
      setTimeout(() => this.refreshIcons(), 100);
      return;
    }
    this._lucideRetries = 0;
    if (this._iconRunning) {
      this._iconRescan = true;
      return;
    }
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
}