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

export const Library = {
  data: {
    tools: [
      { label:"Desmos",         url:"https://www.desmos.com/calculator",                     tag:"АЛГ",  desc:"Графичен калкулатор" },
      { label:"GeoGebra",       url:"https://www.geogebra.org/geometry",                     tag:"ГЕОМ", desc:"Динамична геометрия" },
      { label:"Wolfram Alpha",  url:"https://www.wolframalpha.com/",                          tag:"ОБЩО", desc:"Символен solver" },
      { label:"OEIS",           url:"https://oeis.org/",                                      tag:"АЛГ",  desc:"On-Line Encyclopedia of Integer Sequences" },
      { label:"MathPapa",       url:"https://www.mathpapa.com/factoring-calculator/",         tag:"АЛГ",  desc:"Факторизация" },
      { label:"Alpertron",      url:"https://www.alpertron.com.ar/ECM.HTM",                   tag:"ТЧ",   desc:"Факторизация на големи числа" },
      { label:"Visual Patterns",url:"https://www.visualpatterns.org/",                        tag:"КОМБ", desc:"Визуални редици" }
    ],
    books: [
      { label:"640 задачи по ТЧ",       url:"https://store.bg/",                          tag:"ТЧ",   desc:"Сборник с решения" },
      { label:"555 задачи по геометрия",url:"https://store.bg/",                          tag:"ГЕОМ", desc:"Класически сборник" },
      { label:"EGMO (Evan Chen)",       url:"https://bookstore.ams.org/mbk-126",           tag:"ГЕОМ", desc:"Euclidean Geometry in Math Olympiads" },
      { label:"The Art & Craft of Problem Solving", url:"https://www.wiley.com/",          tag:"ОБЩО", desc:"Paul Zeitz" },
      { label:"Al-Jabr",                url:"https://www.amazon.com/",                     tag:"АЛГ",  desc:"История на алгебрата" },
      { label:"OTIS Excerpts",          url:"https://web.evanchen.cc/otis.html",           tag:"ОБЩО", desc:"Olympiad Training Insights" },
      { label:"Modern Olympiad Number Theory", url:"https://web.evanchen.cc/",             tag:"ТЧ",   desc:"Съвременна ТЧ" },
      { label:"Olympiad Combinatorics", url:"https://artofproblemsolving.com/community",   tag:"КОМБ", desc:"Форумни ресурси" }
    ],
    sites: [
      { label:"Math StackExchange",    url:"https://math.stackexchange.com/",               tag:"Q&A",  desc:"Въпроси и отговори" },
      { label:"Art of Problem Solving",url:"https://artofproblemsolving.com/community",     tag:"ФОРУМ",desc:"Най-голямата олимпиадна общност" },
      { label:"Evan Chen Blog",        url:"https://web.evanchen.cc/",                      tag:"БЛОГ", desc:"Handouts и решения" },
      { label:"IMO Geometry",          url:"https://www.imo-official.org/",                 tag:"ГЕОМ", desc:"Официални материали" },
      { label:"Kalva Archive",         url:"https://prase.cz/kalva/",                       tag:"АРХИВ",desc:"Архив от задачи" },
      { label:"D. Grozev Blog",        url:"https://www.dgrozev.org/",                      tag:"БЛОГ", desc:"Български олимпиадник" },
      { label:"IMO Official",          url:"https://www.imo-official.org/",                 tag:"ОФИЦ", desc:"Официален сайт" }
    ],
    archives: [
      { label:"Maths.bg",     url:"https://maths.bg/",        tag:"БГ", desc:"Олимпиадни материали" },
      { label:"Klasirane",    url:"https://klasirane.com/",   tag:"БГ", desc:"Класирания" },
      { label:"ИЗМАТ",        url:"https://math.bas.bg/",     tag:"БГ", desc:"Институт по математика" },
      { label:"Списание",     url:"https://math.bas.bg/",     tag:"БГ", desc:"Математическо списание" }
    ]
  },

  render() {
    const c = document.getElementById('libraryContent');
    if (!c) return;
    const sec = (key, icon, title) => {
      const items = this.data[key].map(x => `
        <a class="lib-card" href="${x.url}" target="_blank" rel="noopener">
          <span class="ext"><i data-lucide="external-link"></i></span>
          <div class="lbl-row">
            <span class="lbl">${Utils.escapeHtml(x.label)}</span>
            <span class="tag-pill">${x.tag}</span>
          </div>
          <div class="desc">${Utils.escapeHtml(x.desc)}</div>
          <div class="url">${Utils.escapeHtml(x.url)}</div>
        </a>`).join('');
      return `
        <div class="library-section ${key}">
          <h2><i data-lucide="${icon}"></i> ${title}</h2>
          <div class="lib-grid">${items}</div>
        </div>`;
    };
    c.innerHTML = `
      <div class="library-hero">
        <div class="eyebrow">RESOURCES</div>
        <h1>LIBRARY</h1>
        <p>Инструменти, книги, сайтове и архиви — всичко на едно място. Всички линкове се отварят в нов таб.</p>
      </div>
      ${sec('tools',    'wrench',       'TOOLS')}
      ${sec('books',    'book-open',    'BOOKS')}
      ${sec('sites',    'globe',        'WEBSITES')}
      ${sec('archives', 'archive',      'ARCHIVES (БГ)')}
    `;
    Utils.refreshIcons();
  }
}