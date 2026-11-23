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

export const Today = {
  render() {
    const today = Utils.todayStr();
    const log = Store.state.dailyLog[today] || { seconds: 0 };
    const sec = log.seconds;
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const remMin = min % 60;

    const tEl = document.getElementById('heroTodayTime');
    if (tEl) tEl.textContent = hrs > 0 ? `${hrs}ч ${remMin}м` : `${min}м`;

    const iconEl = document.getElementById('heroSessionIcon');
    if (iconEl) {
      const live = !!(TimeTracker && TimeTracker.sessionStart);
      iconEl.classList.toggle('live', live);
      if (tEl) tEl.classList.toggle('live', live);
    }

    // Daily task banner от плана
    this.renderDailyTask();
  },

  getTodayTask() {
    const start = CONFIG.planStartDate;
    const now = new Date();
    const daysSince = Math.floor((now - start) / 86400000);
    if (daysSince < 0) return null;
    const weekIdx = Math.floor(daysSince / 7) + 1;
    for (const phase of PLAN_PHASES) {
      for (const w of phase.weeks_data) {
        if (w.week === weekIdx) return { phase, week: w, weekIdx };
      }
    }
    return null;
  },

  renderDailyTask() {
    const hero = document.getElementById('todayHero');
    if (!hero) return;
    let banner = document.getElementById('dailyTaskBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'dailyTaskBanner';
      banner.style.cssText = 'flex-basis:100%;order:10;padding:8px 12px;background:var(--surface-2);border:1px dashed var(--border-2);border-radius:5px;font-size:12px;color:var(--text-2);display:flex;gap:10px;align-items:center;';
      hero.appendChild(banner);
    }
    const task = this.getTodayTask();
    if (!task) { banner.style.display = 'none'; return; }
    banner.style.display = 'flex';
    banner.innerHTML = `
      <i data-lucide="calendar-check" style="width:14px;height:14px;color:var(--accent)"></i>
      <span style="color:var(--accent);font-size:10px;letter-spacing:2px;">СЕДМИЦА ${task.weekIdx}</span>
      <span style="color:var(--text-3);">·</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <b style="color:var(--text)">MAIN:</b> ${Utils.escapeHtml(task.week.main)}
      </span>
      <button class="mini-btn" onclick="Tabs.switch('plan')" title="Open plan" style="width:22px;height:22px;">
        <i data-lucide="arrow-right" style="width:12px;height:12px"></i>
      </button>
    `;
    Utils.refreshIcons();
  }
}

export const Goal = {
  render() {
    const today = Utils.todayStr();
    const log = Store.state.dailyLog[today] || { seconds: 0 };
    this._render(log.seconds);
  },
  renderLive(seconds) { this._render(seconds); },
  _render(sec) {
    const mins = Math.floor(sec / 60);
    const goal = Store.state.dailyGoalMinutes || 120;
    const pct = Math.min(100, Math.round(mins / goal * 100));
    const el = document.getElementById('goalLabel');
    const fill = document.getElementById('goalFill');
    if (el) el.textContent = `${mins} / ${goal} MIN`;
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.toggle('done', pct >= 100);
    }
  },
  setGoal(minutes) {
    Store.state.dailyGoalMinutes = minutes;
    Store.save();
    this.render();
  },
}

export const Calendar = {
  render() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const today = new Date();
    let total = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      const sec = Store.state.streak.history[key] || 0;
      total += sec;
      const cell = document.createElement('div');
      let lvl = 0;
      if (sec > 3600) lvl = 4;
      else if (sec > 1800) lvl = 3;
      else if (sec > 600) lvl = 2;
      else if (sec > 60) lvl = 1;
      cell.className = 'calendar-cell' + (lvl ? ' l'+lvl : '') + (i === 0 ? ' today' : '');
      cell.title = key + ' · ' + Math.floor(sec/60) + ' min';
      grid.appendChild(cell);
    }
    const t = document.getElementById('calTotal');
    if (t) t.textContent = Math.floor(total/3600) + 'h';
  },
}

export const FormulaOfDay = {
  pool: [
    { text: "Menelaus: (BM/MC)·(CN/NA)·(AP/PB) = 1", pointId: "1.1" },
    { text: "Ceva: AM, BN, CP concurrent ⇔ product = 1", pointId: "1.2" },
    { text: "Ptolemy: AC·BD = AB·CD + BC·AD (cyclic)", pointId: "1.3" },
    { text: "Euler: IO² = R² − 2Rr", pointId: "1.8" },
    { text: "Fermat: a^(p−1) ≡ 1 (mod p)", pointId: "3.3" },
    { text: "Euler (NT): a^φ(n) ≡ 1 (mod n)", pointId: "3.4" },
    { text: "Wilson: (p−1)! ≡ −1 (mod p)", pointId: "3.5" },
    { text: "Vieta (quad): x₁+x₂ = −p, x₁x₂ = q", pointId: "5.1" },
    { text: "Newton: S_k + a₁S_{k−1} + ... + k a_k = 0", pointId: "5.2" },
    { text: "AM-GM: (∑a_i)/n ≥ ⁿ√(∏a_i)", pointId: "6.1" },
    { text: "Cauchy: (∑a_ib_i)² ≤ (∑a_i²)(∑b_i²)", pointId: "6.4" },
    { text: "Jensen: f(avg) ≤ avg(f) for convex f", pointId: "6.5" },
    { text: "Schur: x³+y³+z³+3xyz ≥ xy(x+y)+...", pointId: "6.9" },
    { text: "Dirichlet: n+1 objects, n boxes ⇒ 2 in one", pointId: "8.1" },
    { text: "Linear Diophantine: ax+by=c ⇒ gcd(a,b) | c", pointId: "4.1" },
    { text: "Pythagoras: x=m²−n², y=2mn, z=m²+n²", pointId: "4.2" },
    { text: "Turán: ex(n,K_{r+1}) = (1−1/r)·n²/2", pointId: "9.5" },
    { text: "Ramsey: R(3,3) = 6", pointId: "9.6" },
    { text: "Pick: S = I + B/2 − 1", pointId: "1.11" },
    { text: "Sperner: max antichain = C(n,⌊n/2⌋)", pointId: "4.9" },
  ],
  current: null,
  init() {
    const today = Utils.todayStr();
    if (Store.state.formulaOfDay && Store.state.formulaOfDay.date === today) {
      this.current = this.pool.find(f => f.text === Store.state.formulaOfDay.text) || this.pool[0];
    } else {
      const seed = today.split('-').join('') | 0;
      this.current = this.pool[seed % this.pool.length];
      Store.state.formulaOfDay = { date: today, text: this.current.text };
      Store.save();
    }
    const el = document.getElementById('fodText');
    if (el) el.textContent = this.current.text;
  },
  jump() {
    if (this.current) {
      if (Tabs.current !== 'study') Tabs.switch('study');
      Content.scrollToPoint(this.current.pointId);
    }
  },
}

export const Recent = {
  track(pointId) {
    let r = Store.state.recentPoints.filter(x => x !== pointId);
    r.unshift(pointId);
    Store.state.recentPoints = r.slice(0, 20);
    Store.state.lastPoint = pointId;
    Store.save();
    this.renderPanel();
    this.renderContinue();
  },
  toggle() {
    const panel = document.getElementById('recentPanel');
    const wasOpen = panel.classList.contains('open');
    UI.closeMenus();
    if (!wasOpen) {
      panel.classList.add('open');
      this.renderPanel();
    }
  },
  renderPanel() {
    const panel = document.getElementById('recentPanel');
    if (!panel) return;
    const ids = Store.state.recentPoints;
    if (!ids.length) {
      panel.innerHTML = '<div class="recent-empty">No history yet</div>';
      return;
    }
    panel.innerHTML = ids.map(id => {
      const p = getPoint(id);
      if (!p) return '';
      return `<div class="recent-item" onclick="Recent.jump('${id}')">
        <i data-lucide="dot"></i>
        <span class="pn">${id}</span>
        <span>${p.title}</span>
      </div>`;
    }).join('');
    Utils.refreshIcons();
  },
  jump(id) {
    document.getElementById('recentPanel').classList.remove('open');
    if (Tabs.current !== 'study') Tabs.switch('study');
    Content.scrollToPoint(id);
  },
  renderContinue() {
    const btn = document.getElementById('continueBtn');
    const pt = document.getElementById('continuePt');
    if (!btn || !pt) return;
    const id = Store.state.lastPoint;
    if (!id) { btn.classList.remove('show'); return; }
    const p = getPoint(id);
    if (!p) { btn.classList.remove('show'); return; }
    pt.textContent = id + ' · ' + p.title;
    btn.classList.add('show');
  },
  continueFrom() {
    const id = Store.state.lastPoint;
    if (id) {
      if (Tabs.current !== 'study') Tabs.switch('study');
      Content.scrollToPoint(id);
    }
  },
}

export const Random = {
  jump() {
    const flat = getFlatPoints();
    const notDone = flat.filter(x => !Store.getPoint(x.point.id).done);
    const pool = notDone.length ? notDone : flat;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (Tabs.current !== 'study') Tabs.switch('study');
    Content.scrollToPoint(pick.point.id);
    Utils.toast(pick.point.id, 'dices');
  },
}

export const Focus = {
  toggle() {
    Store.state.ui.focus = !Store.state.ui.focus;
    document.body.classList.toggle('focus-mode', Store.state.ui.focus);
    Store.save();
    Utils.toast(Store.state.ui.focus ? 'Focus mode ON' : 'Focus mode OFF', 'eye');
  },
  init() {
    if (Store.state.ui.focus) document.body.classList.add('focus-mode');
  },
}
