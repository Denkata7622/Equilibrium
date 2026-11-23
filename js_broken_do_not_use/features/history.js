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

export const History = {
  key: 'olympiad_history_v1',
  max: 50,
  stack: [],

  init() {
    try {
      this.stack = JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch (e) { this.stack = []; }
    this.updateBadge();
  },

  push(type, data) {
    this.stack.push({ type, data, ts: Date.now() });
    if (this.stack.length > this.max) this.stack.shift();
    this.save();
    this.updateBadge();
  },

  save() {
    // Debounced + async — do not block main thread on every action
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      const doSave = () => {
        try { localStorage.setItem(this.key, JSON.stringify(this.stack)); } catch (e) {}
      };
      if (window.requestIdleCallback) {
        requestIdleCallback(doSave, { timeout: 1000 });
      } else {
        setTimeout(doSave, 0);
      }
    }, 300);
  },

  undo() {
    const last = this.stack.pop();
    if (!last) { Utils.toast('Нищо за връщане', 'alert-circle'); return; }
    this.save();
    this.updateBadge();

    switch (last.type) {
      case 'toggleDone': {
        const meta = Store.getPoint(last.data.id);
        meta.done = last.data.prev;
        Store.save();
        PointActions.updatePointEl(last.data.id);
        Stats.update(); Stats.updateSidebarRings(); Stats.updateStepBadges();
        Utils.toast('Върнато: ' + (last.data.prev ? 'маркирано' : 'отмаркирано'), 'undo-2');
        break;
      }
      case 'toggleFav': {
        const meta = Store.getPoint(last.data.id);
        meta.fav = last.data.prev;
        Store.save();
        PointActions.updatePointEl(last.data.id);
        Utils.toast('Върнато: star', 'undo-2');
        break;
      }
      case 'setDiff': {
        const meta = Store.getPoint(last.data.id);
        meta.diff = last.data.prev;
        Store.save();
        PointActions.updatePointEl(last.data.id);
        Utils.toast('Върнато: difficulty', 'undo-2');
        break;
      }
      case 'saveNotes': {
        const meta = Store.getPoint(last.data.id);
        meta.notes = last.data.prev;
        Store.save();
        const el = document.querySelector(`[data-pid="${last.data.id}"] .notes-area`);
        if (el) el.value = last.data.prev;
        Utils.toast('Върнато: notes', 'undo-2');
        break;
      }
      case 'toggleTask': {
        if (!Store.state.taskProgress) Store.state.taskProgress = {};
        Store.state.taskProgress[last.data.key] = last.data.prev;
        Store.save();
        if (State.currentModalId) {
          const p = getPoint(State.currentModalId);
          if (p) Modal.renderPractice(p);
        }
        Utils.toast('Върнато: задача', 'undo-2');
        if (window.Tabs && Tabs.current === 'tasks' && window.Content) Content.renderTasksView();
        break;
      }
      case 'toggleWeek': {
        if (!Store.state.planProgress) Store.state.planProgress = {};
        Store.state.planProgress[last.data.week] = last.data.prev;
        Store.save();
        Plan.render();
        Utils.toast('Върнато: седмица', 'undo-2');
        break;
      }
      case 'clearStep': {
        last.data.snapshot.forEach(snap => {
          Store.state.progress[snap.id] = snap.prev;
        });
        Store.save();
        Content.render();
        Sidebar.render();
        Stats.update();
        Utils.toast('Върнато: цяла стъпка', 'undo-2');
        break;
      }
    }
  },

  updateBadge() {
    const btn = document.getElementById('undoBtn');
    if (!btn) return;
    btn.style.display = this.stack.length ? 'inline-flex' : 'none';
    const cnt = btn.querySelector('.undo-count');
    if (cnt) cnt.textContent = this.stack.length;
  },

  clear() {
    this.stack = [];
    this.save();
    this.updateBadge();
  },
}