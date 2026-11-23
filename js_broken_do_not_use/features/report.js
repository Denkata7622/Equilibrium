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

export const Report = {
  open() {
    this.render();
    document.getElementById('reportOverlay').classList.add('open');
  },
  close() {
    document.getElementById('reportOverlay').classList.remove('open');
  },
  render() {
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      days.push({ key, date: d, log: Store.state.dailyLog[key] || { seconds: 0, points: [] } });
    }
    const totalSec = days.reduce((s, d) => s + d.log.seconds, 0);
    const uniquePoints = new Set();
    days.forEach(d => d.log.points.forEach(p => uniquePoints.add(p)));
    const sessions = Store.state.sessions.filter(s => s.end > now.getTime() - 7*24*60*60*1000);
    const avgSession = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.end - x.start), 0) / sessions.length / 60000) : 0;
    const stepCount = {};
    uniquePoints.forEach(id => {
      const step = STEPS.find(s => s.points.some(p => p.id === id));
      if (step) stepCount[step.id] = (stepCount[step.id] || 0) + 1;
    });
    const topStep = Object.entries(stepCount).sort((a,b) => b[1]-a[1])[0];
    const start = days[0].date;
    const end = days[6].date;
    document.getElementById('reportPeriod').textContent =
      `${start.getDate()}.${start.getMonth()+1} – ${end.getDate()}.${end.getMonth()+1}.${end.getFullYear()}`;
    document.getElementById('reportStats').innerHTML = `
      <div class="report-stat"><div class="val">${Math.floor(totalSec/3600)}h ${Math.floor((totalSec%3600)/60)}m</div><div class="lbl">TOTAL TIME</div></div>
      <div class="report-stat"><div class="val">${uniquePoints.size}</div><div class="lbl">DISTINCT POINTS</div></div>
      <div class="report-stat"><div class="val">${sessions.length}</div><div class="lbl">SESSIONS</div></div>
      <div class="report-stat"><div class="val">${avgSession}m</div><div class="lbl">AVG SESSION</div></div>
      <div class="report-stat"><div class="val">${Store.state.streak.count}</div><div class="lbl">STREAK DAYS</div></div>
      <div class="report-stat"><div class="val">${topStep ? 'Step ' + topStep[0] : '—'}</div><div class="lbl">TOP TOPIC</div></div>
    `;
    const tips = [];
    if (totalSec < 3 * 3600) tips.push('Under 3 hours this week. Try adding one session per day.');
    if (totalSec > 10 * 3600) tips.push('Excellent week! Over 10 hours.');
    if (uniquePoints.size < 5) tips.push('Vary your topics — try Random (R).');
    if (avgSession < 15) tips.push('Your sessions are short. Try Pomodoro 25/5.');
    if (Store.state.streak.count === 0) tips.push('No active streak. Open a point and start.');
    const weakSteps = STEPS.filter(s => {
      const done = s.points.filter(p => Store.getPoint(p.id).done).length;
      return done / s.points.length < 0.3;
    }).slice(0, 2);
    if (weakSteps.length) tips.push('Weak topics: ' + weakSteps.map(s => 'Step ' + s.id).join(', '));
    document.getElementById('reportTips').innerHTML = tips.length ? tips.map(t => '<div>• ' + t + '</div>').join('') : '<div>• Keep going! 🚀</div>';
  },
  checkAutoShow() {
    const now = new Date();
    if (now.getDay() !== 1) return;
    const week = now.getFullYear() + '-' + Math.ceil((now - new Date(now.getFullYear(),0,1)) / 604800000);
    if (Store.state.lastReportShown === week) return;
    Store.state.lastReportShown = week;
    Store.save();
    setTimeout(() => this.open(), 2000);
  },
}