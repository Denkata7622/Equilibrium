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

export const PointActions = {
  toggleDone(id, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.done;
    meta.done = !meta.done;
    History.push('toggleDone', { id, prev });
    if (meta.done) Stats.checkStreak();
    Store.save();
    this.updatePointEl(id);
    // Defer heavy refresh — browser stays responsive
    requestAnimationFrame(() => {
      Stats.update(); Stats.updateSidebarRings(); Stats.updateStepBadges();
      if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
      if (window.Today && Today.render) Today.render();
    });
    if (meta.done) Utils.toast('Completed: ' + id, 'check');
    Achievements.check();
  },
  toggleFav(id, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.fav;
    meta.fav = !meta.fav;
    History.push('toggleFav', { id, prev });
    Store.save();
    this.updatePointEl(id);
    if (meta.fav) Utils.toast('Marked for review', 'star');
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
    if (window.Today && Today.render) Today.render();
  },
  setDiff(id, diff, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.diff;
    meta.diff = meta.diff === diff ? null : diff;
    History.push('setDiff', { id, prev });
    Store.save();
    this.updatePointEl(id);
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
    if (window.Today && Today.render) Today.render();
  },
  saveNotes(id, val) {
    const meta = Store.getPoint(id);
    const prev = meta.notes;
    meta.notes = val;
    History.push('saveNotes', { id, prev });
    Store.save();
    this.updatePointEl(id, true);
  },
  toggleExpand(id, e) {
    if (e) e.stopPropagation();
    const el = document.querySelector(`[data-pid="${id}"]`);
    if (el) el.classList.toggle('expanded');
  },
  updatePointEl(id, onlyNotesBadge) {
    const meta = Store.getPoint(id);
    document.querySelectorAll(`[data-pid="${id}"]`).forEach(el => {
      if (!onlyNotesBadge) {
        el.classList.toggle('done', meta.done);
        el.classList.toggle('fav', meta.fav);
        const chk = el.querySelector('.point-check');
        if (chk) {
          chk.classList.toggle('checked', meta.done);
          chk.innerHTML = meta.done ? Utils.iconSVG('check', 14) : '';
        }
        el.querySelectorAll('.diff-btn').forEach(b => {
          const isActive = b.classList.contains(meta.diff);
          b.classList.toggle('active', isActive);
        });
        const favBtn = el.querySelectorAll('.mini-btn')[1];
        if (favBtn) favBtn.classList.toggle('active', meta.fav);
      }
      const num = el.querySelector('.point-num');
      if (!num) return;
      const existing = num.querySelector('.notes-badge');
      if (meta.notes && !existing) num.insertAdjacentHTML('beforeend', ' <span class="notes-badge" title="Has notes"><i data-lucide="pencil"></i></span>');
      else if (!meta.notes && existing) existing.remove();
    });
    Utils.refreshIcons();
  },
}