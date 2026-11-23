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

export const PageState = {
  KEY: 'olympiad_page_state_v1',
  _timer: null,

  _data: {
    modalId: null,
    modalOpenedAt: 0,
    pomodoro: null,
    scrollTop: 0,
    expandedPoints: [],
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const s = JSON.parse(raw);
        this._data = Object.assign(this._data, s);
      }
    } catch (e) {}
  },

  save() {
    try {
      this._data.pomodoro = {
        mode: Pomodoro.mode,
        endTime: Pomodoro.endTime,
        running: Pomodoro.running,
        remaining: Pomodoro.remaining,
        sessions: Pomodoro.sessions,
        _lastRenderedSec: Pomodoro._lastRenderedSec,
        savedAt: Date.now(),
      };
      const content = document.getElementById('content');
      if (content) this._data.scrollTop = content.scrollTop;
      this._data.expandedPoints = Array.from(
        document.querySelectorAll('.point.expanded')
      ).map(el => el.dataset.pid).filter(Boolean);
      localStorage.setItem(this.KEY, JSON.stringify(this._data));
    } catch (e) {}
  },

  saveDebounced() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.save(), 300);
  },

  saveNow() {
    clearTimeout(this._timer);
    this.save();
  },

  restorePomodoro() {
    const p = this._data.pomodoro;
    if (!p) return;

    Pomodoro.mode = p.mode || 'focus';
    Pomodoro.sessions = p.sessions || 0;

    if (p.running && p.endTime) {
      const now = Date.now();
      if (p.endTime > now) {
        Pomodoro.running = true;
        Pomodoro.endTime = p.endTime;
        Pomodoro.remaining = Math.max(0, Math.round((p.endTime - now) / 1000));
        Pomodoro._lastRenderedSec = -1;
        clearInterval(Pomodoro.interval);
        Pomodoro.interval = setInterval(() => Pomodoro.tick(), 200);
        Utils.toast('Pomodoro възстановен', 'timer');
      } else {
        Pomodoro.running = false;
        Pomodoro.endTime = null;
        Pomodoro.mode = 'focus';
        Pomodoro.remaining = Pomodoro._modeDuration();
        Pomodoro._lastRenderedSec = -1;
      }
    } else {
      Pomodoro.running = false;
      Pomodoro.endTime = null;
      Pomodoro.remaining = (typeof p.remaining === 'number')
        ? p.remaining
        : Pomodoro._modeDuration();
      Pomodoro._lastRenderedSec = -1;
    }
    Pomodoro.render();
  },

  restoreExpanded() {
    const ids = this._data.expandedPoints || [];
    if (!ids.length) return;
    requestAnimationFrame(() => {
      ids.forEach(pid => {
        const el = document.querySelector(`[data-pid="${pid}"]`);
        if (el) el.classList.add('expanded');
      });
    });
  },

  restoreScroll() {
    const top = this._data.scrollTop || 0;
    if (top <= 0) return;
    requestAnimationFrame(() => {
      const content = document.getElementById('content');
      if (content) content.scrollTop = top;
    });
  },

  restoreModal() {
    const id = this._data.modalId;
    if (!id || !getPoint(id)) return;
    const age = Date.now() - (this._data.modalOpenedAt || 0);
    if (age > 30 * 60 * 1000) { this._data.modalId = null; return; }
    setTimeout(() => {
      try { Modal.open(id); } catch (e) {}
    }, 120);
  },

  restore() {
    this.load();
    this.restorePomodoro();
    this.restoreExpanded();
    this.restoreScroll();
    this.restoreModal();
  },

  install() {
    const self = this;

    // Modal
    const origModalOpen = Modal.open.bind(Modal);
    Modal.open = function (id) {
      origModalOpen(id);
      self._data.modalId = id;
      self._data.modalOpenedAt = Date.now();
      self.saveDebounced();
    };
    const origModalClose = Modal.close.bind(Modal);
    Modal.close = function () {
      origModalClose();
      self._data.modalId = null;
      self._data.modalOpenedAt = 0;
      self.saveDebounced();
    };

    // Pomodoro
    ['toggle', 'reset', '_onComplete', 'tick'].forEach(method => {
      if (typeof Pomodoro[method] !== 'function') return;
      const orig = Pomodoro[method].bind(Pomodoro);
      Pomodoro[method] = function (...args) {
        const r = orig(...args);
        self.saveDebounced();
        return r;
      };
    });

    // Scroll — само записваме позицията, БЕЗ да форсираме layout всяка секунда
    const content = document.getElementById('content');
    if (content) {
      let scrollSaveTimer = null;
      content.addEventListener('scroll', () => {
        // Много лек debounce за да не пипаме scrollTop всеки път
        clearTimeout(scrollSaveTimer);
        scrollSaveTimer = setTimeout(() => self.saveDebounced(), 1500);
      }, { passive: true });
    }

    // Point expand
    const origToggleExpand = PointActions.toggleExpand.bind(PointActions);
    PointActions.toggleExpand = function (id, e) {
      origToggleExpand(id, e);
      self.saveDebounced();
    };

    // Save on tab hide / unload
    window.addEventListener('beforeunload', () => {
      self.saveNow();
      Store.saveNow();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        self.saveNow();
        Store.saveNow();
      }
    });

    // Periodic safety save
    setInterval(() => self.save(), 30000);
  },
}