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

export const ExamSim = {
  state: { phase: 'pick', selected: null, timer: 4*60*60, running: false, interval: null, problems: [], scores: {} },

  _list: [
    { id: 'OLI-2026-10', label: 'ОИ 2026 · 10 кл', year: 2026, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2026-10 кл-probs' },
    { id: 'OLI-2026-11', label: 'ОИ 2026 · 11 кл', year: 2026, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2026-11 кл-probs' },
    { id: 'OLI-2025-10', label: 'ОИ 2025 · 10 кл', year: 2025, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs' },
    { id: 'OLI-2025-11', label: 'ОИ 2025 · 11 кл', year: 2025, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-11 кл-probs' },
    { id: 'OLI-2024-10', label: 'ОИ 2024 · 10 кл', year: 2024, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-10 кл-probs' },
    { id: 'OLI-2024-11', label: 'ОИ 2024 · 11 кл', year: 2024, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-11 кл-probs' },
    { id: 'OLI-2023-10', label: 'ОИ 2023 · 10 кл', year: 2023, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs' },
    { id: 'OLI-2023-11', label: 'ОИ 2023 · 11 кл', year: 2023, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-11 кл-probs' },
    { id: 'OLI-2022-10', label: 'ОИ 2022 · 10 кл', year: 2022, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-10 кл-probs' },
    { id: 'OLI-2022-11', label: 'ОИ 2022 · 11 кл', year: 2022, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-11 кл-probs' },
    { id: 'OLI-2021-10', label: 'ОИ 2021 · 10 кл', year: 2021, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-10 кл-probs' },
    { id: 'OLI-2021-11', label: 'ОИ 2021 · 11 кл', year: 2021, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-11 кл-probs' },
    { id: 'OLI-2020-10', label: 'ОИ 2020 · 10 кл', year: 2020, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-10 кл-probs' },
    { id: 'OLI-2020-11', label: 'ОИ 2020 · 11 кл', year: 2020, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-11 кл-probs' },
    { id: 'OLI-2019-10', label: 'ОИ 2019 · 10 кл', year: 2019, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs' },
    { id: 'OLI-2019-11', label: 'ОИ 2019 · 11 кл', year: 2019, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs' },
    { id: 'OLI-2018-10', label: 'ОИ 2018 · 10 кл', year: 2018, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-10 кл-probs' },
    { id: 'OLI-2018-11', label: 'ОИ 2018 · 11 кл', year: 2018, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-11 кл-probs' },
    { id: 'OLI-2017-10', label: 'ОИ 2017 · 10 кл', year: 2017, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-10 кл-probs' },
    { id: 'OLI-2017-11', label: 'ОИ 2017 · 11 кл', year: 2017, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-11 кл-probs' },
    { id: 'OLI-2016-10', label: 'ОИ 2016 · 10 кл', year: 2016, grade: 10, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-10 кл-probs' },
    { id: 'OLI-2016-11', label: 'ОИ 2016 · 11 кл', year: 2016, grade: 11, pdf: 'Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs' },
  ],

  open() {
    this.state.phase = 'pick';
    this.state.selected = null;
    this.state.running = false;
    this.state.scores = {};
    clearInterval(this.state.interval);
    document.getElementById('examOverlay').classList.add('open');
    this.render();
  },
  close() {
    if (this.state.running && !confirm('Наистина ли искаш да затвориш? Таймерът ще бъде спрян.')) return;
    this.state.running = false;
    clearInterval(this.state.interval);
    document.getElementById('examOverlay').classList.remove('open');
  },
  render() {
    const body = document.getElementById('examBody');
    if (this.state.phase === 'pick') {
      document.getElementById('examSub').textContent = 'Избери олимпиада и натисни START за 4-часова симулация';
      body.innerHTML = `
        <div class="exam-picker">
          ${this._list.map(x => `
            <button class="exam-pick ${this.state.selected === x.id ? 'selected' : ''}" onclick="ExamSim.pick('${x.id}')">
              <span class="year">${x.year}</span>
              <span class="grade">${x.grade} КЛАС</span>
            </button>
          `).join('')}
        </div>
        <div class="exam-actions">
          <button class="exam-btn ghost" onclick="ExamSim.close()">CANCEL</button>
          <button class="exam-btn" onclick="ExamSim.start()" ${!this.state.selected ? 'disabled style="opacity:.4"' : ''}>
            <i data-lucide="play"></i> START
          </button>
        </div>`;
    } else if (this.state.phase === 'run') {
      const cfg = this._list.find(x => x.id === this.state.selected);
      document.getElementById('examSub').textContent = cfg.label + ' · РЕЖИМ: СИМУЛАЦИЯ';
      const t = this.state.timer;
      const cls = t < 600 ? 'danger' : t < 1800 ? 'warn' : '';
      body.innerHTML = `
        <div class="exam-timer ${cls}" id="examTimer">${this.fmt(t)}</div>
        <div class="exam-problems">
          ${[1,2,3,4].map(n => `
            <div class="exam-prob">
              <span class="num">${n}</span>
              <div class="info">
                <div class="topic">Задача ${n}</div>
                <div class="sub">Отвори PDF-а и реши · въведи точки след края</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="exam-actions">
          <a class="exam-btn" href="${Utils.pdfUrl(cfg.pdf)}" target="_blank" rel="noopener">
            <i data-lucide="file-text"></i> ОТВОРИ PDF
          </a>
          <button class="exam-btn danger" onclick="ExamSim.finish()">
            <i data-lucide="flag"></i> FINISH
          </button>
        </div>`;
    } else if (this.state.phase === 'result') {
      const cfg = this._list.find(x => x.id === this.state.selected);
      const scores = this.state.scores;
      const total = [1,2,3,4].reduce((s, n) => s + (scores[n] || 0), 0);
      const max = 4 * 7;
      document.getElementById('examSub').textContent = cfg.label + ' · РЕЗУЛТАТ';
      body.innerHTML = `
        <div class="exam-result">
          <div class="total">${total} / ${max}</div>
          <div class="lbl">ОБЩ РЕЗУЛТАТ</div>
          <div class="exam-problems">
            ${[1,2,3,4].map(n => `
              <div class="exam-prob">
                <span class="num">${n}</span>
                <div class="info"><div class="topic">Задача ${n}</div></div>
                <select onchange="ExamSim.setScore(${n}, this.value)">
                  ${[0,1,2,3,4,5,6,7].map(v => `<option value="${v}" ${scores[n]===v?'selected':''}>${v} т.</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </div>
          <div class="breakdown">
            <div class="bd"><div class="v">${(total/max*100).toFixed(0)}%</div><div class="k">ПРОЦЕНТ</div></div>
            <div class="bd"><div class="v">${[1,2,3,4].filter(n => (scores[n]||0) >= 7).length}</div><div class="k">ПЪЛНИ (7)</div></div>
            <div class="bd"><div class="v">${[1,2,3,4].filter(n => (scores[n]||0) >= 4).length}</div><div class="k">≥4 ТОЧКИ</div></div>
          </div>
        </div>
        <div class="exam-actions">
          <button class="exam-btn ghost" onclick="ExamSim.open()">НОВА СИМУЛАЦИЯ</button>
          <button class="exam-btn" onclick="ExamSim.save()">
            <i data-lucide="save"></i> ЗАПАЗИ
          </button>
        </div>`;
    }
    Utils.refreshIcons();
  },
  pick(id) { this.state.selected = id; this.render(); },
  start() {
    if (!this.state.selected) return;
    this.state.phase = 'run';
    this.state.timer = 4*60*60;
    this.state.running = true;
    this.state.scores = {};
    this.render();
    this.state.interval = setInterval(() => {
      this.state.timer--;
      const el = document.getElementById('examTimer');
      if (el) {
        const t = this.state.timer;
        el.textContent = this.fmt(t);
        el.classList.toggle('warn', t < 1800 && t >= 600);
        el.classList.toggle('danger', t < 600);
      }
      if (this.state.timer <= 0) {
        clearInterval(this.state.interval);
        this.state.running = false;
        Utils.toast('Времето изтече!', 'clock');
        this.finish(true);
      }
    }, 1000);
  },
  finish(auto) {
    if (!auto && !confirm('Сигурен ли си? Таймерът ще бъде спрян.')) return;
    clearInterval(this.state.interval);
    this.state.running = false;
    this.state.phase = 'result';
    this.render();
  },
  setScore(n, v) {
    this.state.scores[n] = parseInt(v);
    const total = [1,2,3,4].reduce((s, k) => s + (this.state.scores[k] || 0), 0);
    const totEl = document.querySelector('.exam-result .total');
    if (totEl) totEl.textContent = total + ' / 28';
  },
  save() {
    const cfg = this._list.find(x => x.id === this.state.selected);
    const total = [1,2,3,4].reduce((s, n) => s + (this.state.scores[n] || 0), 0);
    if (!Store.state.examHistory) Store.state.examHistory = [];
    Store.state.examHistory.unshift({
      examId: cfg.id,
      label: cfg.label,
      scores: {...this.state.scores},
      total,
      max: 28,
      ts: Date.now(),
    });
    Store.state.problemLog.unshift({
      label: 'EXAM SIM: ' + cfg.label,
      note: `Резултат: ${total}/28 (${(total/28*100).toFixed(0)}%)`,
      status: total >= 18 ? 'solved' : total >= 8 ? 'partial' : 'failed',
      ts: Date.now(),
    });
    Store.save();
    Utils.toast('Записано в Problem Log', 'save');
    Achievements.check();
  },
  fmt(s) {
    s = Math.max(0, s);
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s % 60;
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  },
}