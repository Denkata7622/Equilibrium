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

export const Theme = {
  apply(theme) {
    if (theme === 'green') document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', theme);
    const lbl = document.getElementById('themeLabel');
    if (lbl) lbl.textContent = CONFIG.themeLabels[theme] || 'GREEN';
    localStorage.setItem(CONFIG.themeKey, theme);
  },
  cycle() {
    const cur = localStorage.getItem(CONFIG.themeKey) || 'green';
    const idx = CONFIG.themes.indexOf(cur);
    const next = CONFIG.themes[(idx + 1) % CONFIG.themes.length];
    this.apply(next);
    Utils.toast('Theme: ' + CONFIG.themeLabels[next], 'palette');
  },
  init() {
    this.apply(localStorage.getItem(CONFIG.themeKey) || 'green');
  },
}

export const FontSize = {
  sizes: ['small', 'normal', 'large', 'xlarge'],
  labels: { small:'SMALL', normal:'NORMAL', large:'LARGE', xlarge:'XL' },
  key: 'olympiad_fontsize',
  apply(s) {
    if (s === 'normal') document.body.removeAttribute('data-fontsize');
    else document.body.setAttribute('data-fontsize', s);
    const lbl = document.getElementById('fontLabel');
    if (lbl) lbl.textContent = this.labels[s] || 'NORMAL';
    localStorage.setItem(this.key, s);
  },
  cycle() {
    const cur = localStorage.getItem(this.key) || 'normal';
    const idx = this.sizes.indexOf(cur);
    const next = this.sizes[(idx + 1) % this.sizes.length];
    this.apply(next);
    Utils.toast('Font: ' + this.labels[next], 'type');
  },
  init() { this.apply(localStorage.getItem(this.key) || 'normal'); },
}
