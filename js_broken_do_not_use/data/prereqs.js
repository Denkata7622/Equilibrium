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

export const PREREQS = {
  "1.2":["1.1"], "1.3":["1.1","1.2"], "1.4":["1.1"],
  "1.8":["1.1","1.2","1.5"], "1.11":["1.7"],
  "2.1":["1.3","1.4"], "2.2":["2.1"], "2.3":["1.4"], "2.4":["2.2","2.3"], "2.5":["2.1","1.4"],
  "2.9":["1.2","1.10"],
  "2.10":["1.2","1.5"],
  "2.11":["1.2","1.5","1.8"],
  "2.12":["2.5","2.1"],
  "3.2":["3.1"], "3.3":["3.2"], "3.4":["3.2","3.3"], "3.5":["3.3"],
  "3.6":["3.2"], "3.7":["3.4"], "3.8":["3.3","3.4","3.7"],
  "3.9":["3.2","3.3"], "3.10":["4.1"], "3.11":["3.2","5.4"], "3.12":["3.1"],
  "4.1":["3.1"], "4.2":["3.1"],
  "4.4":["3.8","3.9"], "4.7":["3.1","3.4"], "4.8":["3.9"],
  "4.9":["4.7","8.3"], "4.10":["4.2","4.4","4.5"],
  "5.1":["5.4"], "5.2":["5.1"], "5.3":["5.1","5.2"], "5.4":["5.3"],
  "5.6":["5.1"], "5.8":["5.1","5.4"],
  "5.9":["5.1"], "5.10":["5.9"], "5.11":["5.4"], "5.12":["5.3","5.4"],
  "6.2":["6.1"], "6.3":["6.1"], "6.4":["6.1"], "6.5":["6.1"],
  "6.6":["6.1"], "6.7":["6.6"], "6.8":["6.1"], "6.9":["6.8"], "6.10":["6.4","6.5"],
  "7.2":["7.1"], "7.3":["7.1"], "7.4":["7.1"], "7.5":["7.1"],
  "7.6":["7.1"], "7.7":["7.1"], "7.8":["7.7"], "7.9":["7.3","7.5","7.8"],
  "8.2":["8.1"], "8.3":["8.1"], "8.4":["8.3"], "8.5":["8.4"],
  "8.6":["8.5"], "8.7":["8.6"], "8.8":["8.3","8.5"], "8.9":["8.4"],
  "8.11":["8.2","8.3"], "8.12":["8.3","8.5"], "8.14":["8.3"],
  "9.2":["9.1"], "9.3":["9.1"], "9.4":["9.1"], "9.5":["9.4"],
  "9.6":["9.4","9.5"], "9.7":["9.1","9.4"], "9.10":["9.8"], "9.11":["9.8"],
  "11.5":["6.1"], "11.6":["5.1","7.5"], "11.7":["5.1","5.3"], "11.8":["1.3","2.1","2.2"],
  "12.1":["12.2"], "12.2":["1.2"], "12.3":["2.1","2.5","2.6"],
  "13.1":["8.3"], "13.3":["5.3"], "13.4":["9.7"],
}