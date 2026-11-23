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

export const StatsModal = {
  currentTab: 'streak',
  open(tab) {
    if (tab) this.currentTab = tab;
    this.render();
    document.getElementById('progOverlay').classList.add('open');
    Utils.refreshIcons();
  },
  close() {
    document.getElementById('progOverlay').classList.remove('open');
  },
  switch(tab) {
    this.currentTab = tab;
    this.render();
  },
  render() {
    document.querySelectorAll('.prog-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === this.currentTab));
    const body = document.getElementById('progBody');
    if (this.currentTab === 'streak') this.renderStreak(body);
    else this.renderGoal(body);
    Utils.refreshIcons();
  },
  renderStreak(body) {
    const st = Store.state.streak;
    const best = st.best || st.count || 0;
    const history = st.history || {};

    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    let monthDays = 0;
    for (const k in history) {
      const parts = k.split('-').map(Number);
      if (parts[0] === y && parts[1] === m + 1 && (history[k] || 0) > 60) monthDays++;
    }

    let heatHtml = '<div class="heatmap-90">';
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      const sec = history[key] || 0;
      let lvl = 0;
      if (sec > 3600) lvl = 4;
      else if (sec > 1800) lvl = 3;
      else if (sec > 600) lvl = 2;
      else if (sec > 60) lvl = 1;
      heatHtml += `<div class="heat-cell l${lvl}" title="${key} · ${Math.floor(sec/60)} min"></div>`;
    }
    heatHtml += '</div>';

    const milestones = [
      { days: 3, name: 'Momentum', icon: 'waves' },
      { days: 7, name: 'Blaze', icon: 'flame' },
      { days: 30, name: 'Titan', icon: 'mountain' },
      { days: 100, name: 'Legend', icon: 'crown' },
    ];

    body.innerHTML = `
      <div class="prog-streak-hero">
        <div class="psh-icon"><i data-lucide="flame"></i></div>
        <div class="psh-num">${st.count || 0}</div>
        <div class="psh-lbl">DAY STREAK</div>
      </div>
      <div class="prog-stats-row">
        <div class="ps-card"><div class="ps-val">${best}</div><div class="ps-lbl">BEST EVER</div></div>
        <div class="ps-card"><div class="ps-val">${monthDays}</div><div class="ps-lbl">THIS MONTH</div></div>
        <div class="ps-card"><div class="ps-val" style="font-size:14px">${st.lastDate || '—'}</div><div class="ps-lbl">LAST ACTIVE</div></div>
      </div>
      <div class="prog-section">
        <div class="prog-label">▸ Последни 90 дни</div>
        ${heatHtml}
      </div>
      <div class="prog-section">
        <div class="prog-label">▸ Milestones</div>
        <div class="milestones-list">
          ${milestones.map(ms => {
            const done = (st.count || 0) >= ms.days;
            return `<div class="ms-item ${done?'done':''}">
              <span class="ms-check">${done ? '<i data-lucide="check"></i>' : '<i data-lucide="circle"></i>'}</span>
              <span class="ms-icon"><i data-lucide="${ms.icon}"></i></span>
              <span class="ms-name">${ms.name}</span>
              <span class="ms-days">${ms.days} дни</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },
  renderGoal(body) {
    const today = Utils.todayStr();
    const log = Store.state.dailyLog[today] || { seconds: 0 };
    const todayMin = Math.floor((log.seconds || 0) / 60);
    const goalMin = Store.state.dailyGoalMinutes || 120;
    const pct = Math.min(100, Math.round(todayMin / goalMin * 100));

    const now = new Date();
    let weekSec = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      weekSec += Store.state.dailyLog[key]?.seconds || 0;
    }

    let monthSec = 0;
    const y = now.getFullYear(), m = now.getMonth();
    for (const k in Store.state.dailyLog) {
      const parts = k.split('-').map(Number);
      if (parts[0] === y && parts[1] === m + 1) monthSec += Store.state.dailyLog[k].seconds || 0;
    }

    const totalSec = Object.values(Store.state.dailyLog).reduce((s, d) => s + (d.seconds||0), 0);

    let maxSec = 1;
    const days14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      const sec = Store.state.dailyLog[key]?.seconds || 0;
      if (sec > maxSec) maxSec = sec;
      days14.push({ key, sec, day: d.getDate() });
    }

    const fmtHM = (s) => {
      const h = Math.floor(s/3600), mn = Math.floor((s%3600)/60);
      return h > 0 ? `${h}ч ${mn}м` : `${mn}м`;
    };

    body.innerHTML = `
      <div class="prog-goal-hero">
        <div class="pgh-ring" style="--pct:${pct}%">
          <div class="pgh-inner">
            <div class="pgh-pct">${pct}%</div>
            <div class="pgh-min">${todayMin} / ${goalMin}</div>
            <div class="pgh-lbl">MINUTES TODAY</div>
          </div>
        </div>
      </div>
      <div class="prog-stats-row">
        <div class="ps-card"><div class="ps-val">${fmtHM(weekSec)}</div><div class="ps-lbl">THIS WEEK</div></div>
        <div class="ps-card"><div class="ps-val">${fmtHM(monthSec)}</div><div class="ps-lbl">THIS MONTH</div></div>
        <div class="ps-card"><div class="ps-val">${fmtHM(totalSec)}</div><div class="ps-lbl">ALL TIME</div></div>
      </div>
      <div class="prog-section">
        <div class="prog-label">▸ Последни 14 дни</div>
        <div class="bars14">
          ${days14.map(d => {
            const h = Math.round((d.sec / maxSec) * 100);
            const isGoal = d.sec >= goalMin * 60;
            return `<div class="bar-col">
              <div class="bar-track"><div class="bar-fill ${isGoal?'goal':''}" style="height:${h}%"></div></div>
              <div class="bar-day">${d.day}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="prog-section">
        <div class="prog-label">▸ Дневна цел</div>
        <div class="goal-setter">
          <input type="number" id="goalInput" value="${goalMin}" min="10" max="600" step="10">
          <span class="gs-lbl">МИН / ДЕН</span>
          <button class="exam-btn" onclick="StatsModal.saveGoal()">
            <i data-lucide="save"></i> ЗАПАЗИ
          </button>
        </div>
      </div>
    `;
  },
  saveGoal() {
    const input = document.getElementById('goalInput');
    const v = parseInt(input.value);
    if (isNaN(v) || v < 10 || v > 600) {
      Utils.toast('10-600 минути', 'alert-circle');
      return;
    }
    Store.state.dailyGoalMinutes = v;
    Store.save();
    Goal.render();
    Utils.toast('Цел: ' + v + ' мин', 'check');
    this.render();
  },
}