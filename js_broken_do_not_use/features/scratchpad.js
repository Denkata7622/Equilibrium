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

export const Scratchpad = {
  canvas: null, ctx: null, drawing: false, lastX: 0, lastY: 0,
  color: '#000000',
  currentTool: 'pen',      // ⬅️ ПРЕИМЕНУВАНО от `tool` (беше конфликт с method-а)
  size: 3, grid: true,
  history: [], historyIdx: -1, maxHistory: 30,
  _ro: null,
  // Line tool state
  startX: 0, startY: 0, previewEndX: null, previewEndY: null, savedImage: null,
  // Text tool
  fontSize: 22,
  // Global pointerup listener ref
  _boundGlobalUp: null,

  open() {
    document.getElementById('scratchOverlay').classList.add('open');
    if (!this.canvas) this.initCanvas();
    requestAnimationFrame(() => {
      this.resize(true);
      setTimeout(() => this.resize(true), 50);
      setTimeout(() => this.resize(true), 150);
      setTimeout(() => this.resize(true), 400);
    });
    Utils.refreshIcons();
  },

  close() {
    if (this.drawing) this.endStroke(null);
    document.getElementById('scratchOverlay').classList.remove('open');
  },

  initCanvas() {
    this.canvas = document.getElementById('scratchCanvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    const c = this.canvas;

    c.addEventListener('pointerdown', e => this.startStroke(e));
    c.addEventListener('pointermove', e => this.moveStroke(e));
    c.addEventListener('pointerup', e => this.endStroke(e));
    c.addEventListener('pointercancel', e => this.endStroke(e));
    c.style.touchAction = 'none';

    c.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    c.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    // Global pointerup fallback — catches releases outside canvas
    this._boundGlobalUp = (e) => {
      if (this.drawing) this.endStroke(e);
    };
    document.addEventListener('pointerup', this._boundGlobalUp);
    document.addEventListener('pointercancel', this._boundGlobalUp);

    this._syncGridVisual();   // ⬅️ NEW: прилага grid-а и на бутона, и на canvas-а

    window.addEventListener('resize', () => {
      if (document.getElementById('scratchOverlay').classList.contains('open')) {
        this.resize(true);
      }
    });

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => {
        if (this.drawing) return;
        if (document.getElementById('scratchOverlay').classList.contains('open')) {
          this.resize(true);
        }
      });
      this._ro.observe(this.canvas.parentElement);
    }

    this.applyStyle();
  },

  startStroke(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    const { x, y } = this.pos(e);

    // ── TEXT TOOL ──
    if (this.currentTool === 'text') {
      this._placeText(x, y);
      return;
    }

    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}

    this.drawing = true;
    this.lastX = x; this.lastY = y;
    this.startX = x; this.startY = y;

    // ── LINE TOOL ──
    if (this.currentTool === 'line') {
      try {
        this.savedImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      } catch (err) {
        this.savedImage = null;
      }
      this.previewEndX = x; this.previewEndY = y;
      return;
    }

    // ── PEN / ERASER ──
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + 0.01, y + 0.01);
    this.ctx.stroke();
  },

  moveStroke(e) {
    if (!this.drawing) return;
    e.preventDefault();
    const { x, y } = this.pos(e);

    // ── LINE TOOL preview ──
    if (this.currentTool === 'line') {
      if (this.savedImage) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.putImageData(this.savedImage, 0, 0);
        this.ctx.restore();
      }
      this.previewEndX = x; this.previewEndY = y;
      this.applyStyle();
      this.ctx.save();
      this.ctx.setLineDash([6, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    // ── PEN / ERASER ──
    const midX = (this.lastX + x) / 2;
    const midY = (this.lastY + y) / 2;
    this.ctx.quadraticCurveTo(this.lastX, this.lastY, midX, midY);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(midX, midY);
    this.lastX = x; this.lastY = y;
  },

  endStroke(e) {
    if (!this.drawing) return;
    this.drawing = false;

    if (e && e.pointerId != null) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    // ── LINE TOOL commit ──
    if (this.currentTool === 'line') {
      if (this.savedImage) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.putImageData(this.savedImage, 0, 0);
        this.ctx.restore();
        this.savedImage = null;
      }
      if (this.previewEndX !== null && this.previewEndY !== null) {
        this.applyStyle();
        this.ctx.save();
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(this.previewEndX, this.previewEndY);
        this.ctx.stroke();
        this.ctx.restore();
        this.previewEndX = null;
        this.previewEndY = null;
      }
    }

    this.ctx.beginPath();
    this.pushHistory();
  },

  _placeText(x, y) {
    const text = window.prompt('Текст:', '');
    if (!text || !text.trim()) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.color;
    this.ctx.font = `${this.fontSize}px "JetBrains Mono", monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
    this.pushHistory();
    Utils.toast('Текст добавен', 'type');
  },

  pos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  },

  resize(keepContent) {
    const c = this.canvas;
    if (!c) return;
    const wrap = c.parentElement;
    if (!wrap) return;

    const rw = wrap.clientWidth || wrap.offsetWidth;
    const rh = wrap.clientHeight || wrap.offsetHeight;
    if (rw <= 0 || rh <= 0) return;

    c.style.width = rw + 'px';
    c.style.height = rh + 'px';

    const dpr = window.devicePixelRatio || 1;
    const newW = Math.max(1, Math.round(rw * dpr));
    const newH = Math.max(1, Math.round(rh * dpr));
    if (c.width === newW && c.height === newH) return;

    const oldW = c.width, oldH = c.height;
    let img = null;
    if (keepContent && oldW > 0 && oldH > 0) {
      try { img = this.ctx.getImageData(0, 0, oldW, oldH); } catch (err) {}
    }

    c.width = newW;
    c.height = newH;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (img) {
      try {
        const tmp = document.createElement('canvas');
        tmp.width = oldW;
        tmp.height = oldH;
        tmp.getContext('2d').putImageData(img, 0, 0);
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.drawImage(tmp, 0, 0);
        this.ctx.restore();
      } catch (err) {}
    }
    this._syncGridVisual();   // ⬅️ NEW: reapply grid след resize
    this.applyStyle();
  },

  applyStyle() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.currentTool === 'eraser' ? this.size * 6 : this.size;
    if (this.currentTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.color;
    }
  },

  setColor(c) {
    this.color = c;
    if (this.currentTool === 'eraser') this.currentTool = 'pen';
    document.querySelectorAll('.scratch-btn[data-color]').forEach(b =>
      b.classList.toggle('active', b.dataset.color === c));
    document.querySelectorAll('.scratch-btn[data-tool]').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === this.currentTool));
    this.applyStyle();
  },

  // ⬇️ METHOD — сега вече няма конфликт с property
  tool(t) {
    if (this.drawing) this.endStroke(null);
    this.currentTool = t;
    document.querySelectorAll('.scratch-btn[data-tool]').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === t));
    document.querySelectorAll('.scratch-btn[data-color]').forEach(b =>
      b.classList.remove('active'));
    if (t === 'pen' || t === 'line' || t === 'text') {
      const cb = document.querySelector(`.scratch-btn[data-color="${this.color}"]`);
      if (cb) cb.classList.add('active');
    }
    this.applyStyle();
    if (this.canvas) {
      this.canvas.style.cursor = (t === 'text') ? 'text' : 'crosshair';
    }
  },

toggleGrid() {
  this.grid = !this.grid;
  this._syncGridVisual();
},

  // NEW: bulletproof grid apply — inline style wins over any CSS cascade
  _syncGridVisual() {
    if (!this.canvas) return;
    if (this.grid) {
      this.canvas.classList.add('grid');
      this.canvas.style.setProperty('background-image',
        'linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), ' +
        'linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px)', 'important');
      this.canvas.style.setProperty('background-size', '20px 20px', 'important');
    } else {
      this.canvas.classList.remove('grid');
      this.canvas.style.removeProperty('background-image');
      this.canvas.style.removeProperty('background-size');
      this.canvas.style.backgroundImage = 'none';
    }
    const btn = document.getElementById('scratchGridBtn');
    if (btn) btn.classList.toggle('active', this.grid);
  },

  pushHistory() {
    try {
      const img = this.canvas.toDataURL('image/png');
      if (this.history[this.historyIdx] === img) return;
      this.history = this.history.slice(0, this.historyIdx + 1);
      this.history.push(img);
      if (this.history.length > this.maxHistory) this.history.shift();
      this.historyIdx = this.history.length - 1;
    } catch (err) {}
  },

  undo() {
    if (this.historyIdx <= 0) return;
    this.historyIdx--;
    this._loadImg(this.history[this.historyIdx]);
  },

  _loadImg(data) {
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
      this.ctx.restore();
      this.applyStyle();
    };
    img.src = data;
  },

  clear() {
    if (!confirm('Clear scratchpad?')) return;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.applyStyle();
    this.pushHistory();
  },

  save() {
    const tmp = document.createElement('canvas');
    tmp.width = this.canvas.width;
    tmp.height = this.canvas.height;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = '#ffffff';
    tctx.fillRect(0, 0, tmp.width, tmp.height);
    tctx.drawImage(this.canvas, 0, 0);
    const url = tmp.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scratch-' + Utils.todayStr() + '-' + Date.now() + '.png';
    a.click();
    Utils.toast('Записано', 'download');
  },
}