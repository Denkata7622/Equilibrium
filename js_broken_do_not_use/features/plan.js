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

export const Plan = {
  collapsed: {},
  render() {
    const container = document.getElementById('planContent');
    if (!container) return;

    const totalWeeks = PLAN_PHASES.reduce((a, p) => a + p.weeks_data.length, 0);
    const doneWeeks = Object.values(Store.state.planProgress || {}).filter(x => x.done).length;
    const pct = Math.round(doneWeeks / totalWeeks * 100);

    let currentWeek = null;
    for (const phase of PLAN_PHASES) {
      for (const w of phase.weeks_data) {
        if (!(Store.state.planProgress?.[w.week]?.done)) { currentWeek = w.week; break; }
      }
      if (currentWeek) break;
    }

    const now = new Date();
    const examDates = CONFIG.examDates;
    const planStart = CONFIG.planStartDate;

    const daysToRegional = Math.max(0, Math.ceil((examDates.regional - now) / 86400000));
    const daysToNational = Math.max(0, Math.ceil((examDates.nationalStart - now) / 86400000));

    const daysSinceStart = Math.max(0, Math.floor((now - planStart) / 86400000));
    const daysRegionalTotal = Math.ceil((examDates.regional - planStart) / 86400000);
    const daysNationalTotal = Math.ceil((examDates.nationalStart - planStart) / 86400000);

    const regionalPct = Math.min(100, Math.round(daysSinceStart / daysRegionalTotal * 100));
    const nationalPct = Math.min(100, Math.round(daysSinceStart / daysNationalTotal * 100));

    const regionalState = daysToRegional <= 14 ? 'urgent' : daysToRegional <= 30 ? 'soon' : (daysToRegional === 0 ? 'ready' : '');
    const nationalState = daysToNational <= 30 ? 'urgent' : daysToNational <= 60 ? 'soon' : (daysToNational === 0 ? 'ready' : '');

    const fmtDate = (d) => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;

    let html = `
      <div class="plan-hero">
        <div class="eyebrow">YOUR ROADMAP</div>
        <h1>25-WEEK PROGRESSION PLAN</h1>
        <p>Два паралелни трака всяка седмица — основен (70%) и второстепенен (30%). Кликни на седмица, за да я маркираш като завършена.</p>
        <div class="plan-stats">
          <div class="plan-stat">
            <div class="val">${doneWeeks}/${totalWeeks}</div>
            <div class="lbl">WEEKS DONE</div>
          </div>
          <div class="plan-stat">
            <div class="val">${pct}%</div>
            <div class="lbl">COMPLETION</div>
          </div>
          <div class="plan-stat">
            <div class="val">${currentWeek || '—'}</div>
            <div class="lbl">CURRENT WEEK</div>
          </div>
          <div class="plan-stat">
            <div class="val">${totalWeeks - doneWeeks}w</div>
            <div class="lbl">REMAINING</div>
          </div>
        </div>
      </div>

      <div class="exam-countdown">
        <div class="countdown-card ${regionalState}">
          <div class="cd-head"><i data-lucide="flag"></i> ОБЛАСТЕН КРЪГ</div>
          <div class="cd-body">
            <span class="cd-days">${daysToRegional}</span>
            <span class="cd-unit">дни</span>
          </div>
          <div class="cd-date">${fmtDate(examDates.regional)}</div>
          <div class="cd-progress"><div class="cd-progress-fill" style="width:${regionalPct}%"></div></div>
          <div class="cd-meta">
            <span>${regionalPct}% от времето изминало</span>
            <span>Седмица ${Math.min(17, Math.ceil(daysSinceStart / 7))}/17</span>
          </div>
        </div>
        <div class="countdown-card ${nationalState}">
          <div class="cd-head"><i data-lucide="award"></i> НАЦИОНАЛЕН КРЪГ</div>
          <div class="cd-body">
            <span class="cd-days">${daysToNational}</span>
            <span class="cd-unit">дни</span>
          </div>
          <div class="cd-date">${fmtDate(examDates.nationalStart)} – ${fmtDate(examDates.nationalEnd)}</div>
          <div class="cd-progress"><div class="cd-progress-fill" style="width:${nationalPct}%"></div></div>
          <div class="cd-meta">
            <span>${nationalPct}% от времето изминало</span>
            <span>Седмица ${Math.min(25, Math.ceil(daysSinceStart / 7))}/25</span>
          </div>
        </div>
      </div>
    `;

    PLAN_PHASES.forEach(phase => {
      const phaseDone = phase.weeks_data.filter(w => Store.state.planProgress?.[w.week]?.done).length;
      const phaseTotal = phase.weeks_data.length;
      const collapsed = this.collapsed['phase-' + phase.num] ? 'collapsed' : '';

      const phaseStart = new Date(phase.dateRange[0]);
      const phaseEnd = new Date(phase.dateRange[1]);
      const isActive = now >= phaseStart && now <= phaseEnd;
      const isPast = now > phaseEnd;

      html += `
        <div class="phase-card ${collapsed} ${isActive ? 'active-phase' : ''}" data-phase="${phase.num}">
          <div class="phase-header" onclick="Plan.togglePhase(${phase.num})">
            <span class="phase-caret"><i data-lucide="chevron-down"></i></span>
            <div class="phase-num" style="${isActive ? 'border-color:var(--accent);box-shadow:0 0 12px var(--accent-glow)' : ''}">${phase.num}</div>
            <div class="phase-meta">
              <div class="phase-weeks">PHASE ${phase.num} · ${phase.weeks} ${isActive ? '· <span style="color:var(--accent)">CURRENT</span>' : isPast ? '· <span style="color:var(--text-3)">PAST</span>' : ''}</div>
              <div class="phase-title">${phase.name}</div>
            </div>
            <div>
              <div class="phase-goal">${phase.goal}</div>
              <div class="phase-progress">${phaseDone}/${phaseTotal} weeks complete</div>
            </div>
          </div>
          <div class="phase-body">
            ${phase.weeks_data.map(w => this.renderWeek(w)).join('')}
            ${phase.examMarker ? `
              <div class="phase-exam-marker" style="grid-column:1/-1;">
                <i data-lucide="${phase.examMarker.icon}"></i>
                ${phase.examMarker.label} — ${fmtDate(new Date(phase.examMarker.date))}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    const todayIdx = (new Date().getDay() + 6) % 7;
    const dailyCollapsed = this.collapsed['daily'] ? 'collapsed' : '';
    html += `
      <div class="phase-card ${dailyCollapsed}" data-phase="daily">
        <div class="phase-header" onclick="Plan.togglePhase('daily')">
          <span class="phase-caret"><i data-lucide="chevron-down"></i></span>
          <div class="phase-num"><i data-lucide="calendar"></i></div>
          <div class="phase-meta">
            <div class="phase-weeks">EVERY WEEK</div>
            <div class="phase-title">Weekly Rhythm</div>
          </div>
          <div>
            <div class="phase-goal">1–2 hours per day · ~6–7 hours per week</div>
            <div class="phase-progress">Balanced mix of theory, practice, and simulation</div>
          </div>
        </div>
        <div class="phase-body" style="display:block;padding:12px;">
          <div class="daily-grid">
            ${PLAN_DAYS.map((d, i) => `
              <div class="day-card ${i === todayIdx ? 'today' : ''} ${d.rest ? 'rest' : ''}">
                <div class="day-name">${d.day}</div>
                <div class="day-icon"><i data-lucide="${d.icon}"></i></div>
                <div class="day-activity">${d.activity}</div>
                <div class="day-duration">${d.duration}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="plan-legend">
        <div class="lg"><span class="dot pending"></span> Upcoming</div>
        <div class="lg"><span class="dot today"></span> Today's activity</div>
        <div class="lg"><span class="dot"></span> Completed</div>
      </div>
    `;

    container.innerHTML = html;
    Utils.refreshIcons();
  },

  renderWeek(w) {
    const done = Store.state.planProgress?.[w.week]?.done;
    return `
      <div class="week-item ${done ? 'done' : ''}" onclick="Plan.toggleWeek(${w.week})">
        <div class="week-head">
          <span class="week-num">WEEK ${String(w.week).padStart(2, '0')}</span>
          <span class="week-status">
            <i data-lucide="${done ? 'check-circle-2' : 'circle'}"></i>
          </span>
        </div>
        <div class="week-topics">
          <div class="topic-row">
            <span class="topic-badge">MAIN</span>
            <span class="topic-text">${w.main}</span>
          </div>
          ${w.sec ? `
            <div class="topic-row sec-topic">
              <span class="topic-badge">SEC</span>
              <span class="topic-text">${w.sec}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  toggleWeek(week) {
    if (!Store.state.planProgress) Store.state.planProgress = {};
    const prev = Store.state.planProgress[week];
    const cur = prev?.done;
    Store.state.planProgress[week] = { done: !cur, ts: Date.now() };
    History.push('toggleWeek', { week, prev });
    Store.save();
    this.render();
  },

  togglePhase(num) {
    const key = 'phase-' + num;
    this.collapsed[key] = !this.collapsed[key];
    const el = document.querySelector(`.phase-card[data-phase="${num}"]`);
    if (el) el.classList.toggle('collapsed', this.collapsed[key]);
  },
}