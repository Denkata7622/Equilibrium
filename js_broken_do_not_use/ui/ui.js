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

export const UI = {
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  },
  toggleDropdown(id, event) {
    if (event) event.stopPropagation();
    const el = document.getElementById(id);
    const wasOpen = el.classList.contains('open');
    this.closeMenus();
    if (!wasOpen) el.classList.add('open');
  },
  closeMenus() {
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    const rp = document.getElementById('recentPanel');
    if (rp) rp.classList.remove('open');
  },
  toggleScanlines() {
    Store.state.ui.scanlines = !Store.state.ui.scanlines;
    document.body.classList.toggle('scanlines', Store.state.ui.scanlines);
    const lbl = document.getElementById('scanLabel');
    if (lbl) lbl.textContent = Store.state.ui.scanlines ? 'ON' : 'OFF';
    Store.save();
  },
}

export const Tabs = {
  current: 'study',
  switch(tab) {
    this.current = tab;
    document.querySelectorAll('.main-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('view-study').classList.toggle('hidden', tab !== 'study');
    document.getElementById('view-plan').classList.toggle('hidden', tab !== 'plan');
    document.getElementById('view-library').classList.toggle('hidden', tab !== 'library');
    document.getElementById('appRoot').classList.toggle('plan-mode', tab === 'plan');
    document.getElementById('view-tasks')?.classList.toggle('hidden', tab !== 'tasks');
    Store.state.ui.tab = tab;
    Store.save();
    if (tab === 'plan') Plan.render();
    if (tab === 'library') Library.render();
    if (tab === 'tasks') Content.renderTasksView();
    Utils.refreshIcons();
  },
  init() {
    const saved = Store.state.ui.tab || 'study';
    this.switch(saved);
  },
}
