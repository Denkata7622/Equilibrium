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

export const SpacedRep = {
  open() {
    this.render();
    document.getElementById('repOverlay').classList.add('open');
  },
  close() {
    document.getElementById('repOverlay').classList.remove('open');
  },
  render() {
    const now = Date.now();
    const all = getFlatPoints();
    const dueNow = [], dueWeek = [], weak = [], never = [];
    all.forEach(x => {
      const q = Store.state.quiz[x.point.id];
      if (!q) { never.push(x); return; }
      if (q.nextReview && q.nextReview <= now) dueNow.push(x);
      else if (q.nextReview && q.nextReview <= now + 7*24*60*60*1000) dueWeek.push(x);
      if (q.ease < 2.0 && q.attempts >= 2) weak.push(x);
    });
    const totalStudied = Object.keys(Store.state.quiz).length;
    const accuracy = (() => {
      let c = 0, w = 0;
      Object.values(Store.state.quiz).forEach(q => { c += q.correct || 0; w += (q.attempts||0) - (q.correct||0); });
      return (c + w) ? Math.round(c/(c+w)*100) : 0;
    })();

    const list = (items) => items.slice(0, 12).map(x => {
      const q = Store.state.quiz[x.point.id];
      const d = q && q.nextReview ? Math.max(0, Math.ceil((q.nextReview - now)/86400000)) : 0;
      return `<div class="rep-item" onclick="SpacedRep.close();if(Tabs.current!=='study')Tabs.switch('study');Content.scrollToPoint('${x.point.id}')">
        <span class="id">${x.point.id}</span>
        <span class="title">${x.point.title}</span>
        <span class="due">${d === 0 ? 'днес' : 'след ' + d + 'д'}</span>
        <span class="ease">${q ? q.ease.toFixed(1) : '—'}</span>
      </div>`;
    }).join('') || '<div style="color:var(--text-3);font-size:12px;padding:8px;">празно</div>';

    document.getElementById('repBody').innerHTML = `
      <div class="rep-stats">
        <div class="rep-stat ${dueNow.length ? 'warn' : ''}"><span class="v">${dueNow.length}</span><span class="k">ЗА ПРЕГОВОР ДНЕС</span></div>
        <div class="rep-stat"><span class="v">${dueWeek.length}</span><span class="k">ТАЗИ СЕДМИЦА</span></div>
        <div class="rep-stat danger"><span class="v">${weak.length}</span><span class="k">СЛАБИ ТЕМИ</span></div>
        <div class="rep-stat"><span class="v">${totalStudied}</span><span class="k">ИЗУЧЕНИ</span></div>
        <div class="rep-stat"><span class="v">${accuracy}%</span><span class="k">ТОЧНОСТ</span></div>
      </div>

      <div class="pm-label" style="margin-top:20px;">▸ ЗА ПРЕГОВОР ДНЕС (${dueNow.length})</div>
      <div class="rep-list">${list(dueNow)}</div>

      <div class="pm-label" style="margin-top:16px;">▸ СЛАБИ ТЕМИ (${weak.length})</div>
      <div class="rep-list">${list(weak)}</div>

      <div class="pm-label" style="margin-top:16px;">▸ ТАЗИ СЕДМИЦА (${dueWeek.length})</div>
      <div class="rep-list">${list(dueWeek)}</div>

      <div style="text-align:center;margin-top:20px;">
        <button class="exam-btn" onclick="SpacedRep.close();Quiz.open()">
          <i data-lucide="target"></i> СТАРТИРАЙ QUIZ
        </button>
      </div>
    `;
    Utils.refreshIcons();
  },
}