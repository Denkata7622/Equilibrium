// ── Core ──
import { CONFIG } from './core/config.js';
import { Utils, State } from './core/utils.js';
import { Store } from './core/store.js';

// ── Data ──
import { LEVELS, PLAN_DAYS } from './data/levels.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { PREREQS } from './data/prereqs.js';
import './data/extra-tasks.js';     // IIFE — добавя задачи към STEPS при import

// ── UI ──
import { Theme, FontSize } from './ui/theme.js';
import { MathRender } from './ui/math.js';
import { Stats } from './ui/stats.js';
import { UI, Tabs } from './ui/ui.js';
import { Events } from './ui/events.js';
import { getPoint, getFlatPoints, matchFilter, matchSearch } from './ui/helpers.js';
import { Sidebar } from './ui/sidebar.js';
import { Content, ModeSwitcher } from './ui/content.js';
import { PointActions } from './ui/point-actions.js';
import { Modal } from './ui/modal.js';
import { DeepDive } from './ui/deepdive.js';

// ── Features ──
import { Pomodoro } from './features/pomodoro.js';
import { Palette, Help, SearchHistory } from './features/palette.js';
import { Quiz } from './features/quiz.js';
import { Achievements } from './features/achievements.js';
import { Formulas } from './features/formulas.js';
import { ProblemLog } from './features/problem-log.js';
import { Report } from './features/report.js';
import { Bookmarks } from './features/bookmarks.js';
import { Scratchpad } from './features/scratchpad.js';
import { ExamSim } from './features/exam-sim.js';
import { SpacedRep } from './features/spaced-rep.js';
import { Keys } from './features/keys.js';
import { Plan } from './features/plan.js';
import { Library } from './features/library.js';
import { Tools } from './features/tools.js';
import { StatsModal } from './features/stats-modal.js';
import { Videos } from './features/videos.js';
import { Today, Goal, Calendar, FormulaOfDay, Recent, Random, Focus } from './features/today.js';
import { ExportNotes } from './features/export-notes.js';
import { History } from './features/history.js';
import { FirstHint } from './features/first-hint.js';
import { TimeTracker } from './features/time-tracker.js';
import { PageState } from './features/page-state.js';
import { Versions } from './features/versions.js';
import { ArticleLoader } from './features/article-loader.js';

// ── Expose globals for legacy classic scripts (ai_assistant.js, data/config.js) ──
Object.assign(window, {
  CONFIG, Utils, State, Store,
  LEVELS, PLAN_DAYS, ACHIEVEMENTS, PREREQS,
  Theme, FontSize, MathRender, Stats, UI, Tabs, Events,
  getPoint, getFlatPoints, matchFilter, matchSearch,
  Sidebar, Content, ModeSwitcher, PointActions, Modal, DeepDive,
  Pomodoro, Palette, Help, SearchHistory, Quiz, Achievements,
  Formulas, ProblemLog, Report, Bookmarks, Scratchpad, ExamSim,
  SpacedRep, Keys, Plan, Library, Tools, StatsModal, Videos,
  Today, Goal, Calendar, FormulaOfDay, Recent, Random, Focus,
  ExportNotes, History, FirstHint, TimeTracker, PageState,
  Versions, ArticleLoader,
});

// ── Bootstrap ──
function init() {
  Store.state = Store.load();
  Theme.init();
  FontSize.init();
  History.init();

  if (Store.state.ui.scanlines) document.body.classList.add('scanlines');
  const scanLbl = document.getElementById('scanLabel');
  if (scanLbl) scanLbl.textContent = Store.state.ui.scanlines ? 'ON' : 'OFF';

  Sidebar.render();
  Content.render();
  Stats.update();

  if (Store.state.pomoSettings) {
    CONFIG.pomo.focus = Store.state.pomoSettings.focus * 60;
    CONFIG.pomo.shortBreak = Store.state.pomoSettings.shortBreak * 60;
    CONFIG.pomo.longBreak = Store.state.pomoSettings.longBreak * 60;
    Pomodoro.remaining = CONFIG.pomo.focus;
    Pomodoro._lastRenderedSec = Pomodoro.remaining;
  }
  Pomodoro.render();
  Pomodoro.updateLabel();

  Events.init();
  Keys.init();

  Recent.renderPanel();
  Recent.renderContinue();
  Goal.render();
  Calendar.render();
  FormulaOfDay.init();
  Focus.init();
  Achievements.check();
  Report.checkAutoShow();
  Tabs.init();
  ModeSwitcher.init();
  Plan.render();
  Library.render();

  MathRender.init();
  Today.render();
  Events.updateFilterCounts();
  FirstHint.init();
  Utils.refreshIcons();
  setTimeout(() => MathRender.apply(), 800);
  setTimeout(() => MathRender.apply(), 2200);

  setInterval(() => Achievements.check(), 30000);
}

// ── Install interceptors ──
PageState.install();
ArticleLoader.install();       // ← НОВО (вместо Versions.install)

// ── Run ──
init();
PageState.restore();