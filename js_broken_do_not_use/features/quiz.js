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

export const Quiz = {
  queue: [],
  index: 0,
  stats: { correct: 0, wrong: 0, skipped: 0 },
  currentAnswerShown: false,
  open() {
    this.buildQueue();
    if (!this.queue.length) {
      Utils.toast('No points for Quiz', 'target');
      return;
    }
    this.index = 0;
    this.stats = { correct: 0, wrong: 0, skipped: 0 };
    document.getElementById('quizOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    this.render();
  },
  close() {
    document.getElementById('quizOverlay').classList.remove('open');
    document.body.style.overflow = '';
  },
  buildQueue() {
    const now = Date.now();
    const all = getFlatPoints();
    const due = all.filter(x => {
      const q = Store.state.quiz[x.point.id];
      return q && q.nextReview && q.nextReview <= now;
    });
    const fresh = all.filter(x => !Store.state.quiz[x.point.id] && !Store.getPoint(x.point.id).done);
    const weak = all.filter(x => {
      const q = Store.state.quiz[x.point.id];
      return q && q.correct < 3 && !due.includes(x);
    });
    const any = all.filter(x => Store.getPoint(x.point.id).done);
    this.queue = [
      ...this.shuffle(due),
      ...this.shuffle(fresh),
      ...this.shuffle(weak),
    ].slice(0, 20);
    if (!this.queue.length) this.queue = this.shuffle(any).slice(0, 10);
  },
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  render() {
    if (this.index >= this.queue.length) return this.finish();
    const item = this.queue[this.index];
    const p = item.point;
    document.getElementById('quizProgress').textContent = (this.index + 1) + ' / ' + this.queue.length;
    const qqEl = document.getElementById('quizQuestion');
    qqEl.textContent = p.title;
    qqEl.dataset.mathDone = '';
    const ansEl = document.getElementById('quizAnswer');
    ansEl.textContent = (p.explanation || p.desc || '').split('\n\n')[0];
    ansEl.dataset.mathDone = '';
    ansEl.classList.remove('show');
    this.currentAnswerShown = false;
    document.getElementById('quizActions').innerHTML =
      '<button class="quiz-btn show" onclick="Quiz.showAnswer()"><i data-lucide="eye"></i> SHOW (Space)</button>';
    this.renderStats();
    Utils.refreshIcons();
  },
  renderStats() {
    const s = this.stats;
    document.getElementById('quizStats').innerHTML =
      `<span><i data-lucide="check-circle-2"></i> Correct: ${s.correct}</span>
       <span><i data-lucide="x-circle"></i> Wrong: ${s.wrong}</span>
       <span><i data-lucide="skip-forward"></i> Skipped: ${s.skipped}</span>`;
    Utils.refreshIcons();
  },
  showAnswer() {
    if (this.currentAnswerShown) return;
    this.currentAnswerShown = true;
    document.getElementById('quizAnswer').classList.add('show');
    document.getElementById('quizActions').innerHTML = `
      <button class="quiz-btn correct" onclick="Quiz.answer(true)">KNOW (1)</button>
      <button class="quiz-btn wrong" onclick="Quiz.answer(false)">DON'T KNOW (2)</button>
      <button class="quiz-btn skip" onclick="Quiz.skip()">SKIP (3)</button>
    `;
  },
  answer(correct) {
    const item = this.queue[this.index];
    const id = item.point.id;
    this.sm2(id, correct);
    if (correct) this.stats.correct++;
    else this.stats.wrong++;
    Achievements.check();
    this.index++;
    this.render();
  },
  skip() {
    this.stats.skipped++;
    this.index++;
    this.render();
  },
  sm2(id, correct) {
    let q = Store.state.quiz[id] || { ease: 2.5, interval: 1, nextReview: 0, attempts: 0, correct: 0 };
    q.attempts++;
    if (correct) {
      q.correct++;
      q.interval = q.interval === 1 ? 1 : Math.round(q.interval * q.ease);
      q.ease = Math.max(1.3, q.ease + 0.1);
    } else {
      q.interval = 1;
      q.ease = Math.max(1.3, q.ease - 0.2);
    }
    q.nextReview = Date.now() + q.interval * 24 * 60 * 60 * 1000;
    Store.state.quiz[id] = q;
    Store.save();
  },
  finish() {
    const total = this.stats.correct + this.stats.wrong + this.stats.skipped;
    const pct = total ? Math.round(this.stats.correct / total * 100) : 0;
    document.getElementById('quizProgress').textContent = 'FINISHED';
    document.getElementById('quizQuestion').textContent = `Result: ${this.stats.correct}/${total} (${pct}%)`;
    document.getElementById('quizAnswer').classList.remove('show');
    document.getElementById('quizActions').innerHTML = `
      <button class="quiz-btn show" onclick="Quiz.open()">TRY AGAIN</button>
      <button class="quiz-btn skip" onclick="Quiz.close()">CLOSE</button>
    `;
  },
}