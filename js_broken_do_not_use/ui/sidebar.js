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

export const Sidebar = {
  render() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    const mode = Store.state.ui.topicView || 'absolute';

    if (mode === 'roadmap')       this.renderRoadmap(nav);
    else if (mode === 'preview')  this.renderPreview(nav);
    else                          this.renderAbsolute(nav);
  },

  renderAbsolute(nav) {
    STEPS.forEach(step => {
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const pct = Math.round(done / step.points.length * 100);
      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.step = step.id;
      btn.innerHTML = `
        <span class="num">${String(step.id).padStart(2,'0')}</span>
        <span class="label">${step.title}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${step.points.length}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToStep(step.id);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },

  renderRoadmap(nav) {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    LEVELS.forEach(lvl => {
      const levelPointIds = lvl.groups.flatMap(g => g.ids);
      const levelPoints = levelPointIds.map(id => flatMap[id]).filter(Boolean);
      if (!levelPoints.length) return;
      const total = levelPoints.length;
      const done = levelPoints.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = Math.round(done / total * 100);

      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.level = lvl.id;
      btn.innerHTML = `
        <span class="num" style="color:${lvl.color};text-shadow:none;">${lvl.icon}</span>
        <span class="label">${String(lvl.id).padStart(2,'0')} ${lvl.name}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${total}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToLevel(lvl.id);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },

  renderPreview(nav) {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    const level0 = LEVELS.find(l => l.id === 0);
    if (!level0) return;
    const iconMap = { 'Алгебра': '📐', 'Геометрия': '📏', 'Теория на числата': '🔢', 'Комбинаторика': '🎲' };

    level0.groups.forEach(grp => {
      const pts = grp.ids.map(id => flatMap[id]).filter(Boolean);
      const total = pts.length;
      const done = pts.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = Math.round(done / total * 100);

      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.previewGroup = grp.name;
      btn.innerHTML = `
        <span class="num" style="font-size:16px;text-shadow:none;">${iconMap[grp.name] || '◆'}</span>
        <span class="label">${grp.name}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${total}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToPreviewGroup(grp.name);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },
}