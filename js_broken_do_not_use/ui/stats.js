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

export const Stats = {
  update() {
    let total = 0, done = 0;
    STEPS.forEach(s => s.points.forEach(p => {
      total++;
      if (Store.getPoint(p.id).done) done++;
    }));
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('statDone').textContent = done;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPercent').textContent = pct + '%';
    document.getElementById('statPomos').textContent = Store.state.pomodoroSessions;
    document.getElementById('progressFill').style.width = pct + '%';
    this.renderStreak();
    if (window.Today) Today.render();
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
  },
  checkStreak() {
    const today = Utils.todayStr();
    if (Store.state.streak.lastDate === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.getFullYear() + '-' + String(y.getMonth()+1).padStart(2,'0') + '-' + String(y.getDate()).padStart(2,'0');
    if (Store.state.streak.lastDate === yesterday) Store.state.streak.count++;
    else Store.state.streak.count = 1;
    Store.state.streak.lastDate = today;
    // Track best streak
    if (!Store.state.streak.best || Store.state.streak.count > Store.state.streak.best) {
      Store.state.streak.best = Store.state.streak.count;
    }
    Store.save();
    this.renderStreak();
  },
  renderStreak() {
    document.getElementById('streakNum').textContent = Store.state.streak.count || 0;
  },
  updateStepBadges() {
    document.querySelectorAll('.step').forEach(sec => {
      const stepId = parseInt(sec.id.replace('step-', ''));
      const step = STEPS.find(s => s.id === stepId);
      if (!step) return;
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const total = step.points.length;
      const pct = Math.round(done / total * 100);
      const badge = sec.querySelector('.step-badge');
      if (badge) {
        badge.textContent = `${done}/${total} · ${pct}%`;
        badge.classList.toggle('done', done === total);
      }
    });
  },
  updateSidebarRings() {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    document.querySelectorAll('.nav-step').forEach(btn => {
      let done = 0, total = 0;

      if (btn.dataset.step !== undefined) {
        // ABS mode
        const stepId = parseInt(btn.dataset.step);
        const step = STEPS.find(s => s.id === stepId);
        if (!step) return;
        total = step.points.length;
        done = step.points.filter(p => Store.getPoint(p.id).done).length;
      } else if (btn.dataset.level !== undefined) {
        // ROADMAP mode
        const lvlId = parseInt(btn.dataset.level);
        const lvl = LEVELS.find(l => l.id === lvlId);
        if (!lvl) return;
        const ids = lvl.groups.flatMap(g => g.ids);
        total = ids.length;
        done = ids.filter(id => Store.getPoint(id).done).length;
      } else if (btn.dataset.previewGroup !== undefined) {
        // PREVIEW mode
        const lvl0 = LEVELS.find(l => l.id === 0);
        const grp = lvl0.groups.find(g => g.name === btn.dataset.previewGroup);
        if (!grp) return;
        total = grp.ids.length;
        done = grp.ids.filter(id => Store.getPoint(id).done).length;
      } else {
        return;
      }

      const pct = total ? Math.round(done / total * 100) : 0;
      const ring = btn.querySelector('.ring');
      const ringSpan = ring.querySelector('span');
      if (ring) ring.style.setProperty('--pct', pct + '%');
      if (ringSpan) ringSpan.textContent = done + '/' + total;
    });
  },
}