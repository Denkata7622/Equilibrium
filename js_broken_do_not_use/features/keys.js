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

export const Keys = {
  init() { document.addEventListener('keydown', e => this.handle(e)); },
  handle(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const inField = tag === 'input' || tag === 'textarea' || tag === 'select';
    const scratchOpen = document.getElementById('scratchOverlay').classList.contains('open');
    const examOpen = document.getElementById('examOverlay').classList.contains('open');
    const repOpen = document.getElementById('repOverlay').classList.contains('open');
    const paletteOpen = document.getElementById('paletteOverlay').classList.contains('open');
    const helpOpen = document.getElementById('helpOverlay').classList.contains('open');
    const modalOpen = document.getElementById('pointModal').classList.contains('open');
    const quizOpen = document.getElementById('quizOverlay').classList.contains('open');
    const achOpen = document.getElementById('achOverlay').classList.contains('open');
    const reportOpen = document.getElementById('reportOverlay').classList.contains('open');
    const sheetOpen = document.getElementById('sheetOverlay').classList.contains('open');
    const plogOpen = document.getElementById('plogOverlay').classList.contains('open');
    const toolsOpen = document.getElementById('toolsOverlay').classList.contains('open');
    const videoOpen = document.getElementById('videoModal').classList.contains('open');
    const progOpen = document.getElementById('progOverlay').classList.contains('open');

    // Ctrl+Z: Scratchpad (ако е отворен) или глобален Undo
    if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
      if (scratchOpen) { e.preventDefault(); Scratchpad.undo(); return; }
      if (!inField) { e.preventDefault(); History.undo(); return; }
    }

    if (e.key === 'Escape') {
      if (progOpen) { StatsModal.close(); return; }
      if (scratchOpen) { Scratchpad.close(); return; }
      if (examOpen) { ExamSim.close(); return; }
      if (repOpen) { SpacedRep.close(); return; }
      if (videoOpen) { Videos.close(); return; }
      if (toolsOpen) { Tools.close(); return; }
      if (paletteOpen) { Palette.close(); return; }
      if (helpOpen) { Help.close(); return; }
      if (quizOpen) { Quiz.close(); return; }
      if (achOpen) { Achievements.close(); return; }
      if (reportOpen) { Report.close(); return; }
      if (sheetOpen) { Formulas.close(); return; }
      if (plogOpen) { ProblemLog.close(); return; }
      if (modalOpen) { Modal.close(); return; }
      if (inField) { e.target.blur(); return; }
      return;
    }

    // Scratchpad tool shortcuts (only when scratchpad is open)
    if (scratchOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'g') { e.preventDefault(); Scratchpad.toggleGrid(); return; }
      if (k === 'p') { e.preventDefault(); Scratchpad.tool('pen'); return; }
      if (k === 'l') { e.preventDefault(); Scratchpad.tool('line'); return; }
      if (k === 't') { e.preventDefault(); Scratchpad.tool('text'); return; }
      if (k === 'e') { e.preventDefault(); Scratchpad.tool('eraser'); return; }
    }

    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault(); Tools.open(); return;
    }

    if (quizOpen) {
      if (e.key === ' ' && !Quiz.currentAnswerShown) { e.preventDefault(); Quiz.showAnswer(); return; }
      if (e.key === '1') { Quiz.answer(true); return; }
      if (e.key === '2') { Quiz.answer(false); return; }
      if (e.key === '3') { Quiz.skip(); return; }
      return;
    }

    if (helpOpen || scratchOpen || examOpen || repOpen) return;

    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault(); Palette.open(); return;
    }

    if (modalOpen) {
      if (inField) return;
      if (e.shiftKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); Modal.togglePdfFocus(); return; }
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); DeepDive.open(State.currentModalId); return; }
      if (e.key === 'b' || e.key === 'B') { Modal.addBookmark(); return; }
      if (e.key === 'p' || e.key === 'P') { document.getElementById('pdfSearch').focus(); e.preventDefault(); return; }
      if (e.key === 'j' || e.key === 'J') { Modal.navigate(1); return; }
      if (e.key === 'k' || e.key === 'K') { Modal.navigate(-1); return; }
      if (e.key === ' ') { e.preventDefault(); Modal.toggleDone(); return; }
      if (e.key === 'n' || e.key === 'N') { document.getElementById('pmNotes').focus(); e.preventDefault(); return; }
      if (e.key === 't' || e.key === 'T') { Pomodoro.toggle(); return; }
      if (e.key === 'g' || e.key === 'G') { Theme.cycle(); return; }
      return;
    }

    if (inField) return;

    if (e.key === '/') { e.preventDefault(); document.getElementById('searchInput').focus(); return; }
    if (e.key === '?') { Help.open(); return; }
    if (e.key === 'q' || e.key === 'Q') { Quiz.open(); return; }
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); Scratchpad.open(); return; }
    if (e.key === 'x' || e.key === 'X') { ExamSim.open(); return; }
    if (e.key === 'v' || e.key === 'V') { SpacedRep.open(); return; }
    if (e.key === 'f' || e.key === 'F') { Focus.toggle(); return; }
    if (e.key === 'r' || e.key === 'R') { Random.jump(); return; }
    if (e.key === 'h' || e.key === 'H') { Recent.toggle(); return; }
    if (e.key === 'j' || e.key === 'J') { this.navigate(1); return; }
    if (e.key === 'k' || e.key === 'K') { this.navigate(-1); return; }
    if (e.key === 't' || e.key === 'T') { Pomodoro.toggle(); return; }
    if (e.key === 'g' || e.key === 'G') { Theme.cycle(); return; }
    if (e.key === 'e' || e.key === 'E') { Content.expandAll(); return; }
    if (e.key === 'c' || e.key === 'C') { Content.collapseAll(); return; }
    // Track current visible point via intersection, avoid elementFromPoint()
    const getCurrentPointEl = () => {
      // 1. If user has a tracked current index, use it
      const flat = getFlatPoints();
      if (State.currentIndex >= 0 && State.currentIndex < flat.length) {
        const el = document.querySelector(`[data-pid="${flat[State.currentIndex].point.id}"]`);
        if (el) return el;
      }
      // 2. Otherwise pick the first visible point on screen
      const allPoints = document.querySelectorAll('.point');
      for (const el of allPoints) {
        const r = el.getBoundingClientRect();
        if (r.top >= 0 && r.bottom <= window.innerHeight) return el;
        if (r.top >= 0 && r.top <= window.innerHeight) return el;
      }
      return allPoints[0] || null;
    };

    if (e.key === 'Enter') {
      const card = getCurrentPointEl();
      if (card) { Modal.open(card.dataset.pid); e.preventDefault(); return; }
    }
    if (e.key === ' ') {
      e.preventDefault();
      const card = getCurrentPointEl();
      if (card) {
        PointActions.toggleDone(card.dataset.pid);
        State.currentIndex = parseInt(card.dataset.idx);
      }
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      const card = getCurrentPointEl();
      if (card) {
        card.classList.add('expanded');
        const ta = card.querySelector('.notes-area');
        if (ta) ta.focus();
      }
      return;
    }
  },
  navigate(delta) {
    const flat = getFlatPoints();
    const visibleIds = flat.filter(x => matchFilter(x.point) && matchSearch(x.point)).map(x => x.point.id);
    if (!visibleIds.length) return;
    let pos = visibleIds.indexOf(flat[State.currentIndex]?.point.id);
    if (pos === -1) pos = 0;
    else pos = Math.max(0, Math.min(visibleIds.length - 1, pos + delta));
    const targetId = visibleIds[pos];
    State.currentIndex = flat.findIndex(x => x.point.id === targetId);
    Content.scrollToPoint(targetId);
  },
}