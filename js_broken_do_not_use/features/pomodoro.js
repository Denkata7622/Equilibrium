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

export const Pomodoro = {
  mode: 'focus',
  remaining: CONFIG.pomo.focus,
  running: false,
  interval: null,
  sessions: 0,
  endTime: null,          // NEW: absolute timestamp when timer hits 0
  _lastRenderedSec: -1,   // NEW: avoid redundant renders

  toggle() {
    if (this.running) {
      // PAUSE: compute actual remaining from clock
      this.remaining = Math.max(0, Math.round((this.endTime - Date.now()) / 1000));
      clearInterval(this.interval);
      this.running = false;
      this.endTime = null;
    } else {
      // RESUME / START
      if (this.remaining <= 0) this.remaining = this._modeDuration();
      this.running = true;
      this.endTime = Date.now() + this.remaining * 1000;
      // Faster tick = smoother display + drift correction via Date.now()
      this.interval = setInterval(() => this.tick(), 200);
    }
    this.render();
  },

  tick() {
    if (!this.running || this.endTime == null) return;
    const now = Date.now();
    const newRemaining = Math.max(0, Math.round((this.endTime - now) / 1000));

    // Only re-render when the second changes (avoids jank)
    if (newRemaining === this._lastRenderedSec) return;
    this._lastRenderedSec = newRemaining;
    this.remaining = newRemaining;

    if (this.remaining <= 0) {
      clearInterval(this.interval);
      this.running = false;
      this.endTime = null;
      this._onComplete();
    }
    this.render();
  },

  _onComplete() {
    // Beep (soft) using WebAudio (no external file needed)
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ac = new AC();
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
        o.start(); o.stop(ac.currentTime + 0.6);
      }
    } catch (e) {}

    if (this.mode === 'focus') {
      Store.state.pomodoroSessions++;
      Store.save();
      Utils.toast('Pomodoro complete!', 'timer');
      this.sessions++;
      this.mode = (this.sessions % 4 === 0) ? 'longBreak' : 'shortBreak';
      this.remaining = this._modeDuration();
    } else {
      Utils.toast('Back to work', 'play');
      this.mode = 'focus';
      this.remaining = this._modeDuration();
    }
    this._lastRenderedSec = this.remaining;
    Stats.update();
  },

  _modeDuration() {
    if (this.mode === 'focus') return CONFIG.pomo.focus;
    if (this.mode === 'shortBreak') return CONFIG.pomo.shortBreak;
    return CONFIG.pomo.longBreak;
  },

  reset() {
    clearInterval(this.interval);
    this.running = false;
    this.endTime = null;
    this.mode = 'focus';
    this.remaining = CONFIG.pomo.focus;
    this._lastRenderedSec = this.remaining;
    this.render();
  },

  render() {
    const total = this._modeDuration();
    const elapsed = total - this.remaining;
    const pct = Math.round(elapsed / total * 100);
    const ring = document.querySelector('.pomodoro .pomo-ring');
    if (ring) ring.style.setProperty('--pomo-pct', pct + '%');
    const pomo = document.getElementById('pomodoro');
    if (pomo) pomo.classList.toggle('running', this.running);

    document.getElementById('pomoTime').textContent = Utils.fmtTime(this.remaining);

    const modeEl = document.getElementById('pomoMode');
    const timeEl = document.getElementById('pomoTime');
    if (this.mode === 'focus') { modeEl.textContent = 'FOCUS'; timeEl.classList.remove('break'); }
    else if (this.mode === 'shortBreak') { modeEl.textContent = 'BREAK'; timeEl.classList.add('break'); }
    else { modeEl.textContent = 'LONG BREAK'; timeEl.classList.add('break'); }

    const playBtn = document.getElementById('pomoPlay');
    playBtn.innerHTML = Utils.iconSVG(this.running ? 'pause' : 'play', 16);
    playBtn.classList.toggle('play', !this.running);

    document.getElementById('pomoDone').textContent = Store.state.pomodoroSessions;
    this.syncModal();
    Utils.refreshIcons();
  },

  syncModal() {
    const mt = document.getElementById('pmPomoTime');
    const mtg = document.getElementById('pmPomoToggle');
    const pdfPomoTime = document.getElementById('pdfPomoTime');
    const pdfPomo = document.getElementById('pdfPomo');
    if (mt) mt.textContent = Utils.fmtTime(this.remaining);
    if (mtg) mtg.innerHTML = Utils.iconSVG(this.running ? 'pause' : 'play', 14);
    if (pdfPomoTime) pdfPomoTime.textContent = Utils.fmtTime(this.remaining);
    if (pdfPomo) pdfPomo.classList.toggle('running', this.running);
    Utils.refreshIcons();
  },

  openSettings() {
    const p = Store.state.pomoSettings || { focus: 25, shortBreak: 5, longBreak: 15 };
    document.getElementById('pomoFocusInp').value = p.focus;
    document.getElementById('pomoShortInp').value = p.shortBreak;
    document.getElementById('pomoLongInp').value = p.longBreak;
    document.getElementById('pomoSettingsOverlay').classList.add('open');
    Utils.refreshIcons();
  },
  closeSettings() {
    document.getElementById('pomoSettingsOverlay').classList.remove('open');
  },
  saveSettings() {
    const f = Math.max(5, Math.min(120, parseInt(document.getElementById('pomoFocusInp').value) || 25));
    const s = Math.max(1, Math.min(30, parseInt(document.getElementById('pomoShortInp').value) || 5));
    const l = Math.max(5, Math.min(60, parseInt(document.getElementById('pomoLongInp').value) || 15));
    Store.state.pomoSettings = { focus: f, shortBreak: s, longBreak: l };
    Store.save();
    CONFIG.pomo.focus = f * 60;
    CONFIG.pomo.shortBreak = s * 60;
    CONFIG.pomo.longBreak = l * 60;
    this.remaining = this._modeDuration();
    this._lastRenderedSec = this.remaining;
    this.render();
    this.updateLabel();
    this.closeSettings();
    Utils.toast(`Pomodoro: ${f}/${s}/${l}`, 'timer');
  },
  updateLabel() {
    const lbl = document.getElementById('pomoLabel');
    if (lbl) {
      const p = Store.state.pomoSettings || { focus: 25, shortBreak: 5, longBreak: 15 };
      lbl.textContent = `${p.focus}/${p.shortBreak}/${p.longBreak}`;
    }
  },
}