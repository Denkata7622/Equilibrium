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

export const TimeTracker = {
  sessionStart: null,
  currentPointId: null,
  interval: null,
  start(pointId) {
    if (this.sessionStart) this.end();
    this.sessionStart = Date.now();
    this.currentPointId = pointId;
    if (!this.interval) this.interval = setInterval(() => this.tick(), 60000);
  },
  end() {
    if (!this.sessionStart) return;
    const duration = Math.floor((Date.now() - this.sessionStart) / 1000);
    if (duration < 10) { this.sessionStart = null; this.currentPointId = null; return; }
    const today = Utils.todayStr();
    if (!Store.state.dailyLog[today]) Store.state.dailyLog[today] = { seconds: 0, points: [] };
    Store.state.dailyLog[today].seconds += duration;
    if (this.currentPointId && !Store.state.dailyLog[today].points.includes(this.currentPointId)) {
      Store.state.dailyLog[today].points.push(this.currentPointId);
    }
    Store.state.sessions.push({ pointId: this.currentPointId, start: this.sessionStart, end: Date.now() });
    if (Store.state.sessions.length > 200) Store.state.sessions = Store.state.sessions.slice(-200);
    Store.state.streak.history[today] = (Store.state.streak.history[today] || 0) + duration;
    Store.save();
    this.sessionStart = null;
    this.currentPointId = null;
    Goal.render();
    Calendar.render();
    Achievements.check();
  },
  tick() {
    if (!this.sessionStart) return;
    const duration = Math.floor((Date.now() - this.sessionStart) / 1000);
    const today = Utils.todayStr();
    if (!Store.state.dailyLog[today]) Store.state.dailyLog[today] = { seconds: 0, points: [] };
    const prev = Store.state.dailyLog[today].seconds;
    Goal.renderLive(prev + duration);
    const sec = (Store.state.dailyLog[today]?.seconds || 0) + duration;
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const remMin = min % 60;
    const tEl = document.getElementById('heroTodayTime');
    if (tEl) tEl.textContent = hrs > 0 ? `${hrs}ч ${remMin}м` : `${min}м`;
  },
}