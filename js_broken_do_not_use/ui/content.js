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

export const Content = {
  render() {
    // Full rebuild — invalidate cache for current mode only, rebuild
    const mode = Store.state.ui.topicView || 'absolute';
    ModeSwitcher.invalidate(mode);
    const prev = Store.state.ui.topicView;
    Store.state.ui.topicView = null;   // bypass set()'s early-return
    ModeSwitcher.set(mode);
    Store.state.ui.topicView = mode;
  },

  renderAbsolute(container, flat) {
    const filter = Store.state.ui.filter;
    let visible = 0;

    STEPS.forEach(step => {
      const pts = step.points.filter(p => matchFilter(p) && matchSearch(p));
      if (pts.length === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const sec = document.createElement('div');
      sec.className = 'step' + (Store.state.ui.collapsed[step.id] ? ' collapsed' : '');
      sec.id = 'step-' + step.id;

      const total = step.points.length;
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const pct = Math.round(done / total * 100);

      sec.innerHTML = `
        <div class="step-header" onclick="Content.toggleStep(${step.id}, event)">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num">${String(step.id).padStart(2,'0')}</span>
          <span class="step-title">${step.title}</span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
          <button class="step-reset" onclick="Content.resetStep(${step.id}, event)" title="Reset step">
            <i data-lucide="rotate-ccw"></i>
          </button>
        </div>
        <div class="step-body"></div>
      `;

      const body = sec.querySelector('.step-body');
      pts.forEach(p => body.appendChild(this.buildPointEl(p, flat)));
      container.appendChild(sec);
    });

    return visible;
  },

  renderRoadmap(container, flat) {
    const filter = Store.state.ui.filter;
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);
    let visible = 0;

    LEVELS.forEach(lvl => {
      // Всички точки в нивото
      const levelPointIds = lvl.groups.flatMap(g => g.ids);
      const levelPoints = levelPointIds.map(id => flatMap[id]).filter(Boolean);
      if (!levelPoints.length) return;

      // Филтрирани точки по групи
      const visibleByGroup = lvl.groups.map(g => ({
        name: g.name,
        points: g.ids.map(id => flatMap[id]).filter(Boolean)
                    .filter(x => matchFilter(x.point) && matchSearch(x.point))
      }));
      const totalVisible = visibleByGroup.reduce((s, g) => s + g.points.length, 0);
      if (totalVisible === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const total = levelPoints.length;
      const done = levelPoints.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = total ? Math.round(done / total * 100) : 0;

      const collapsedKey = 'lvl-' + lvl.id;
      const sec = document.createElement('div');
      sec.className = 'step level-card' + (Store.state.ui.collapsed[collapsedKey] ? ' collapsed' : '');
      sec.id = 'level-' + lvl.id;
      sec.dataset.levelId = lvl.id;

      sec.innerHTML = `
        <div class="step-header" onclick="Content.toggleLevel(${lvl.id}, event)" style="border-left:3px solid ${lvl.color};">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num" style="color:${lvl.color};">${String(lvl.id).padStart(2,'0')}</span>
          <span class="step-title" style="color:${lvl.color};">
            <span style="margin-right:8px;">${lvl.icon}</span>${lvl.name}
            <span style="color:var(--text-3);font-size:12px;letter-spacing:1px;margin-left:10px;font-weight:normal;">· ${lvl.weeks}</span>
          </span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
        </div>
        <div class="step-body"></div>
      `;

      const body = sec.querySelector('.step-body');
      visibleByGroup.forEach(grp => {
        if (!grp.points.length) return;
        const gDone = grp.points.filter(x => Store.getPoint(x.point.id).done).length;
        const gTotal = grp.points.length;
        const grpHeader = document.createElement('div');
        grpHeader.className = 'roadmap-group-header';
        grpHeader.innerHTML = `
          <i data-lucide="chevron-right" style="width:12px;height:12px;color:${lvl.color};"></i>
          <span style="flex:1;">${grp.name}</span>
          <span style="color:${gDone===gTotal ? 'var(--accent)' : 'var(--text-3)'};font-size:11px;">${gDone}/${gTotal}</span>
        `;
        body.appendChild(grpHeader);
        grp.points.forEach(x => body.appendChild(this.buildPointEl(x.point, flat)));
      });

      container.appendChild(sec);
    });
    return visible;
  },

  renderPreview(container, flat) {
    const filter = Store.state.ui.filter;
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    const level0 = LEVELS.find(l => l.id === 0);
    if (!level0) return 0;

    const iconMap = { 'Алгебра': '📐', 'Геометрия': '📏', 'Теория на числата': '🔢', 'Комбинаторика': '🎲' };

    let visible = 0;
    level0.groups.forEach(grp => {
      const pts = grp.ids.map(id => flatMap[id]).filter(Boolean)
                      .filter(x => matchFilter(x.point) && matchSearch(x.point));
      if (pts.length === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const allPts = grp.ids.map(id => flatMap[id]).filter(Boolean);
      const total = allPts.length;
      const done = allPts.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = total ? Math.round(done / total * 100) : 0;

      const collapsedKey = 'prev-' + grp.name;
      const sec = document.createElement('div');
      sec.className = 'step' + (Store.state.ui.collapsed[collapsedKey] ? ' collapsed' : '');
      sec.id = 'preview-' + grp.name.replace(/\s+/g, '-');
      sec.dataset.previewGroup = grp.name;

      sec.innerHTML = `
        <div class="step-header" onclick="Content.togglePreviewGroup('${grp.name}', event)">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num" style="font-size:16px;min-width:auto;letter-spacing:0;text-shadow:none;">${iconMap[grp.name] || '◆'}</span>
          <span class="step-title">${grp.name}</span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
        </div>
        <div class="step-body"></div>
      `;
      const body = sec.querySelector('.step-body');
      pts.forEach(x => body.appendChild(this.buildPointEl(x.point, flat)));
      container.appendChild(sec);
    });
    return visible;
  },

  renderTasksView() {
  const container = document.getElementById('tasksContainer');
  if (!container) return;
  const flat = getFlatPoints();
  const flatMap = {};
  flat.forEach(x => flatMap[x.point.id] = x);
  
  let html = `<div class="plan-hero">
    <div class="eyebrow">TASK-BASED VIEW</div>
    <h1>TASKS</h1>
    <p>4 задачи на областен кръг. Учиш по вид задача, не по тема. Всяка карта показва toolkit + source problems.</p>
  </div>`;
  
  Object.values(TASKS_DATA).forEach(task => {
    const toolkitPoints = task.toolkit.map(id => flatMap[id]).filter(Boolean);
    const toolkitDone = toolkitPoints.filter(x => Store.getPoint(x.point.id).done).length;
    const toolkitTotal = toolkitPoints.length;
    const solvedProblems = task.source_problems.filter(p =>
      (Store.state.taskProgress || {})[`T${task.num}:${p.id}`]
    ).length;
    const totalProblems = task.source_problems.length;
    
    html += `<div class="phase-card" style="border-left:4px solid ${task.color};">
      <div class="phase-header" style="cursor:default;">
        <div class="phase-num" style="border-color:${task.color};color:${task.color};">${task.num}</div>
        <div class="phase-meta">
          <div class="phase-weeks">TASK ${task.num} · ${task.points_on_exam} ТОЧКИ</div>
          <div class="phase-title" style="color:${task.color};">${task.name}</div>
        </div>
        <div>
          <div class="phase-goal">${task.meta_technique}</div>
          <div class="phase-progress">${toolkitDone}/${toolkitTotal} toolkit · ${solvedProblems}/${totalProblems} problems</div>
        </div>
      </div>
      <div class="phase-body" style="display:block;padding:14px;">
        <div style="margin-bottom:14px;padding:10px 14px;background:var(--surface-2);border-radius:4px;font-size:12px;color:var(--text-3);">
          <b style="color:var(--text-2);">Защо:</b> ${task.why}
        </div>
        <div style="margin-bottom:14px;">
          <div class="pm-label" style="margin-bottom:8px;">▸ Toolkit (${toolkitDone}/${toolkitTotal})</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${toolkitPoints.map(x => {
              const done = Store.getPoint(x.point.id).done;
              return `<span class="prereq-chip ${done ? 'done' : ''}" 
                onclick="Modal.open('${x.point.id}')" 
                title="${Utils.escapeHtml(x.point.title)}">${x.point.id} ${x.point.title}</span>`;
            }).join('')}
          </div>
        </div>
        <div>
          <div class="pm-label" style="margin-bottom:8px;">▸ Source problems (${solvedProblems}/${totalProblems})</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${task.source_problems.map(p => {
              const key = `T${task.num}:${p.id}`;
              const solved = !!(Store.state.taskProgress || {})[key];
              return `<div class="pm-task-item practice ${solved ? 'done' : ''}" style="padding:8px 12px;">
                <button class="task-check ${solved ? 'checked' : ''}" 
                  onclick="event.stopPropagation();Content.toggleTaskProblem('${task.num}', '${p.id}')">
                  ${solved ? '<i data-lucide="check"></i>' : ''}
                </button>
                <span class="label" style="flex:1;cursor:pointer;" onclick="Content.openTaskProblem('${p.id}', ${p.year}, ${p.grade})">
                  <i data-lucide="file-text"></i> ${p.year} · ${Utils.escapeHtml(p.summary)}
                </span>
                <span class="diff-stars">${'★'.repeat(p.difficulty)}${'☆'.repeat(5-p.difficulty)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
  });
  
  container.innerHTML = html;
  Utils.refreshIcons();
},

openTaskProblem(problemId, year, grade) {
  // First: try to find as STEPS point
  const p = getPoint(problemId);
  if (p) {
    Modal.open(problemId);
    return;
  }
  // Fallback: build PDF URL
  const pdf = `Задачи_Минали_Години/Областен/OLI-2-Областен кръг-${year}-${grade} кл-probs`;
  window.open(Utils.pdfUrl(pdf, 1), '_blank');
},

toggleTaskProblem(taskNum, problemId) {
  if (!Store.state.taskProgress) Store.state.taskProgress = {};
  const key = `T${taskNum}:${problemId}`;
  const prev = !!Store.state.taskProgress[key];
  Store.state.taskProgress[key] = !prev;
  History.push('toggleTask', { key, prev });
  Store.save();
  if (Tabs.current === 'tasks') this.renderTasksView();
},

  toggleLevel(lvlId, e) {
    if (e && e.target.closest('.step-reset')) return;
    const key = 'lvl-' + lvlId;
    Store.state.ui.collapsed[key] = !Store.state.ui.collapsed[key];
    Store.save();
    const sec = document.getElementById('level-' + lvlId);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[key]);
  },

  togglePreviewGroup(name, e) {
    if (e && e.target.closest('.step-reset')) return;
    const key = 'prev-' + name;
    Store.state.ui.collapsed[key] = !Store.state.ui.collapsed[key];
    Store.save();
    const sec = document.querySelector(`[data-preview-group="${name}"]`);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[key]);
  },

  applyFilter() {
    const container = document.getElementById('stepsContainer');
    if (!container || !container.children.length) { this.render(); return; }
    const filter = Store.state.ui.filter;
    const query = State.searchQuery;
    const filterActive = filter !== 'all' || !!query;
    
    let anyVisible = false;
    // Steps are now inside .mode-cache, not direct children of container
    container.querySelectorAll('.step').forEach(outerEl => {
      let outerVisible = false;
      outerEl.querySelectorAll('.point').forEach(pointEl => {
        const pid = pointEl.dataset.pid;
        const p = getPoint(pid);
        if (!p) return;
        const shouldShow = matchFilter(p) && matchSearch(p);
        pointEl.style.display = shouldShow ? '' : 'none';
        if (shouldShow) outerVisible = true;
      });
      outerEl.style.display = (outerVisible || !filterActive) ? '' : 'none';
      if (outerVisible || !filterActive) anyVisible = true;
    });
    
    let emptyEl = container.querySelector(':scope > .empty');
    if (!anyVisible && filterActive) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty';
        emptyEl.innerHTML = `<div class="big"><i data-lucide="search-x"></i></div>
          <div>NO RESULTS</div>
          <div style="margin-top:10px;font-size:13px;">Change the filter or search query</div>`;
        container.appendChild(emptyEl);
        Utils.refreshIcons();
      }
      emptyEl.style.display = '';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
    Events.updateFilterCounts();
  },

  buildPointEl(p, flat) {
    const meta = Store.getPoint(p.id);
    const idx = flat.findIndex(x => x.point.id === p.id);
    const el = document.createElement('div');
    el.className = 'point';
    if (meta.done) el.classList.add('done');
    if (meta.fav) el.classList.add('fav');
    el.id = 'point-' + p.id.replace('.', '-');
    el.dataset.pid = p.id;
    el.dataset.idx = idx;

    const pdfBtn = p.pdf
      ? `<a href="${Utils.pdfUrl(p.pdf, p.page)}" target="_blank" class="pdf-btn" onclick="event.stopPropagation()"><i data-lucide="file-text"></i> PDF${p.page ? ' · p. ' + p.page : ''}</a>`
      : '';
    const pageTag = p.page ? `<span class="tag page">p. ${p.page}</span>` : '';
    const notesBadge = meta.notes ? `<span class="notes-badge" title="Has notes"><i data-lucide="pencil"></i></span>` : '';

    let bonusHtml = '';
    if (p.bonus && p.bonus.length) {
      const items = p.bonus.map(b => {
        if (b.type === 'video') {
          return `<a href="#" class="pdf-btn video" onclick="event.preventDefault();event.stopPropagation();Videos.open('${b.driveId}','${Utils.escapeHtml(b.label)}')"><i data-lucide="video"></i> ${Utils.escapeHtml(b.label)}</a>`;
        }
        return `<a href="${Utils.pdfUrl(b.pdf)}" target="_blank" class="pdf-btn bonus" onclick="event.stopPropagation()"><i data-lucide="link"></i> ${Utils.escapeHtml(b.label)}</a>`;
      });
      bonusHtml = `<div class="bonus-row"><span class="section-label" style="margin-right:8px;">MORE:</span>${items.join('')}</div>`;
    }

    el.innerHTML = `
      <div class="point-row" onclick="if(!event.target.closest('.point-check,.point-actions,textarea,input'))Modal.open('${p.id}')">
        <button class="point-check ${meta.done?'checked':''}" onclick="event.stopPropagation();PointActions.toggleDone('${p.id}')">
          ${meta.done?'<i data-lucide="check"></i>':''}
        </button>
        <div class="point-main">
          <div class="point-num">POINT ${p.id}${notesBadge}</div>
          <div class="point-title">${p.title}</div>
          <div class="point-desc">${p.desc}</div>
          <div class="point-tags">
            <span class="tag src">${p.source}</span>
            ${pageTag}
            ${pdfBtn}
          </div>
        </div>
        <div class="point-actions" onclick="event.stopPropagation()">
          <div class="diff-group">
            <button class="diff-btn easy ${meta.diff==='easy'?'active':''}" onclick="PointActions.setDiff('${p.id}','easy',event)" title="Easy">E</button>
            <button class="diff-btn med ${meta.diff==='med'?'active':''}" onclick="PointActions.setDiff('${p.id}','med',event)" title="Medium">M</button>
            <button class="diff-btn hard ${meta.diff==='hard'?'active':''}" onclick="PointActions.setDiff('${p.id}','hard',event)" title="Hard">H</button>
          </div>
          <button class="mini-btn ${meta.fav?'active':''}" onclick="PointActions.toggleFav('${p.id}', event)" title="Star for review">
            <i data-lucide="star"></i>
          </button>
          <button class="mini-btn" onclick="PointActions.toggleExpand('${p.id}', event)" title="Quick preview">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="point-expand">
        <div class="point-expand-inner">
          <div class="section-label">▸ Detailed Notes</div>
          <div class="explanation">${Utils.escapeHtml(p.explanation || '')}</div>
          <div class="section-label">▸ Personal Notes</div>
          <textarea class="notes-area" placeholder="Write your ideas, lemmas, tricks..." oninput="PointActions.saveNotes('${p.id}', this.value)" onclick="event.stopPropagation()">${Utils.escapeHtml(meta.notes||'')}</textarea>
          ${bonusHtml}
        </div>
      </div>
    `;

    return el;
  },

  toggleStep(stepId, e) {
    if (e && e.target.closest('.step-reset')) return;
    Store.state.ui.collapsed[stepId] = !Store.state.ui.collapsed[stepId];
    Store.save();
    const sec = document.getElementById('step-' + stepId);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[stepId]);
  },

  resetStep(stepId, e) {
    e.stopPropagation();
    if (!confirm('Reset all points in this step?')) return;
    const step = STEPS.find(s => s.id === stepId);
    const snapshot = step.points.map(p => ({
      id: p.id,
      prev: JSON.parse(JSON.stringify(Store.getPoint(p.id)))
    }));
    History.push('clearStep', { stepId, snapshot });
    step.points.forEach(p => {
      if (Store.state.progress[p.id]) {
        Store.state.progress[p.id].done = false;
        Store.state.progress[p.id].fav = false;
        Store.state.progress[p.id].diff = null;
      }
    });
    Store.save();
    this.render();
    Sidebar.render();
    Stats.update();
    Utils.toast('Step reset', 'rotate-ccw');
  },

  scrollToStep(id) {
    const el = document.getElementById('step-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToLevel(id) {
    const el = document.getElementById('level-' + id);
    if (!el) return;
    // Разгъни ако е сгънат
    if (el.classList.contains('collapsed')) {
      Store.state.ui.collapsed['lvl-' + id] = false;
      Store.save();
      el.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToPreviewGroup(name) {
    const el = document.querySelector(`[data-preview-group="${name}"]`);
    if (!el) return;
    if (el.classList.contains('collapsed')) {
      Store.state.ui.collapsed['prev-' + name] = false;
      Store.save();
      el.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToPoint(pid) {
    const el = document.querySelector(`[data-pid="${pid}"]`);
    if (!el) return;
    const sec = el.closest('.step');
    if (sec && sec.classList.contains('collapsed')) {
      const sid = parseInt(sec.id.replace('step-', ''));
      Store.state.ui.collapsed[sid] = false;
      Store.save();
      sec.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight', 'expanded');
    setTimeout(() => el.classList.remove('highlight'), 1300);
  },

  expandAll() {
    STEPS.forEach(s => Store.state.ui.collapsed[s.id] = false);
    Store.save();
    document.querySelectorAll('.step').forEach(el => el.classList.remove('collapsed'));
    document.querySelectorAll('.point').forEach(el => el.classList.add('expanded'));
  },

  collapseAll() {
    STEPS.forEach(s => Store.state.ui.collapsed[s.id] = true);
    Store.save();
    document.querySelectorAll('.step').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.point').forEach(el => el.classList.remove('expanded'));
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: POINT ACTIONS
   ═══════════════════════════════════════════════════════════════ */
const PointActions = {
  toggleDone(id, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.done;
    meta.done = !meta.done;
    History.push('toggleDone', { id, prev });
    if (meta.done) Stats.checkStreak();
    Store.save();
    this.updatePointEl(id);
    // Defer heavy refresh — browser stays responsive
    requestAnimationFrame(() => {
      Stats.update(); Stats.updateSidebarRings(); Stats.updateStepBadges();
      if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
      if (window.Today && Today.render) Today.render();
    });
    if (meta.done) Utils.toast('Completed: ' + id, 'check');
    Achievements.check();
  },
  toggleFav(id, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.fav;
    meta.fav = !meta.fav;
    History.push('toggleFav', { id, prev });
    Store.save();
    this.updatePointEl(id);
    if (meta.fav) Utils.toast('Marked for review', 'star');
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
    if (window.Today && Today.render) Today.render();
  },
  setDiff(id, diff, e) {
    if (e) e.stopPropagation();
    const meta = Store.getPoint(id);
    const prev = meta.diff;
    meta.diff = meta.diff === diff ? null : diff;
    History.push('setDiff', { id, prev });
    Store.save();
    this.updatePointEl(id);
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
    if (window.Today && Today.render) Today.render();
  },
  saveNotes(id, val) {
    const meta = Store.getPoint(id);
    const prev = meta.notes;
    meta.notes = val;
    History.push('saveNotes', { id, prev });
    Store.save();
    this.updatePointEl(id, true);
  },
  toggleExpand(id, e) {
    if (e) e.stopPropagation();
    const el = document.querySelector(`[data-pid="${id}"]`);
    if (el) el.classList.toggle('expanded');
  },
  updatePointEl(id, onlyNotesBadge) {
    const meta = Store.getPoint(id);
    document.querySelectorAll(`[data-pid="${id}"]`).forEach(el => {
      if (!onlyNotesBadge) {
        el.classList.toggle('done', meta.done);
        el.classList.toggle('fav', meta.fav);
        const chk = el.querySelector('.point-check');
        if (chk) {
          chk.classList.toggle('checked', meta.done);
          chk.innerHTML = meta.done ? Utils.iconSVG('check', 14) : '';
        }
        el.querySelectorAll('.diff-btn').forEach(b => {
          const isActive = b.classList.contains(meta.diff);
          b.classList.toggle('active', isActive);
        });
        const favBtn = el.querySelectorAll('.mini-btn')[1];
        if (favBtn) favBtn.classList.toggle('active', meta.fav);
      }
      const num = el.querySelector('.point-num');
      if (!num) return;
      const existing = num.querySelector('.notes-badge');
      if (meta.notes && !existing) num.insertAdjacentHTML('beforeend', ' <span class="notes-badge" title="Has notes"><i data-lucide="pencil"></i></span>');
      else if (!meta.notes && existing) existing.remove();
    });
    Utils.refreshIcons();
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: MODAL
   ═══════════════════════════════════════════════════════════════ */
const Modal = {
  open(id) {
    State.currentModalId = id;
    const p = getPoint(id);
    if (!p) return;
    const meta = Store.getPoint(id);
    const step = STEPS.find(s => s.points.some(x => x.id === id));

    document.getElementById('pmId').textContent = 'POINT ' + id + ' · ' + (step ? step.title : '');
    document.getElementById('pmTitle').textContent = p.title;
    const pmDescEl = document.getElementById('pmDesc');
    pmDescEl.textContent = p.desc || '';
    pmDescEl.dataset.mathDone = '';
    const pmExpEl = document.getElementById('pmExplanation');
    pmExpEl.textContent = p.explanation || '';
    pmExpEl.dataset.mathDone = '';

    const notesEl = document.getElementById('pmNotes');
    notesEl.value = meta.notes || '';
    notesEl.oninput = (e) => {
      meta.notes = e.target.value;
      Store.save();
      PointActions.updatePointEl(id, true);
    };

    document.getElementById('pmSource').innerHTML =
      `<span class="tag src">${p.source}</span>` +
      (p.page ? `<span class="tag page">p. ${p.page}</span>` : '');

    const quickTasks = p.tasks || (p.pdf ? [
      { label: '<i data-lucide="book-open"></i> Theory (start of article)', pdf: p.pdf, page: p.page || 1 },
      { label: '<i data-lucide="pencil"></i> Problems (end of article)',    pdf: p.pdf, page: Math.max(1, (p.page || 1) + 8) },
      { label: '<i data-lucide="check-circle-2"></i> Solutions',            pdf: p.pdf, page: Math.max(1, (p.page || 1) + 12) }
    ] : []);
    const tasksEl = document.getElementById('pmTasks');
    tasksEl.innerHTML = quickTasks.length ? quickTasks.map(t =>
      `<div class="pm-task-item" onclick="Modal.openPdfTab('${t.pdf}', ${t.page||1})">
        <span class="label">${t.label}</span>
        <span class="pg">p. ${t.page||'?'}</span>
        <span class="go"><i data-lucide="arrow-right"></i></span>
      </div>`
    ).join('') : '<div style="color:var(--text-3);font-size:12px;">No PDF tasks available</div>';

    this.renderPractice(p);

    const tabs = [];
    if (p.page)           tabs.push({ key:'theory',    label:'<i data-lucide="book-open"></i> Theory',     page:p.page });
    if (p.problems_page)  tabs.push({ key:'problems',  label:'<i data-lucide="pencil"></i> Problems',     page:p.problems_page });
    if (p.solutions_page) tabs.push({ key:'solutions', label:'<i data-lucide="check-circle-2"></i> Solutions', page:p.solutions_page });
    if (!tabs.length && p.pdf) tabs.push({ key:'theory', label:'<i data-lucide="file-text"></i> PDF', page:1 });

    const tabsEl = document.getElementById('pmTabs');
    tabsEl.innerHTML = tabs.map(t =>
      `<button class="pm-tab" data-tab="${t.key}" onclick="Modal.switchTab('${t.key}',${t.page})">${t.label} <span class="badge">${t.page}</span></button>`
    ).join('') + (p.pdf ?
      `<button class="pm-tab external" onclick="Modal.openPdfTab('${p.pdf}',${p.page||1})"><i data-lucide="external-link"></i> Open in new tab</button>` : '');

    if (tabs.length) this.switchTab(tabs[0].key, tabs[0].page);
    else this.loadPdf(p.pdf, 1);

    this.updateButtons();
    this.updateTaskNav();
    this.updateTaskCount();

    // Show Deep Dive button only when the point has a deepExplanation
    const ddBtn = document.getElementById('pmDeepBtn');
    if (ddBtn) ddBtn.style.display = p.deepExplanation ? 'inline-flex' : 'none';

    const prereqs = PREREQS[id];
    const oldPrereq = document.querySelector('.pm-section.prereq-section');
    if (oldPrereq) oldPrereq.remove();
    if (prereqs && prereqs.length) {
      const chips = prereqs.map(pid => {
        const done = Store.getPoint(pid).done;
        const pp = getPoint(pid);
        const title = pp ? pp.title : pid;
        return `<span class="prereq-chip ${done?'done':''}" title="${Utils.escapeHtml(title)}" onclick="event.stopPropagation();Modal.close();setTimeout(()=>Content.scrollToPoint('${pid}'),100)">${pid}</span>`;
      }).join('');
      const el = document.getElementById('pmSource');
      el.insertAdjacentHTML('afterend',
        `<div class="pm-section prereq-section"><div class="pm-label">▸ Prerequisites</div><div class="prereq-row">${chips}</div></div>`);
    }

    const usedIn = this.getUsedIn(id);
    const oldUsedIn = document.querySelector('.pm-section.usedin-section');
    if (oldUsedIn) oldUsedIn.remove();
    if (usedIn.length) {
      const chips = usedIn.slice(0, 12).map(pid => {
        const done = Store.getPoint(pid).done;
        const pp = getPoint(pid);
        const title = pp ? pp.title : pid;
        return `<span class="prereq-chip ${done?'done':''}" title="${Utils.escapeHtml(title)}" onclick="event.stopPropagation();Modal.close();setTimeout(()=>Content.scrollToPoint('${pid}'),100)">${pid}</span>`;
      }).join('');
      const el = document.getElementById('pmSource');
      el.insertAdjacentHTML('afterend',
        `<div class="pm-section usedin-section"><div class="pm-label">▸ Used in (${usedIn.length})</div><div class="prereq-row">${chips}</div></div>`);
    }

    const existingCrumb = document.querySelector('.pm-breadcrumbs');
    if (existingCrumb) existingCrumb.remove();
    if (step) {
      const ta = document.querySelector('.pm-title-area');
      ta.insertAdjacentHTML('beforeend',
        `<div class="pm-breadcrumbs">
          <span class="crumb" onclick="Modal.close();if(Tabs.current!=='study')Tabs.switch('study');Content.scrollToStep(${step.id})">Step ${step.id}</span>
          <span class="sep">›</span>
          <span>${step.title}</span>
        </div>`);
    }

    this.renderBookmarks();
    Recent.track(id);
    TimeTracker.start(id);

    document.getElementById('pointModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    Pomodoro.syncModal();

    // Two-phase deferral: paint modal first, THEN render heavy icons/KaTeX.
    // This is critical for INP — KaTeX on a math-heavy explanation can take
    // 200-300ms; we must not let it block the modal's first paint.
    const heavyModalWork = () => {
      Utils.refreshIcons();
      const modal = document.querySelector('.point-modal');
      if (modal) MathRender.apply(modal);
    };
    if (window.requestIdleCallback) {
      requestIdleCallback(heavyModalWork, { timeout: 400 });
    } else {
      // Fallback: two rAFs ensure paint happened, then setTimeout lets it finish
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTimeout(heavyModalWork, 0));
      });
    }
  },

  renderPractice(p) {
    const wrap = document.getElementById('pmPractice');
    if (!wrap) return;
    const tasks = p.tasks || [];
    if (!tasks.length) {
      wrap.innerHTML = '<div style="color:var(--text-3);font-size:12px;padding:6px 0;">No practice tasks linked yet.</div>';
      return;
    }
    wrap.innerHTML = tasks.map((t, idx) => {
      const key = `${p.id}:${idx}`;
      const done = !!(Store.state.taskProgress || {})[key];
      const diff = t.difficulty || 3;
      const stars = '★'.repeat(diff) + '☆'.repeat(5 - diff);
      const diffClass = diff <= 2 ? 'easy' : diff === 3 ? 'med' : 'hard';
      return `<div class="pm-task-item practice ${done?'done':''}" data-task-key="${key}">
        <button class="task-check ${done?'checked':''}" onclick="event.stopPropagation();Modal.toggleTask('${p.id}',${idx})" title="Mark solved">
          ${done ? '<i data-lucide="check"></i>' : ''}
        </button>
        <span class="label" onclick="Modal.openPdfTab('${t.pdf}',${t.page||1})">
          <i data-lucide="target"></i> ${Utils.escapeHtml(t.label)}
        </span>
        <span class="diff-stars ${diffClass}" title="Difficulty ${diff}/5">${stars}</span>
        <span class="pg" onclick="Modal.openPdfTab('${t.pdf}',${t.page||1})">p. ${t.page||'?'}</span>
        <span class="go" onclick="Modal.openPdfTab('${t.pdf}',${t.page||1})"><i data-lucide="arrow-right"></i></span>
      </div>`;
    }).join('');
    Utils.refreshIcons();
  },

  toggleTask(pointId, idx) {
    if (!Store.state.taskProgress) Store.state.taskProgress = {};
    const key = `${pointId}:${idx}`;
    const prev = !!Store.state.taskProgress[key];
    Store.state.taskProgress[key] = !prev;
    History.push('toggleTask', { key, prev });
    Store.save();
    const p = getPoint(pointId);
    if (p) this.renderPractice(p);
    this.updateTaskCount();
    if (Store.state.taskProgress[key]) {
      const t = (p.tasks || [])[idx];
      Utils.toast('Solved: ' + (t ? t.label.replace(/<[^>]+>/g,'').trim().slice(0,40) : key), 'check');
      Achievements.check();
    }
  },

  updateTaskCount() {
    const el = document.getElementById('pmTaskCount');
    if (!el || !State.currentModalId) return;
    const p = getPoint(State.currentModalId);
    if (!p) return;
    const tasks = p.tasks || [];
    if (!tasks.length) { el.textContent = ''; return; }
    const done = tasks.filter((_, i) => (Store.state.taskProgress || {})[`${p.id}:${i}`]).length;
    el.textContent = `${done}/${tasks.length} solved`;
    el.classList.toggle('all-done', done === tasks.length && tasks.length > 0);
  },

  updateTaskNav() {
    const nav = document.getElementById('pmTaskNav');
    if (!nav) return;
    const p = State.currentModalId ? getPoint(State.currentModalId) : null;
    const tasks = (p && p.tasks) || [];
    if (tasks.length < 2) { nav.style.display = 'none'; return; }
    nav.style.display = 'flex';
    nav.innerHTML = `
      <button class="pm-btn" onclick="Modal.navigateTask(-1)" title="Prev task">
        <i data-lucide="chevron-left"></i> <span class="btn-label">Task</span>
      </button>
      <button class="pm-btn" onclick="Modal.navigateTask(1)" title="Next task">
        <span class="btn-label">Task</span> <i data-lucide="chevron-right"></i>
      </button>`;
    Utils.refreshIcons();
  },

  navigateTask(delta) {
    if (!State.currentModalId) return;
    const p = getPoint(State.currentModalId);
    const tasks = (p && p.tasks) || [];
    if (!tasks.length) return;
    this._taskIdx = ((this._taskIdx ?? -1) + delta + tasks.length) % tasks.length;
    const t = tasks[this._taskIdx];
    this.openPdfTab(t.pdf, t.page || 1);
  },

  _usedInCache: null,
  getUsedIn(pointId) {
    if (!this._usedInCache) {
      const map = {};
      for (const s of STEPS) {
        for (const p of s.points) {
          const list = (p.tasks || []).flatMap(t => t.requires_also || []);
          for (const req of list) {
            if (!map[req]) map[req] = new Set();
            map[req].add(p.id);
          }
          const pre = PREREQS[p.id] || [];
          for (const req of pre) {
            if (!map[req]) map[req] = new Set();
            map[req].add(p.id);
          }
        }
      }
      this._usedInCache = {};
      for (const k in map) this._usedInCache[k] = Array.from(map[k]).sort();
    }
    return this._usedInCache[pointId] || [];
  },

  togglePdfFocus() {
    const overlay = document.getElementById('pointModal');
    const on = !overlay.classList.contains('pdf-focus');
    overlay.classList.toggle('pdf-focus', on);
    Utils.toast(on ? 'PDF focus ON' : 'PDF focus OFF', 'maximize-2');
  },

  loadPdf(pdf, page) {
    const frame = document.getElementById('pmPdfFrame');
    if (!pdf) { frame.src = 'about:blank'; return; }
    frame.src = Utils.pdfUrl(pdf, page);
  },

  switchTab(key, page) {
    document.querySelectorAll('.pm-tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.pm-tab[data-tab="${key}"]`);
    if (tab) tab.classList.add('active');
    const p = getPoint(State.currentModalId);
    if (p) this.loadPdf(p.pdf, page);
  },

  openPdfTab(pdf, page) {
    if (!pdf) return;
    window.open(Utils.pdfUrl(pdf, page), '_blank');
  },

  close() {
    TimeTracker.end();
    document.getElementById('pointModal').classList.remove('open');
    document.getElementById('pointModal').classList.remove('pdf-focus');
    document.body.style.overflow = '';
    State.currentModalId = null;
    this._taskIdx = -1;
  },

  navigate(delta) {
    const flat = getFlatPoints();
    const visibleIds = flat.filter(x => matchFilter(x.point) && matchSearch(x.point)).map(x => x.point.id);
    if (!visibleIds.length) return;
    let pos = visibleIds.indexOf(State.currentModalId);
    if (pos === -1) pos = 0;
    else pos = Math.max(0, Math.min(visibleIds.length - 1, pos + delta));
    this.open(visibleIds[pos]);
  },

  toggleDone() {
    if (!State.currentModalId) return;
    PointActions.toggleDone(State.currentModalId);
    this.updateButtons();
  },
  toggleFav() {
    if (!State.currentModalId) return;
    PointActions.toggleFav(State.currentModalId);
    this.updateButtons();
  },
  setDiff(d) {
    if (!State.currentModalId) return;
    PointActions.setDiff(State.currentModalId, d);
    this.updateButtons();
  },
  updateButtons() {
    if (!State.currentModalId) return;
    const meta = Store.getPoint(State.currentModalId);
    document.getElementById('pmDone').classList.toggle('active', meta.done);
    document.getElementById('pmFav').classList.toggle('active', meta.fav);
    document.getElementById('pmDiffEasy').classList.toggle('active', meta.diff === 'easy');
    document.getElementById('pmDiffMed').classList.toggle('active', meta.diff === 'med');
    document.getElementById('pmDiffHard').classList.toggle('active', meta.diff === 'hard');
  },

  addBookmark() {
    if (!State.currentModalId) return;
    const frame = document.getElementById('pmPdfFrame');
    let page = 1;
    try {
      const m = frame.src.match(/#page=(\d+)/);
      if (m) page = parseInt(m[1]);
    } catch (e) {}
    const label = prompt('Bookmark name:', 'Page ' + page);
    if (label) Bookmarks.add(State.currentModalId, page, label);
  },

  renderBookmarks() {
    if (!State.currentModalId) return;
    const bms = Store.state.bookmarks[State.currentModalId] || [];
    const existing = document.getElementById('pmBookmarks');
    if (existing) existing.remove();
    if (!bms.length) return;
    const p = getPoint(State.currentModalId);
    const html = `<div class="pm-section" id="pmBookmarks">
      <div class="pm-label">▸ Bookmarks</div>
      ${bms.map((b, i) => `<div class="pm-task-item" onclick="Modal.openPdfTab('${p && p.pdf}', ${b.page})">
        <span class="label"><i data-lucide="bookmark"></i> ${Utils.escapeHtml(b.label)}</span>
        <span class="pg">p. ${b.page}</span>
        <span class="go" onclick="event.stopPropagation();Bookmarks.remove('${State.currentModalId}', ${i})"><i data-lucide="x"></i></span>
      </div>`).join('')}
    </div>`;
    const left = document.querySelector('.pm-left');
    if (left) left.insertAdjacentHTML('beforeend', html);
    Utils.refreshIcons();
  },

  pdfSearch() {
    const q = document.getElementById('pdfSearch').value.trim();
    if (!q) return;
    const p = getPoint(State.currentModalId);
    if (!p || !p.pdf) return;
    if (/^\d+$/.test(q)) {
      this.loadPdf(p.pdf, parseInt(q));
      return;
    }
    window.open(Utils.pdfUrl(p.pdf) + '#search=' + encodeURIComponent(q), '_blank');
  },
}

export const ModeSwitcher = {
  _cache: {},   // { absolute: HTMLElement, roadmap: HTMLElement, preview: HTMLElement }

  set(mode) {
    if (!['absolute', 'roadmap', 'preview'].includes(mode)) return;
    const prevMode = Store.state.ui.topicView;   // ← премахни `|| 'absolute'`
    if (prevMode === mode) return;
    Store.state.ui.topicView = mode;
    Store.save();

    document.querySelectorAll('#modeToggle .mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode));
    const lbl = document.querySelector('.sidebar-header .lbl');
    if (lbl) {
      lbl.textContent = mode === 'absolute' ? 'STEPS'
                     : mode === 'roadmap'  ? 'LEVELS'
                     : 'PREVIEW';
    }

    // Build into cache if not cached yet
    const container = document.getElementById('stepsContainer');
    let cacheEl = this._cache[mode];
    if (!cacheEl || !cacheEl.isConnected) {
      cacheEl = document.createElement('div');
      cacheEl.className = 'mode-cache';
      cacheEl.dataset.mode = mode;
      const frag = document.createDocumentFragment();
      const flat = getFlatPoints();
      let visible = 0;
      if (mode === 'roadmap')       visible = Content.renderRoadmap(frag, flat);
      else if (mode === 'preview')  visible = Content.renderPreview(frag, flat);
      else                          visible = Content.renderAbsolute(frag, flat);
      if (visible === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.innerHTML = `<div class="big"><i data-lucide="search-x"></i></div>
          <div>NO RESULTS</div>
          <div style="margin-top:10px;font-size:13px;">Change the filter or search query</div>`;
        frag.appendChild(empty);
      }
      cacheEl.appendChild(frag);
      this._cache[mode] = cacheEl;
    }

    // ALWAYS schedule heavy work for the visible cache (idempotent)
    // — on cache HIT: fast no-op (filtered, already SVG'd)
    // — on pre-built-but-not-rendered cache: renders icons/math
    const heavy = () => {
      Utils.refreshIcons();
      MathRender.apply(cacheEl);
    };
    if (window.requestIdleCallback) requestIdleCallback(heavy, { timeout: 300 });
    else setTimeout(heavy, 50);

    // Show cache, hide others — set display BEFORE append to avoid double layout
    for (const m of ['absolute', 'roadmap', 'preview']) {
      const el = this._cache[m];
      if (!el) continue;
      el.style.display = (m === mode) ? '' : 'none';
      if (!el.parentElement) container.appendChild(el);
    }

    Sidebar.render();
    Stats.updateSidebarRings();
    Utils.toast('Mode: ' + mode.toUpperCase(), 'layout-grid');
  },

  init() {
    const mode = Store.state.ui.topicView || 'absolute';
    document.querySelectorAll('#modeToggle .mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode));
    const lbl = document.querySelector('.sidebar-header .lbl');
    if (lbl) {
      lbl.textContent = mode === 'absolute' ? 'STEPS'
                     : mode === 'roadmap'  ? 'LEVELS'
                     : 'PREVIEW';
    }
    // Pre-build the other two caches at idle → every future switch = cache hit
    this._schedulePrebuild();
  },

  _schedulePrebuild() {
    const current = Store.state.ui.topicView || 'absolute';
    const pending = ['absolute', 'roadmap', 'preview'].filter(m => m !== current);
    const container = document.getElementById('stepsContainer');
    if (!container) return;

    const buildNext = () => {
      const next = pending.shift();
      if (!next) return;
      if (this._cache[next] && this._cache[next].isConnected) {
        return buildNext();
      }
      // Build DOM only (icons/math will lazy-load on first show)
      const cacheEl = document.createElement('div');
      cacheEl.className = 'mode-cache';
      cacheEl.dataset.mode = next;
      cacheEl.style.display = 'none';
      const frag = document.createDocumentFragment();
      const flat = getFlatPoints();
      try {
        if (next === 'roadmap')      Content.renderRoadmap(frag, flat);
        else if (next === 'preview') Content.renderPreview(frag, flat);
        else                         Content.renderAbsolute(frag, flat);
        cacheEl.appendChild(frag);
        this._cache[next] = cacheEl;
        container.appendChild(cacheEl);
      } catch (e) {
        console.warn('[prebuild]', next, e);
      }
      // Schedule next prebuild at idle
      if (window.requestIdleCallback) {
        requestIdleCallback(buildNext, { timeout: 2000 });
      } else {
        setTimeout(buildNext, 500);
      }
    };

    if (window.requestIdleCallback) {
      requestIdleCallback(buildNext, { timeout: 3000 });
    } else {
      setTimeout(buildNext, 2000);
    }
  },

  // Force rebuild of the current mode cache (after reset, import, etc.)
  invalidate(mode) {
    const container = document.getElementById('stepsContainer');
    if (mode) {
      const el = this._cache[mode];
      if (el) el.remove();
      delete this._cache[mode];
    } else {
      Object.values(this._cache).forEach(el => el && el.remove());
      this._cache = {};
    }
  },

  getLevelOf(pointId) {
    for (const lvl of LEVELS) {
      for (const grp of lvl.groups) {
        if (grp.ids.includes(pointId)) return lvl.id;
      }
    }
    return -1;
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: HELPERS
   ═══════════════════════════════════════════════════════════════ */
function getPoint(id) {
  for (const s of STEPS) for (const p of s.points) if (p.id === id) return p;
  return null;
}
function getFlatPoints() {
  const arr = [];
  for (const s of STEPS) for (const p of s.points) arr.push({ step: s, point: p });
  return arr;
}
function matchFilter(p) {
  const meta = Store.getPoint(p.id);
  const f = Store.state.ui.filter;
  if (f === 'all') return true;
  if (f === 'done') return meta.done;
  if (f === 'todo') return !meta.done;
  if (f === 'fav') return meta.fav;
  if (f === 'easy') return meta.diff === 'easy';
  if (f === 'med') return meta.diff === 'med';
  if (f === 'hard') return meta.diff === 'hard';
  return true;
}
function matchSearch(p) {
  const q = State.searchQuery;
  if (!q) return true;
  const lq = q.toLowerCase();
  const meta = Store.getPoint(p.id);
  return p.title.toLowerCase().includes(lq) ||
         p.desc.toLowerCase().includes(lq) ||
         p.source.toLowerCase().includes(lq) ||
         (p.explanation || '').toLowerCase().includes(lq) ||
         (meta.notes || '').toLowerCase().includes(lq) ||
         p.id.includes(lq);
}

const State = {
  searchQuery: '',
  currentModalId: null,
  currentIndex: -1,
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: STATS
   ═══════════════════════════════════════════════════════════════ */
const Stats = {
  update() {
    let total = 0, done = 0;
    STEPS.forEach(s => s.points.forEach(p => {
      total++;
      if (Store.getPoint(p.id).done) done++;
    }));
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('statDone').textContent = done;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPercent').textContent = pct + '%';
    document.getElementById('statPomos').textContent = Store.state.pomodoroSessions;
    document.getElementById('progressFill').style.width = pct + '%';
    this.renderStreak();
    if (window.Today) Today.render();
    if (window.Events && Events.updateFilterCounts) Events.updateFilterCounts();
  },
  checkStreak() {
    const today = Utils.todayStr();
    if (Store.state.streak.lastDate === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.getFullYear() + '-' + String(y.getMonth()+1).padStart(2,'0') + '-' + String(y.getDate()).padStart(2,'0');
    if (Store.state.streak.lastDate === yesterday) Store.state.streak.count++;
    else Store.state.streak.count = 1;
    Store.state.streak.lastDate = today;
    // Track best streak
    if (!Store.state.streak.best || Store.state.streak.count > Store.state.streak.best) {
      Store.state.streak.best = Store.state.streak.count;
    }
    Store.save();
    this.renderStreak();
  },
  renderStreak() {
    document.getElementById('streakNum').textContent = Store.state.streak.count || 0;
  },
  updateStepBadges() {
    document.querySelectorAll('.step').forEach(sec => {
      const stepId = parseInt(sec.id.replace('step-', ''));
      const step = STEPS.find(s => s.id === stepId);
      if (!step) return;
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const total = step.points.length;
      const pct = Math.round(done / total * 100);
      const badge = sec.querySelector('.step-badge');
      if (badge) {
        badge.textContent = `${done}/${total} · ${pct}%`;
        badge.classList.toggle('done', done === total);
      }
    });
  },
  updateSidebarRings() {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    document.querySelectorAll('.nav-step').forEach(btn => {
      let done = 0, total = 0;

      if (btn.dataset.step !== undefined) {
        // ABS mode
        const stepId = parseInt(btn.dataset.step);
        const step = STEPS.find(s => s.id === stepId);
        if (!step) return;
        total = step.points.length;
        done = step.points.filter(p => Store.getPoint(p.id).done).length;
      } else if (btn.dataset.level !== undefined) {
        // ROADMAP mode
        const lvlId = parseInt(btn.dataset.level);
        const lvl = LEVELS.find(l => l.id === lvlId);
        if (!lvl) return;
        const ids = lvl.groups.flatMap(g => g.ids);
        total = ids.length;
        done = ids.filter(id => Store.getPoint(id).done).length;
      } else if (btn.dataset.previewGroup !== undefined) {
        // PREVIEW mode
        const lvl0 = LEVELS.find(l => l.id === 0);
        const grp = lvl0.groups.find(g => g.name === btn.dataset.previewGroup);
        if (!grp) return;
        total = grp.ids.length;
        done = grp.ids.filter(id => Store.getPoint(id).done).length;
      } else {
        return;
      }

      const pct = total ? Math.round(done / total * 100) : 0;
      const ring = btn.querySelector('.ring');
      const ringSpan = ring.querySelector('span');
      if (ring) ring.style.setProperty('--pct', pct + '%');
      if (ringSpan) ringSpan.textContent = done + '/' + total;
    });
  },
};
Stats.done = function() {
  let d = 0;
  STEPS.forEach(s => s.points.forEach(p => { if (Store.getPoint(p.id).done) d++; }));
  return d;
};
Stats.stepDone = function(stepId) {
  const step = STEPS.find(s => s.id === stepId);
  return step && step.points.every(p => Store.getPoint(p.id).done);
};
Stats.totalTime = function() {
  return Object.values(Store.state.dailyLog).reduce((sum, d) => sum + (d.seconds || 0), 0);
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
const Sidebar = {
  render() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    const mode = Store.state.ui.topicView || 'absolute';

    if (mode === 'roadmap')       this.renderRoadmap(nav);
    else if (mode === 'preview')  this.renderPreview(nav);
    else                          this.renderAbsolute(nav);
  },

  renderAbsolute(nav) {
    STEPS.forEach(step => {
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const pct = Math.round(done / step.points.length * 100);
      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.step = step.id;
      btn.innerHTML = `
        <span class="num">${String(step.id).padStart(2,'0')}</span>
        <span class="label">${step.title}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${step.points.length}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToStep(step.id);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },

  renderRoadmap(nav) {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    LEVELS.forEach(lvl => {
      const levelPointIds = lvl.groups.flatMap(g => g.ids);
      const levelPoints = levelPointIds.map(id => flatMap[id]).filter(Boolean);
      if (!levelPoints.length) return;
      const total = levelPoints.length;
      const done = levelPoints.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = Math.round(done / total * 100);

      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.level = lvl.id;
      btn.innerHTML = `
        <span class="num" style="color:${lvl.color};text-shadow:none;">${lvl.icon}</span>
        <span class="label">${String(lvl.id).padStart(2,'0')} ${lvl.name}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${total}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToLevel(lvl.id);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },

  renderPreview(nav) {
    const flat = getFlatPoints();
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    const level0 = LEVELS.find(l => l.id === 0);
    if (!level0) return;
    const iconMap = { 'Алгебра': '📐', 'Геометрия': '📏', 'Теория на числата': '🔢', 'Комбинаторика': '🎲' };

    level0.groups.forEach(grp => {
      const pts = grp.ids.map(id => flatMap[id]).filter(Boolean);
      const total = pts.length;
      const done = pts.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = Math.round(done / total * 100);

      const btn = document.createElement('button');
      btn.className = 'nav-step';
      btn.dataset.previewGroup = grp.name;
      btn.innerHTML = `
        <span class="num" style="font-size:16px;text-shadow:none;">${iconMap[grp.name] || '◆'}</span>
        <span class="label">${grp.name}</span>
        <span class="ring" style="--pct:${pct}%"><span>${done}/${total}</span></span>
      `;
      btn.addEventListener('click', () => {
        if (Tabs.current !== 'study') Tabs.switch('study');
        Content.scrollToPreviewGroup(grp.name);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.add('collapsed');
      });
      nav.appendChild(btn);
    });
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: CONTENT
   ═══════════════════════════════════════════════════════════════ */
const Content = {
  render() {
    // Full rebuild — invalidate cache for current mode only, rebuild
    const mode = Store.state.ui.topicView || 'absolute';
    ModeSwitcher.invalidate(mode);
    const prev = Store.state.ui.topicView;
    Store.state.ui.topicView = null;   // bypass set()'s early-return
    ModeSwitcher.set(mode);
    Store.state.ui.topicView = mode;
  },

  renderAbsolute(container, flat) {
    const filter = Store.state.ui.filter;
    let visible = 0;

    STEPS.forEach(step => {
      const pts = step.points.filter(p => matchFilter(p) && matchSearch(p));
      if (pts.length === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const sec = document.createElement('div');
      sec.className = 'step' + (Store.state.ui.collapsed[step.id] ? ' collapsed' : '');
      sec.id = 'step-' + step.id;

      const total = step.points.length;
      const done = step.points.filter(p => Store.getPoint(p.id).done).length;
      const pct = Math.round(done / total * 100);

      sec.innerHTML = `
        <div class="step-header" onclick="Content.toggleStep(${step.id}, event)">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num">${String(step.id).padStart(2,'0')}</span>
          <span class="step-title">${step.title}</span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
          <button class="step-reset" onclick="Content.resetStep(${step.id}, event)" title="Reset step">
            <i data-lucide="rotate-ccw"></i>
          </button>
        </div>
        <div class="step-body"></div>
      `;

      const body = sec.querySelector('.step-body');
      pts.forEach(p => body.appendChild(this.buildPointEl(p, flat)));
      container.appendChild(sec);
    });

    return visible;
  },

  renderRoadmap(container, flat) {
    const filter = Store.state.ui.filter;
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);
    let visible = 0;

    LEVELS.forEach(lvl => {
      // Всички точки в нивото
      const levelPointIds = lvl.groups.flatMap(g => g.ids);
      const levelPoints = levelPointIds.map(id => flatMap[id]).filter(Boolean);
      if (!levelPoints.length) return;

      // Филтрирани точки по групи
      const visibleByGroup = lvl.groups.map(g => ({
        name: g.name,
        points: g.ids.map(id => flatMap[id]).filter(Boolean)
                    .filter(x => matchFilter(x.point) && matchSearch(x.point))
      }));
      const totalVisible = visibleByGroup.reduce((s, g) => s + g.points.length, 0);
      if (totalVisible === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const total = levelPoints.length;
      const done = levelPoints.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = total ? Math.round(done / total * 100) : 0;

      const collapsedKey = 'lvl-' + lvl.id;
      const sec = document.createElement('div');
      sec.className = 'step level-card' + (Store.state.ui.collapsed[collapsedKey] ? ' collapsed' : '');
      sec.id = 'level-' + lvl.id;
      sec.dataset.levelId = lvl.id;

      sec.innerHTML = `
        <div class="step-header" onclick="Content.toggleLevel(${lvl.id}, event)" style="border-left:3px solid ${lvl.color};">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num" style="color:${lvl.color};">${String(lvl.id).padStart(2,'0')}</span>
          <span class="step-title" style="color:${lvl.color};">
            <span style="margin-right:8px;">${lvl.icon}</span>${lvl.name}
            <span style="color:var(--text-3);font-size:12px;letter-spacing:1px;margin-left:10px;font-weight:normal;">· ${lvl.weeks}</span>
          </span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
        </div>
        <div class="step-body"></div>
      `;

      const body = sec.querySelector('.step-body');
      visibleByGroup.forEach(grp => {
        if (!grp.points.length) return;
        const gDone = grp.points.filter(x => Store.getPoint(x.point.id).done).length;
        const gTotal = grp.points.length;
        const grpHeader = document.createElement('div');
        grpHeader.className = 'roadmap-group-header';
        grpHeader.innerHTML = `
          <i data-lucide="chevron-right" style="width:12px;height:12px;color:${lvl.color};"></i>
          <span style="flex:1;">${grp.name}</span>
          <span style="color:${gDone===gTotal ? 'var(--accent)' : 'var(--text-3)'};font-size:11px;">${gDone}/${gTotal}</span>
        `;
        body.appendChild(grpHeader);
        grp.points.forEach(x => body.appendChild(this.buildPointEl(x.point, flat)));
      });

      container.appendChild(sec);
    });
    return visible;
  },

  renderPreview(container, flat) {
    const filter = Store.state.ui.filter;
    const flatMap = {};
    flat.forEach(x => flatMap[x.point.id] = x);

    const level0 = LEVELS.find(l => l.id === 0);
    if (!level0) return 0;

    const iconMap = { 'Алгебра': '📐', 'Геометрия': '📏', 'Теория на числата': '🔢', 'Комбинаторика': '🎲' };

    let visible = 0;
    level0.groups.forEach(grp => {
      const pts = grp.ids.map(id => flatMap[id]).filter(Boolean)
                      .filter(x => matchFilter(x.point) && matchSearch(x.point));
      if (pts.length === 0 && (State.searchQuery || filter !== 'all')) return;
      visible++;

      const allPts = grp.ids.map(id => flatMap[id]).filter(Boolean);
      const total = allPts.length;
      const done = allPts.filter(x => Store.getPoint(x.point.id).done).length;
      const pct = total ? Math.round(done / total * 100) : 0;

      const collapsedKey = 'prev-' + grp.name;
      const sec = document.createElement('div');
      sec.className = 'step' + (Store.state.ui.collapsed[collapsedKey] ? ' collapsed' : '');
      sec.id = 'preview-' + grp.name.replace(/\s+/g, '-');
      sec.dataset.previewGroup = grp.name;

      sec.innerHTML = `
        <div class="step-header" onclick="Content.togglePreviewGroup('${grp.name}', event)">
          <span class="step-toggle"><i data-lucide="chevron-down"></i></span>
          <span class="step-num" style="font-size:16px;min-width:auto;letter-spacing:0;text-shadow:none;">${iconMap[grp.name] || '◆'}</span>
          <span class="step-title">${grp.name}</span>
          <span class="step-badge ${done===total?'done':''}">${done}/${total} · ${pct}%</span>
        </div>
        <div class="step-body"></div>
      `;
      const body = sec.querySelector('.step-body');
      pts.forEach(x => body.appendChild(this.buildPointEl(x.point, flat)));
      container.appendChild(sec);
    });
    return visible;
  },

  renderTasksView() {
  const container = document.getElementById('tasksContainer');
  if (!container) return;
  const flat = getFlatPoints();
  const flatMap = {};
  flat.forEach(x => flatMap[x.point.id] = x);
  
  let html = `<div class="plan-hero">
    <div class="eyebrow">TASK-BASED VIEW</div>
    <h1>TASKS</h1>
    <p>4 задачи на областен кръг. Учиш по вид задача, не по тема. Всяка карта показва toolkit + source problems.</p>
  </div>`;
  
  Object.values(TASKS_DATA).forEach(task => {
    const toolkitPoints = task.toolkit.map(id => flatMap[id]).filter(Boolean);
    const toolkitDone = toolkitPoints.filter(x => Store.getPoint(x.point.id).done).length;
    const toolkitTotal = toolkitPoints.length;
    const solvedProblems = task.source_problems.filter(p =>
      (Store.state.taskProgress || {})[`T${task.num}:${p.id}`]
    ).length;
    const totalProblems = task.source_problems.length;
    
    html += `<div class="phase-card" style="border-left:4px solid ${task.color};">
      <div class="phase-header" style="cursor:default;">
        <div class="phase-num" style="border-color:${task.color};color:${task.color};">${task.num}</div>
        <div class="phase-meta">
          <div class="phase-weeks">TASK ${task.num} · ${task.points_on_exam} ТОЧКИ</div>
          <div class="phase-title" style="color:${task.color};">${task.name}</div>
        </div>
        <div>
          <div class="phase-goal">${task.meta_technique}</div>
          <div class="phase-progress">${toolkitDone}/${toolkitTotal} toolkit · ${solvedProblems}/${totalProblems} problems</div>
        </div>
      </div>
      <div class="phase-body" style="display:block;padding:14px;">
        <div style="margin-bottom:14px;padding:10px 14px;background:var(--surface-2);border-radius:4px;font-size:12px;color:var(--text-3);">
          <b style="color:var(--text-2);">Защо:</b> ${task.why}
        </div>
        <div style="margin-bottom:14px;">
          <div class="pm-label" style="margin-bottom:8px;">▸ Toolkit (${toolkitDone}/${toolkitTotal})</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${toolkitPoints.map(x => {
              const done = Store.getPoint(x.point.id).done;
              return `<span class="prereq-chip ${done ? 'done' : ''}" 
                onclick="Modal.open('${x.point.id}')" 
                title="${Utils.escapeHtml(x.point.title)}">${x.point.id} ${x.point.title}</span>`;
            }).join('')}
          </div>
        </div>
        <div>
          <div class="pm-label" style="margin-bottom:8px;">▸ Source problems (${solvedProblems}/${totalProblems})</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${task.source_problems.map(p => {
              const key = `T${task.num}:${p.id}`;
              const solved = !!(Store.state.taskProgress || {})[key];
              return `<div class="pm-task-item practice ${solved ? 'done' : ''}" style="padding:8px 12px;">
                <button class="task-check ${solved ? 'checked' : ''}" 
                  onclick="event.stopPropagation();Content.toggleTaskProblem('${task.num}', '${p.id}')">
                  ${solved ? '<i data-lucide="check"></i>' : ''}
                </button>
                <span class="label" style="flex:1;cursor:pointer;" onclick="Content.openTaskProblem('${p.id}', ${p.year}, ${p.grade})">
                  <i data-lucide="file-text"></i> ${p.year} · ${Utils.escapeHtml(p.summary)}
                </span>
                <span class="diff-stars">${'★'.repeat(p.difficulty)}${'☆'.repeat(5-p.difficulty)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
  });
  
  container.innerHTML = html;
  Utils.refreshIcons();
},

openTaskProblem(problemId, year, grade) {
  // First: try to find as STEPS point
  const p = getPoint(problemId);
  if (p) {
    Modal.open(problemId);
    return;
  }
  // Fallback: build PDF URL
  const pdf = `Задачи_Минали_Години/Областен/OLI-2-Областен кръг-${year}-${grade} кл-probs`;
  window.open(Utils.pdfUrl(pdf, 1), '_blank');
},

toggleTaskProblem(taskNum, problemId) {
  if (!Store.state.taskProgress) Store.state.taskProgress = {};
  const key = `T${taskNum}:${problemId}`;
  const prev = !!Store.state.taskProgress[key];
  Store.state.taskProgress[key] = !prev;
  History.push('toggleTask', { key, prev });
  Store.save();
  if (Tabs.current === 'tasks') this.renderTasksView();
},

  toggleLevel(lvlId, e) {
    if (e && e.target.closest('.step-reset')) return;
    const key = 'lvl-' + lvlId;
    Store.state.ui.collapsed[key] = !Store.state.ui.collapsed[key];
    Store.save();
    const sec = document.getElementById('level-' + lvlId);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[key]);
  },

  togglePreviewGroup(name, e) {
    if (e && e.target.closest('.step-reset')) return;
    const key = 'prev-' + name;
    Store.state.ui.collapsed[key] = !Store.state.ui.collapsed[key];
    Store.save();
    const sec = document.querySelector(`[data-preview-group="${name}"]`);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[key]);
  },

  applyFilter() {
    const container = document.getElementById('stepsContainer');
    if (!container || !container.children.length) { this.render(); return; }
    const filter = Store.state.ui.filter;
    const query = State.searchQuery;
    const filterActive = filter !== 'all' || !!query;
    
    let anyVisible = false;
    // Steps are now inside .mode-cache, not direct children of container
    container.querySelectorAll('.step').forEach(outerEl => {
      let outerVisible = false;
      outerEl.querySelectorAll('.point').forEach(pointEl => {
        const pid = pointEl.dataset.pid;
        const p = getPoint(pid);
        if (!p) return;
        const shouldShow = matchFilter(p) && matchSearch(p);
        pointEl.style.display = shouldShow ? '' : 'none';
        if (shouldShow) outerVisible = true;
      });
      outerEl.style.display = (outerVisible || !filterActive) ? '' : 'none';
      if (outerVisible || !filterActive) anyVisible = true;
    });
    
    let emptyEl = container.querySelector(':scope > .empty');
    if (!anyVisible && filterActive) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty';
        emptyEl.innerHTML = `<div class="big"><i data-lucide="search-x"></i></div>
          <div>NO RESULTS</div>
          <div style="margin-top:10px;font-size:13px;">Change the filter or search query</div>`;
        container.appendChild(emptyEl);
        Utils.refreshIcons();
      }
      emptyEl.style.display = '';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
    Events.updateFilterCounts();
  },

  buildPointEl(p, flat) {
    const meta = Store.getPoint(p.id);
    const idx = flat.findIndex(x => x.point.id === p.id);
    const el = document.createElement('div');
    el.className = 'point';
    if (meta.done) el.classList.add('done');
    if (meta.fav) el.classList.add('fav');
    el.id = 'point-' + p.id.replace('.', '-');
    el.dataset.pid = p.id;
    el.dataset.idx = idx;

    const pdfBtn = p.pdf
      ? `<a href="${Utils.pdfUrl(p.pdf, p.page)}" target="_blank" class="pdf-btn" onclick="event.stopPropagation()"><i data-lucide="file-text"></i> PDF${p.page ? ' · p. ' + p.page : ''}</a>`
      : '';
    const pageTag = p.page ? `<span class="tag page">p. ${p.page}</span>` : '';
    const notesBadge = meta.notes ? `<span class="notes-badge" title="Has notes"><i data-lucide="pencil"></i></span>` : '';

    let bonusHtml = '';
    if (p.bonus && p.bonus.length) {
      const items = p.bonus.map(b => {
        if (b.type === 'video') {
          return `<a href="#" class="pdf-btn video" onclick="event.preventDefault();event.stopPropagation();Videos.open('${b.driveId}','${Utils.escapeHtml(b.label)}')"><i data-lucide="video"></i> ${Utils.escapeHtml(b.label)}</a>`;
        }
        return `<a href="${Utils.pdfUrl(b.pdf)}" target="_blank" class="pdf-btn bonus" onclick="event.stopPropagation()"><i data-lucide="link"></i> ${Utils.escapeHtml(b.label)}</a>`;
      });
      bonusHtml = `<div class="bonus-row"><span class="section-label" style="margin-right:8px;">MORE:</span>${items.join('')}</div>`;
    }

    el.innerHTML = `
      <div class="point-row" onclick="if(!event.target.closest('.point-check,.point-actions,textarea,input'))Modal.open('${p.id}')">
        <button class="point-check ${meta.done?'checked':''}" onclick="event.stopPropagation();PointActions.toggleDone('${p.id}')">
          ${meta.done?'<i data-lucide="check"></i>':''}
        </button>
        <div class="point-main">
          <div class="point-num">POINT ${p.id}${notesBadge}</div>
          <div class="point-title">${p.title}</div>
          <div class="point-desc">${p.desc}</div>
          <div class="point-tags">
            <span class="tag src">${p.source}</span>
            ${pageTag}
            ${pdfBtn}
          </div>
        </div>
        <div class="point-actions" onclick="event.stopPropagation()">
          <div class="diff-group">
            <button class="diff-btn easy ${meta.diff==='easy'?'active':''}" onclick="PointActions.setDiff('${p.id}','easy',event)" title="Easy">E</button>
            <button class="diff-btn med ${meta.diff==='med'?'active':''}" onclick="PointActions.setDiff('${p.id}','med',event)" title="Medium">M</button>
            <button class="diff-btn hard ${meta.diff==='hard'?'active':''}" onclick="PointActions.setDiff('${p.id}','hard',event)" title="Hard">H</button>
          </div>
          <button class="mini-btn ${meta.fav?'active':''}" onclick="PointActions.toggleFav('${p.id}', event)" title="Star for review">
            <i data-lucide="star"></i>
          </button>
          <button class="mini-btn" onclick="PointActions.toggleExpand('${p.id}', event)" title="Quick preview">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="point-expand">
        <div class="point-expand-inner">
          <div class="section-label">▸ Detailed Notes</div>
          <div class="explanation">${Utils.escapeHtml(p.explanation || '')}</div>
          <div class="section-label">▸ Personal Notes</div>
          <textarea class="notes-area" placeholder="Write your ideas, lemmas, tricks..." oninput="PointActions.saveNotes('${p.id}', this.value)" onclick="event.stopPropagation()">${Utils.escapeHtml(meta.notes||'')}</textarea>
          ${bonusHtml}
        </div>
      </div>
    `;

    return el;
  },

  toggleStep(stepId, e) {
    if (e && e.target.closest('.step-reset')) return;
    Store.state.ui.collapsed[stepId] = !Store.state.ui.collapsed[stepId];
    Store.save();
    const sec = document.getElementById('step-' + stepId);
    if (sec) sec.classList.toggle('collapsed', Store.state.ui.collapsed[stepId]);
  },

  resetStep(stepId, e) {
    e.stopPropagation();
    if (!confirm('Reset all points in this step?')) return;
    const step = STEPS.find(s => s.id === stepId);
    const snapshot = step.points.map(p => ({
      id: p.id,
      prev: JSON.parse(JSON.stringify(Store.getPoint(p.id)))
    }));
    History.push('clearStep', { stepId, snapshot });
    step.points.forEach(p => {
      if (Store.state.progress[p.id]) {
        Store.state.progress[p.id].done = false;
        Store.state.progress[p.id].fav = false;
        Store.state.progress[p.id].diff = null;
      }
    });
    Store.save();
    this.render();
    Sidebar.render();
    Stats.update();
    Utils.toast('Step reset', 'rotate-ccw');
  },

  scrollToStep(id) {
    const el = document.getElementById('step-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToLevel(id) {
    const el = document.getElementById('level-' + id);
    if (!el) return;
    // Разгъни ако е сгънат
    if (el.classList.contains('collapsed')) {
      Store.state.ui.collapsed['lvl-' + id] = false;
      Store.save();
      el.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToPreviewGroup(name) {
    const el = document.querySelector(`[data-preview-group="${name}"]`);
    if (!el) return;
    if (el.classList.contains('collapsed')) {
      Store.state.ui.collapsed['prev-' + name] = false;
      Store.save();
      el.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  scrollToPoint(pid) {
    const el = document.querySelector(`[data-pid="${pid}"]`);
    if (!el) return;
    const sec = el.closest('.step');
    if (sec && sec.classList.contains('collapsed')) {
      const sid = parseInt(sec.id.replace('step-', ''));
      Store.state.ui.collapsed[sid] = false;
      Store.save();
      sec.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight', 'expanded');
    setTimeout(() => el.classList.remove('highlight'), 1300);
  },

  expandAll() {
    STEPS.forEach(s => Store.state.ui.collapsed[s.id] = false);
    Store.save();
    document.querySelectorAll('.step').forEach(el => el.classList.remove('collapsed'));
    document.querySelectorAll('.point').forEach(el => el.classList.add('expanded'));
  },

  collapseAll() {
    STEPS.forEach(s => Store.state.ui.collapsed[s.id] = true);
    Store.save();
    document.querySelectorAll('.step').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.point').forEach(el => el.classList.remove('expanded'));
  },
}
