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

export const ProblemLog = {
  open() {
    this.render();
    document.getElementById('plogOverlay').classList.add('open');
  },
  close() {
    document.getElementById('plogOverlay').classList.remove('open');
  },
  add() {
    const label = document.getElementById('plogLabel').value.trim();
    if (!label) return;
    const note = document.getElementById('plogNote').value.trim();
    const status = document.getElementById('plogStatus').value;
    Store.state.problemLog.unshift({ label, note, status, ts: Date.now() });
    Store.save();
    document.getElementById('plogLabel').value = '';
    document.getElementById('plogNote').value = '';
    this.render();
    Achievements.check();
  },
  remove(idx) {
    Store.state.problemLog.splice(idx, 1);
    Store.save();
    this.render();
  },
  render() {
    const list = document.getElementById('plogList');
    const log = Store.state.problemLog;
    if (!log.length) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-3);">No problems logged</div>';
      return;
    }
    const statusIcon = { solved: 'check-circle-2', partial: 'circle-dot', failed: 'x-circle' };
    const statusLabel = { solved: 'SOLVED', partial: 'PARTIAL', failed: 'FAILED' };
    list.innerHTML = log.map((e, i) => {
      const d = new Date(e.ts);
      const dateStr = d.getDate() + '.' + (d.getMonth()+1) + '.' + d.getFullYear();
      return `<div class="plog-entry">
        <span class="status ${e.status}"><i data-lucide="${statusIcon[e.status]}"></i> ${statusLabel[e.status]}</span>
        <div class="info">
          <div style="color:var(--text);">${Utils.escapeHtml(e.label)}</div>
          ${e.note ? `<div style="color:var(--text-3);font-size:11px;margin-top:2px;">${Utils.escapeHtml(e.note)}</div>` : ''}
          <div style="color:var(--text-3);font-size:10px;margin-top:2px;">${dateStr}</div>
        </div>
        <button class="del" onclick="ProblemLog.remove(${i})"><i data-lucide="x"></i></button>
      </div>`;
    }).join('');
    Utils.refreshIcons();
  },
}