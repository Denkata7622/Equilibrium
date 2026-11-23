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

export const Palette = {
  open() {
    document.getElementById('paletteOverlay').classList.add('open');
    const inp = document.getElementById('paletteInput');
    inp.value = '';
    this.renderResults('');
    setTimeout(() => inp.focus(), 30);
  },
  close() {
    document.getElementById('paletteOverlay').classList.remove('open');
  },
  renderResults(q) {
    const res = document.getElementById('paletteResults');
    const flat = getFlatPoints();
    const query = q.toLowerCase().trim();
    let matches = flat;
    if (query) {
      matches = flat.filter(x =>
        x.point.title.toLowerCase().includes(query) ||
        x.point.id.includes(query) ||
        x.step.title.toLowerCase().includes(query) ||
        (Store.getPoint(x.point.id).notes || '').toLowerCase().includes(query)
      );
    }
    matches = matches.slice(0, 30);
    if (matches.length === 0) {
      res.innerHTML = '<div class="palette-empty">NO RESULTS</div>';
      return;
    }
    res.innerHTML = matches.map((x, i) => {
      const meta = Store.getPoint(x.point.id);
      return `<div class="palette-item ${i===0?'selected':''}" data-pid="${x.point.id}">
        <span class="pnum">${x.point.id}</span>
        <span class="ptitle">${meta.done?'<i data-lucide="check"></i> ':''}${x.point.title}</span>
        <span class="pstep">STEP ${x.step.id}</span>
      </div>`;
    }).join('');
    res.querySelectorAll('.palette-item').forEach(el => {
      el.addEventListener('click', () => {
        this.close();
        Content.scrollToPoint(el.dataset.pid);
      });
    });
    Utils.refreshIcons();
  },
}

export const Help = {
  open() { document.getElementById('helpOverlay').classList.add('open'); },
  close() { document.getElementById('helpOverlay').classList.remove('open'); },
}

export const SearchHistory = {
  key: 'olympiad_search_history',
  max: 8,
  get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch(e){ return []; } },
  add(q) {
    q = (q || '').trim();
    if (!q || q.length < 2) return;
    let h = this.get().filter(x => x !== q);
    h.unshift(q);
    h = h.slice(0, this.max);
    localStorage.setItem(this.key, JSON.stringify(h));
  },
  render() {
    const panel = document.getElementById('searchHistory');
    if (!panel) return;
    const h = this.get();
    if (!h.length) {
      panel.innerHTML = '<div class="search-history-empty">Няма история</div>';
      return;
    }
    panel.innerHTML = h.map(q =>
      `<button class="search-history-item" onclick="SearchHistory.pick('${Utils.escapeHtml(q).replace(/'/g,"\\'")}')">
        <i data-lucide="history"></i>
        <span>${Utils.escapeHtml(q)}</span>
      </button>`
    ).join('') +
    `<button class="search-history-item" onclick="SearchHistory.clearAll()" style="color:var(--danger);justify-content:center;">
      <i data-lucide="trash-2"></i> <span>Clear history</span>
    </button>`;
    Utils.refreshIcons();
  },
  pick(q) {
    const inp = document.getElementById('searchInput');
    inp.value = q;
    State.searchQuery = q;
    Content.render();
    this.hide();
  },
  show() { const p = document.getElementById('searchHistory'); if (p) { this.render(); p.classList.add('open'); } },
  hide() { const p = document.getElementById('searchHistory'); if (p) p.classList.remove('open'); },
  clearAll() {
    localStorage.removeItem(this.key);
    this.render();
    Utils.toast('Историята изчистена', 'trash-2');
  },
}
