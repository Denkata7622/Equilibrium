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

export const ACHIEVEMENTS = [
  { id: "first-point", icon: "sparkles", name: "First Light", desc: "Complete your first point", check: () => Stats.done() >= 1 },
  { id: "10-points", icon: "zap", name: "Kindled", desc: "Complete 10 points", check: () => Stats.done() >= 10 },
  { id: "25-points", icon: "trending-up", name: "Ascendant", desc: "Complete 25 points", check: () => Stats.done() >= 25 },
  { id: "50-points", icon: "rocket", name: "To The Stars", desc: "Complete 50 points", check: () => Stats.done() >= 50 },
  { id: "90-points", icon: "crown", name: "Olympian", desc: "Complete 90 points", check: () => Stats.done() >= 90 },
  { id: "130-points", icon: "trophy", name: "Completionist", desc: "Complete 130+ points", check: () => Stats.done() >= 130 },
  { id: "step1-done", icon: "compass", name: "Pathfinder", desc: "Complete all of Step 1", check: () => Stats.stepDone(1) },
  { id: "step3-done", icon: "atom", name: "Number Alchemist", desc: "Complete all of Step 3", check: () => Stats.stepDone(3) },
  { id: "step6-done", icon: "scale", name: "Equilibrium", desc: "Complete all of Step 6", check: () => Stats.stepDone(6) },
  { id: "step12-done", icon: "brain-circuit", name: "Projective Master", desc: "Complete all of Step 12", check: () => Stats.stepDone(12) },
  { id: "streak-3", icon: "waves", name: "Momentum", desc: "Reach a 3-day streak", check: () => Store.state.streak.count >= 3 },
  { id: "streak-7", icon: "flame", name: "Blaze", desc: "Reach a 7-day streak", check: () => Store.state.streak.count >= 7 },
  { id: "streak-30", icon: "mountain", name: "Titan", desc: "Reach a 30-day streak", check: () => Store.state.streak.count >= 30 },
  { id: "first-quiz", icon: "target", name: "First Trial", desc: "Complete your first Quiz", check: () => Object.keys(Store.state.quiz).length >= 1 },
  { id: "quiz-20", icon: "brain", name: "Keen Mind", desc: "Answer 20 Quiz questions", check: () => Object.keys(Store.state.quiz).length >= 20 },
  { id: "quiz-perfect", icon: "gem", name: "Flawless", desc: "Score 100% on a Quiz (10+)", check: () => Quiz.stats.correct >= 10 && Quiz.stats.wrong === 0 },
  { id: "time-1h", icon: "clock", name: "First Hour", desc: "Study for 1 hour total", check: () => Stats.totalTime() >= 3600 },
  { id: "time-10h", icon: "hourglass", name: "Devoted", desc: "Study for 10 hours total", check: () => Stats.totalTime() >= 36000 },
  { id: "time-50h", icon: "infinity", name: "Iron Will", desc: "Study for 50 hours total", check: () => Stats.totalTime() >= 180000 },
  { id: "goal-1", icon: "check-circle-2", name: "Goal Slayer", desc: "Hit your daily goal once", check: () => {
      const today = Utils.todayStr();
      return (Store.state.dailyLog[today]?.seconds || 0) >= (Store.state.dailyGoalMinutes || 120) * 60;
    }},
  { id: "first-problem", icon: "pencil", name: "First Solve", desc: "Log your first problem", check: () => Store.state.problemLog.length >= 1 },
  { id: "10-problems", icon: "book-marked", name: "Archivist", desc: "Log 10 problems", check: () => Store.state.problemLog.length >= 10 },
  { id: "exam-1", icon: "timer", name: "Simulated", desc: "Complete your first exam simulation", check: () => (Store.state.examHistory || []).length >= 1 },
  { id: "exam-20", icon: "award", name: "Contender", desc: "Score 20+/28 on exam sim", check: () => (Store.state.examHistory || []).some(e => e.total >= 20) },
]