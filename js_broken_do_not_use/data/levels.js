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

export const LEVELS = [
  {
    id: 0, name: 'ПРЕГОВОР', icon: '📖', weeks: '~2 седмици',
    dateRange: ['2026-10-16', '2026-10-30'],
    color: 'var(--text-3)',
    subtitle: 'Задължителна основа',
    description: 'Тривиална, но задължителна теория, която всички олимпиадни материали приемат за дадена',
    groups: [
      { name: 'Алгебра',             ids: ['R.1','R.2','R.3','R.4','R.5','R.6'] },
      { name: 'Геометрия',           ids: ['R.7','R.8','R.9','R.10','R.11'] },
      { name: 'Теория на числата',   ids: ['R.12','R.13'] },
      { name: 'Комбинаторика',       ids: ['R.14','R.15'] },
    ],
  },
  {
    id: 1, name: 'ОБЛАСТЕН КРЪГ', icon: '🏳', weeks: '~12 седмици',
    dateRange: ['2026-10-31', '2027-01-22'],
    color: 'var(--accent)',
    subtitle: 'Стандартни олимпиадни техники',
    description: 'Основни инструменти, които се появяват в задачите на областния кръг',
    groups: [
      { name: 'Геометрия – основни',      ids: ['1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','1.10','1.11'] },
      { name: 'ТЧ – основи',              ids: ['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12'] },
      { name: 'Полиноми',                 ids: ['5.1','5.2','5.3','5.4','5.5','5.6','5.7','5.8','5.9','5.10','5.11','5.12'] },
      { name: 'Неравенства – основи',     ids: ['6.1','6.2','6.3','6.4','6.5','6.6'] },
      { name: 'Комбинаторика – основи',   ids: ['8.1','8.2','8.3','8.4','8.5','8.6','8.7','8.8','8.10','8.15'] },
      { name: 'ФУ – леки',                ids: ['7.5','7.6'] },
    ],
  },
  {
    id: 2, name: 'НАЦИОНАЛЕН КРЪГ', icon: '🏆', weeks: '~8 седмици',
    dateRange: ['2027-01-23', '2027-03-20'],
    color: 'var(--warn)',
    subtitle: 'Напреднали техники',
    description: 'Инструменти за задачи от националния кръг',
    groups: [
      { name: 'Геометрия – напреднали',   ids: ['2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.10','2.11','2.12'] },
      { name: 'ТЧ – напреднали',          ids: ['4.1','4.2','4.3','4.4','4.5','4.6','4.7','4.8','4.9','4.10'] },
      { name: 'Неравенства – напреднали', ids: ['6.7','6.8','6.9','6.10'] },
      { name: 'ФУ – напреднали',          ids: ['7.1','7.2','7.3','7.4','7.7','7.8','7.9'] },
      { name: 'Графи и игри',             ids: ['9.1','9.2','9.3','9.4','9.5','9.6','9.7','9.8','9.9','9.10','9.11'] },
      { name: 'Комбинаторика – напреднали', ids: ['8.9','8.11','8.12','8.13','8.14'] },
    ],
  },
  {
    id: 3, name: 'IMO / СПЕЦИАЛИЗАЦИЯ', icon: '💎', weeks: '~2 седмици',
    dateRange: ['2027-03-21', '2027-04-02'],
    color: '#b88aff',
    subtitle: 'Най-трудните теми',
    description: 'Специализирани техники за международни олимпиади',
    groups: [
      { name: 'Бонус лекции',             ids: ['11.1','11.2','11.3','11.4'] },
      { name: 'Национални разширения',    ids: ['11.5','11.6','11.7','11.8'] },
      { name: 'Аналитична геометрия',     ids: ['12.1','12.2','12.3'] },
      { name: 'Адитивна комбинаторика',   ids: ['13.1','13.2','13.3','13.4'] },
    ],
  },
  {
    id: 4, name: 'СИМУЛАЦИИ', icon: '⏱', weeks: '~4 седмици',
    dateRange: ['2027-04-03', '2027-04-30'],
    color: 'var(--danger)',
    subtitle: 'Реални олимпиади',
    description: 'Пълни минали олимпиади под време',
    groups: [
      { name: 'Национални кръгове 2010–2015', ids: ['10.1','10.2','10.3','10.4','10.5','10.6','10.7','10.8','10.9','10.10'] },
      { name: 'Областни кръгове 2016–2026',   ids: ['10.11','10.12','10.13','10.14','10.15','10.16','10.17','10.18','10.19','10.20','10.21','10.22','10.23','10.24','10.25','10.26','10.27','10.28','10.29','10.30','10.31','10.32'] },
    ],
  },
]

export const PLAN_DAYS = [
  { day: "MON", icon: "book-open", activity: "Основна тема – теория", duration: "30 мин + 1 задача (30 мин)" },
  { day: "TUE", icon: "book-open", activity: "Основна тема – теория", duration: "30 мин + 1 задача (30 мин)" },
  { day: "WED", icon: "pencil-ruler", activity: "Основна тема – практика", duration: "2 задачи (1 час)" },
  { day: "THU", icon: "layers", activity: "Второстепенна тема – теория", duration: "30 мин + 1 задача (30 мин)" },
  { day: "FRI", icon: "layers", activity: "Второстепенна тема – практика", duration: "2 задачи (1 час)" },
  { day: "SAT", icon: "target", activity: "Смесени задачи", duration: "3 задачи (2 часа)" },
  { day: "SUN", icon: "coffee", activity: "Почивка или леко четене", duration: "По избор", rest: true },
]
