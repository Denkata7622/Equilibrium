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

export const Achievements = {
  check() {
    let unlocked = false;
    ACHIEVEMENTS.forEach(a => {
      if (Store.state.achievements.includes(a.id)) return;
      try {
        if (a.check()) {
          Store.state.achievements.push(a.id);
          unlocked = true;
          Utils.toast('Unlocked: ' + a.name, a.icon);
        }
      } catch (e) {}
    });
    if (unlocked) Store.save();
  },
  open() {
    this.render();
    document.getElementById('achOverlay').classList.add('open');
  },
  close() {
    document.getElementById('achOverlay').classList.remove('open');
  },
  render() {
    const grid = document.getElementById('achGrid');
    grid.innerHTML = ACHIEVEMENTS.map(a => {
      const unlocked = Store.state.achievements.includes(a.id);
      return `<div class="ach-item ${unlocked?'unlocked':''}">
        <div class="ach-icon"><i data-lucide="${a.icon}"></i></div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      </div>`;
    }).join('');
    const count = document.getElementById('achCount');
    if (count) count.textContent = `${Store.state.achievements.length} / ${ACHIEVEMENTS.length} unlocked`;
    Utils.refreshIcons();
  },
}