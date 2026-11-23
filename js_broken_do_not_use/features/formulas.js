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

export const Formulas = {
  filter: 'all',
  open() {
    this.render();
    document.getElementById('sheetOverlay').classList.add('open');
  },
  close() {
    document.getElementById('sheetOverlay').classList.remove('open');
  },
  toggleFilter() {
    this.filter = this.filter === 'all' ? 'done' : 'all';
    document.getElementById('sheetFilterBtn').textContent = this.filter === 'all' ? 'ALL' : 'DONE ONLY';
    this.render();
  },
  render() {
    const container = document.getElementById('sheetContent');
    let html = '';
    STEPS.forEach(step => {
      const formulas = [];
      step.points.forEach(p => {
        if (this.filter === 'done' && !Store.getPoint(p.id).done) return;
        if (!p.explanation) return;
        const lines = p.explanation.split('\n').filter(l =>
          /[=≡⇔≥≤]/.test(l) && l.length < 120 && !l.startsWith('ФОРМУЛИРОВКА') && !l.startsWith('КОГА') && !l.startsWith('СВОЙСТВА') && !l.startsWith('ТРИК')
        );
        lines.slice(0, 3).forEach(line => {
          formulas.push({ text: line.trim(), id: p.id });
        });
      });
      if (!formulas.length) return;
      html += `<div class="sheet-section">
        <h3>${step.id}. ${step.title}</h3>
        ${formulas.map(f => `<div class="sheet-formula">${Utils.escapeHtml(f.text)}<span class="source" onclick="Formulas.close();if(Tabs.current!=='study')Tabs.switch('study');Content.scrollToPoint('${f.id}')">${f.id}</span></div>`).join('')}
      </div>`;
    });
    container.innerHTML = html || '<div style="text-align:center;padding:40px;color:var(--text-3);">No formulas</div>';
  },
}