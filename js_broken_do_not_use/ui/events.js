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

export const Events = {
    updateFilterCounts() {
    const flat = getFlatPoints();
    const counts = {
      all: flat.length,
      todo: flat.filter(x => !Store.getPoint(x.point.id).done).length,
      done: flat.filter(x => Store.getPoint(x.point.id).done).length,
      fav: flat.filter(x => Store.getPoint(x.point.id).fav).length,
      easy: flat.filter(x => Store.getPoint(x.point.id).diff === 'easy').length,
      med: flat.filter(x => Store.getPoint(x.point.id).diff === 'med').length,
      hard: flat.filter(x => Store.getPoint(x.point.id).diff === 'hard').length,
    };
    Object.entries(counts).forEach(([k, v]) => {
      const el = document.querySelector(`[data-count="${k}"]`);
      if (el) el.textContent = v;
    });
  },

  init() {
    this.updateFilterCounts();

    const searchInp = document.getElementById('searchInput');
    let _searchDebounceTimer = null;
    searchInp.addEventListener('input', e => {
      State.searchQuery = e.target.value;
      document.getElementById('kbdHint').classList.toggle('hidden', !!State.searchQuery);
      if (Tabs.current !== 'study') Tabs.switch('study');
      // Debounce: wait 180ms after last keystroke before re-rendering
      clearTimeout(_searchDebounceTimer);
      _searchDebounceTimer = setTimeout(() => {
        Content.applyFilter();
      }, 180);
    });
    searchInp.addEventListener('focus', () => SearchHistory.show());
    searchInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        SearchHistory.add(searchInp.value);
        SearchHistory.hide();
        searchInp.blur();
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#searchWrap')) SearchHistory.hide();
    });

    document.getElementById('filters').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      Store.state.ui.filter = chip.dataset.filter;
      Store.save();
      Content.applyFilter();
    });

    document.querySelectorAll('.chip').forEach(c =>
      c.classList.toggle('active', c.dataset.filter === Store.state.ui.filter));

    document.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown-menu')) return;
      UI.closeMenus();
    });

    const palInp = document.getElementById('paletteInput');
    palInp.addEventListener('input', e => Palette.renderResults(e.target.value));
    palInp.addEventListener('keydown', e => {
      const items = document.querySelectorAll('.palette-item');
      if (e.key === 'Enter') {
        if (items.length > 0) {
          const sel = document.querySelector('.palette-item.selected') || items[0];
          Palette.close();
          Content.scrollToPoint(sel.dataset.pid);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const cur = document.querySelector('.palette-item.selected');
        let idx = cur ? Array.from(items).indexOf(cur) : -1;
        idx += (e.key === 'ArrowDown' ? 1 : -1);
        if (idx < 0) idx = items.length - 1;
        if (idx >= items.length) idx = 0;
        items.forEach(it => it.classList.remove('selected'));
        items[idx].classList.add('selected');
        items[idx].scrollIntoView({ block: 'nearest' });
      }
    });

    // dblclick handler е премахнат — goal се сменя през StatsModal.open('goal')
  },
}