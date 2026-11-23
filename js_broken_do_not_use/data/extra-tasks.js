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

export const EXTRA_TASKS = {
  "2.1":[
    { label:"BMO 1993/3 (Допиращи се окръжности)", pdf:"Материали_БГ/BMO_1984-2006", page:10, difficulty:4, requires_also:["1.5"] },
    { label:"ОИ 2019/11 кл, Зад 4 (Полюси/поляри)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs", page:1, difficulty:5, requires_also:["2.5"] },
    { label:"Book 4 — Ch 9.3: Harmonic Bundles", pdf:"Материали_EN/book-4", page:173, difficulty:4 },
    { label:"Book 3 — Treasures: Complete Quads", pdf:"Материали_EN/book-3", page:60, difficulty:5 }
  ],
  "2.2":[
    { label:"OT_2012, Боев — Симедиани (13 задачи)", pdf:"Материали_БГ/OT_2012", page:67, difficulty:4 },
    { label:"BMO 1990/2 (Симедиана)", pdf:"Материали_БГ/BMO_1984-2006", page:7, difficulty:4 },
    { label:"Book 4 — Ch 7.4: Barycentric Symmedian", pdf:"Материали_EN/book-4", page:122, difficulty:5 }
  ],
  "2.3":[
    { label:"NOM_2011, Израел (Инверсия)", pdf:"Материали_БГ/NOM_2011", page:5, difficulty:5 },
    { label:"NOM_2012, Русия 11.4", pdf:"Материали_БГ/NOM_2012", page:8, difficulty:5 },
    { label:"Book 4 — Ch 8: Inversion", pdf:"Материали_EN/book-4", page:149, difficulty:4 },
    { label:"Book 4 — Ch 8.5: Inversion in Circles", pdf:"Материали_EN/book-4", page:157, difficulty:5 }
  ],
  "2.4":[
    { label:"OT_2010, Събева — Спирално подобие", pdf:"Материали_БГ/OT_2010", page:31, difficulty:5 },
    { label:"OT_2012, Белухов — Spiral Similarity", pdf:"Материали_БГ/OT_2012", page:14, difficulty:5 },
    { label:"Book 3 — Treasures: Equilateral Triangles", pdf:"Материали_EN/book-3", page:67, difficulty:5 }
  ],
  "2.5":[
    { label:"ОИ 2019/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs", page:1, difficulty:5, requires_also:["2.1","1.4"] },
    { label:"NOM_2015-16, Русия 11.3", pdf:"Материали_БГ/NOM_2015-2016", page:12, difficulty:5 },
    { label:"Book 4 — Ch 9.5: Poles & Polars", pdf:"Материали_EN/book-4", page:178, difficulty:4 },
    { label:"Book 4 — La Hire's Theorem (Ch 9.5)", pdf:"Материали_EN/book-4", page:179, difficulty:4 }
  ],
  "2.6":[
    { label:"Book 4 — Ch 9.6: Pascal via Barycentric", pdf:"Материали_EN/book-4", page:181, difficulty:5 },
    { label:"NOM_2015-16, Китай 5 (Pascal)", pdf:"Материали_БГ/NOM_2015-2016", page:8, difficulty:5 }
  ],
  "2.7":[
    { label:"Book 4 — Example 9.30 (Brianchon)", pdf:"Материали_EN/book-4", page:182, difficulty:5 },
    { label:"NOM_2014, САЩ 3 (Conics)", pdf:"Материали_БГ/NOM_2014", page:7, difficulty:5 }
  ],
  "2.8":[
    { label:"OT_2012, Белухов — Геом. неравенства (9 задачи)", pdf:"Материали_БГ/OT_2012", page:14, difficulty:4 },
    { label:"BMO 1996/1 (OG ≤ √R(R−2r))", pdf:"Материали_БГ/BMO_1984-2006", page:13, difficulty:4, requires_also:["1.8"] },
    { label:"Book 3 — Geometric Inequalities", pdf:"Материали_EN/book-3", page:75, difficulty:4 },
    { label:"Book 7 — Ch 3: Geometric Inequalities", pdf:"Материали_EN/book-7", page:102, difficulty:5 }
  ],
  "3.2":[
    { label:"BMO 1992/1 (mod 1992)", pdf:"Материали_БГ/BMO_1984-2006", page:9, difficulty:4 },
    { label:"ОИ 2022/10 кл, Зад 3 (Делимост)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-10 кл-probs", page:1, difficulty:3, requires_also:["3.1"] },
    { label:"Book 2 — Ch 1.5: Modular Arithmetic", pdf:"Материали_EN/book-2", page:31, difficulty:3 },
    { label:"Book 3 — No Solutions mod p", pdf:"Материали_EN/book-3", page:97, difficulty:4 }
  ],
  "3.3":[
    { label:"BMO 1984/3 (5ⁿ от 5ᵐ)", pdf:"Материали_БГ/BMO_1984-2006", page:1, difficulty:4 },
    { label:"ОИ 2025/10 кл, Зад 4 (Ферма)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs", page:1, difficulty:5, requires_also:["3.4","4.5"] },
    { label:"ОИ 2025/11 кл, Зад 4 (Ферма)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-11 кл-probs", page:1, difficulty:5, requires_also:["3.4"] },
    { label:"Book 2 — Fermat's Little Theorem", pdf:"Материали_EN/book-2", page:39, difficulty:3 },
    { label:"Book 3 — Treasures: Prime mod p", pdf:"Материали_EN/book-3", page:96, difficulty:4 }
  ],
  "3.4":[
    { label:"BMO 1999/4 (Ойлер)", pdf:"Материали_БГ/BMO_1984-2006", page:16, difficulty:4 },
    { label:"ОИ 2025/10 кл, Зад 4 (Ойлер)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs", page:1, difficulty:5, requires_also:["3.3"] },
    { label:"Book 2 — Euler's Theorem", pdf:"Материали_EN/book-2", page:40, difficulty:3 }
  ],
  "3.5":[
    { label:"Book 2 — Wilson's Theorem", pdf:"Материали_EN/book-2", page:36, difficulty:4 },
    { label:"BMS 2003-2005, Зад 11.2 (Уилсън)", pdf:"Материали_БГ/BMS_2003-2005", page:12, difficulty:5 }
  ],
  "3.7":[
    { label:"ОИ 2023/11 кл, Зад 3 (F2 и класове)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-11 кл-probs", page:1, difficulty:4, requires_also:["3.2"] },
    { label:"Book 2 — Primitive Roots", pdf:"Материали_EN/book-2", page:42, difficulty:5 }
  ],
  "3.8":[
    { label:"qrl_pres, Зад 1 (СПОКО)", pdf:"Бонус/lectures-peter/qrl_pres-1", page:11, difficulty:5 },
    { label:"qrl_pres, Зад 2 (k=2^2^n+1)", pdf:"Бонус/lectures-peter/qrl_pres-1", page:13, difficulty:5 },
    { label:"ОИ 2019/11 кл, Зад 3 (F2)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs", page:1, difficulty:5, requires_also:["4.5"] },
    { label:"Book 2 — Quadratic Residues", pdf:"Материали_EN/book-2", page:62, difficulty:4 }
  ],
  "3.9":[
    { label:"BMO 2005/2 (p² − p + 1 куб)", pdf:"Материали_БГ/BMO_1984-2006", page:22, difficulty:4 },
    { label:"Book 2 — p-adic valuations", pdf:"Материали_EN/book-2", page:55, difficulty:4 }
  ],
  "3.10":[
    { label:"Book 3 — Treasures: Pell's Equation", pdf:"Материали_EN/book-3", page:101, difficulty:5 }
  ],
  "3.11":[
    { label:"lekcia4 — сравнения mod p", pdf:"Бонус/lectures-peter/lekcia4-pamp2019", page:1, difficulty:5 }
  ],
  "3.12":[
    { label:"week4, Зад 1 (сума на цифри)", pdf:"Бонус/tema-na-sedmicata/week4-theme", page:1, difficulty:4 }
  ],
  "4.1":[
    { label:"Иран II.6 (xm un + ym vn)", pdf:"Материали_БГ/NOM_2010", page:6, difficulty:5 },
    { label:"ОИ 2020/11 кл, Зад 3 (взаимно прости)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-11 кл-probs", page:1, difficulty:5, requires_also:["3.1"] },
    { label:"Book 2 — Linear Diophantine", pdf:"Материали_EN/book-2", page:47, difficulty:3 }
  ],
  "4.2":[
    { label:"BMO 1991/2 (Херонови тр.)", pdf:"Материали_БГ/BMO_1984-2006", page:8, difficulty:5 },
    { label:"ОИ 2024/10 кл, Зад 3 (Кв. форми)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-10 кл-probs", page:1, difficulty:5, requires_also:["4.4","4.5"] }
  ],
  "4.3":[
    { label:"BMO 1998/4 (x³ + y³ = z³)", pdf:"Материали_БГ/BMO_1984-2006", page:15, difficulty:5 },
    { label:"Book 2 — Cubic Diophantine", pdf:"Материали_EN/book-2", page:50, difficulty:5 }
  ],
  "4.5":[
    { label:"НОМ 2003, 11 кл, Зад 11.3 (прости)", pdf:"Материали_БГ/BMS_2003-2005", page:23, difficulty:5 },
    { label:"ОИ 2021/10 кл, Зад 3 (Непрости)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-10 кл-probs", page:1, difficulty:4, requires_also:["8.10","4.6"] },
    { label:"ОИ 2021/11 кл, Зад 3 (Непрости)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-11 кл-probs", page:1, difficulty:4, requires_also:["8.10"] },
    { label:"Book 2 — Mersenne, Fermat Primes", pdf:"Материали_EN/book-2", page:17, difficulty:3 }
  ],
  "4.6":[
    { label:"ОИ 2021/10 кл, Зад 3 (суми)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-10 кл-probs", page:1, difficulty:4, requires_also:["4.5"] }
  ],
  "4.7":[
    { label:"ОИ 2016/10 кл, Зад 4 (Антиверига)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-10 кл-probs", page:1, difficulty:4, requires_also:["8.3","4.9"] },
    { label:"ОИ 2026/10 кл, Зад 3 (Специални делители)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2026-10 кл-probs", page:1, difficulty:4, requires_also:["3.1","4.5"] },
    { label:"Book 2 — Multiplicative Functions", pdf:"Материали_EN/book-2", page:45, difficulty:4 }
  ],
  "4.8":[
    { label:"ОИ 2019/10 кл, Зад 4 (троичен запис)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs", page:1, difficulty:4, requires_also:["5.7","3.2"] },
    { label:"Book 2 — Legendre Formula, Factorials", pdf:"Материали_EN/book-2", page:68, difficulty:4 }
  ],
  "4.9":[
    { label:"Book 3 — Treasures: Antichains", pdf:"Материали_EN/book-3", page:88, difficulty:5 }
  ],
  "4.10":[
    { label:"Book 2 — Sum of Two Squares", pdf:"Материали_EN/book-2", page:60, difficulty:5 }
  ],
  "5.2":[
    { label:"BMO 1988/2 (Полином 2 променливи)", pdf:"Материали_БГ/BMO_1984-2006", page:5, difficulty:5, requires_also:["5.3"] },
    { label:"Book 10 — Ch 10.4: Newton's Sums", pdf:"Материали_EN/book-10", page:314, difficulty:4 }
  ],
  "5.3":[
    { label:"ОИ 2024/11 кл, Зад 1 (реципрочни)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-11 кл-probs", page:1, difficulty:3, requires_also:["5.12","5.4"] },
    { label:"Book 10 — Ch 4: Symmetric Polynomials", pdf:"Материали_EN/book-10", page:98, difficulty:4 }
  ],
  "5.4":[
    { label:"ОИ 2023/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:2 },
    { label:"ОИ 2021/11 кл, Зад 1 (с параметър)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-11 кл-probs", page:1, difficulty:3, requires_also:["5.1","7.5"] },
    { label:"ОИ 2024/10 кл, Зад 1 (АП)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-10 кл-probs", page:1, difficulty:2, requires_also:["7.6"] },
    { label:"Book 10 — Ch 11: Rational Roots, Eisenstein", pdf:"Материали_EN/book-10", page:322, difficulty:3 }
  ],
  "5.5":[
    { label:"ОИ 2023/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:5, requires_also:["3.1","5.7"] },
    { label:"ОИ 2026/11 кл, Зад 3 (Кв. полиноми)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2026-11 кл-probs", page:1, difficulty:5, requires_also:["5.1"] },
    { label:"Book 10 — Ch 11 (SFFT)", pdf:"Материали_EN/book-10", page:322, difficulty:4 }
  ],
  "5.6":[
    { label:"BMO 1987/3 (Тригонометрично)", pdf:"Материали_БГ/BMO_1984-2006", page:4, difficulty:3 },
    { label:"Book 10 — Chebyshev Polynomials", pdf:"Материали_EN/book-10", page:530, difficulty:4 }
  ],
  "5.7":[
    { label:"ОИ 2019/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs", page:1, difficulty:4, requires_also:["3.2","4.8"] },
    { label:"ОИ 2018/10 кл, Зад 2 (деление с остатък)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-10 кл-probs", page:1, difficulty:3, requires_also:["5.4"] },
    { label:"ОИ 2023/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:5, requires_also:["5.5","3.1"] },
    { label:"Book 10 — Ch 18: Divisibility of Polynomials", pdf:"Материали_EN/book-10", page:511, difficulty:4 }
  ],
  "5.8":[
    { label:"Book 8 — Ch 10: Lagrange Interpolation", pdf:"Материали_EN/book-8", page:200, difficulty:4 }
  ],
  "5.9":[
    { label:"ОИ 2016/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-10 кл-probs", page:1, difficulty:3, requires_also:["5.1"] },
    { label:"ОИ 2016/11 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:3, requires_also:["5.1","5.10"] },
    { label:"ОИ 2018/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-10 кл-probs", page:1, difficulty:3, requires_also:["5.1"] },
    { label:"НОМ 2003, 11 кл, Зад 11.1", pdf:"Материали_БГ/BMS_2003-2005", page:7, difficulty:4, requires_also:["5.1"] }
  ],
  "5.10":[
    { label:"ОИ 2016/11 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:3, requires_also:["5.9"] },
    { label:"ОИ 2017/11 кл, Зад 1 (Хомогенни)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-11 кл-probs", page:1, difficulty:3, requires_also:["5.1"] },
    { label:"ОИ 2019/11 кл, Зад 2 (Тригонометрия)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs", page:1, difficulty:2, requires_also:["1.6"] },
    { label:"ОИ 2022/11 кл, Зад 2", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-11 кл-probs", page:1, difficulty:4, requires_also:["1.5"] },
    { label:"НОМ 2014, Русия 11.1", pdf:"Материали_БГ/NOM_2014", page:10, difficulty:5 },
    { label:"BMO 1987/3", pdf:"Материали_БГ/BMO_1984-2006", page:4, difficulty:3, requires_also:["5.6"] }
  ],
  "5.11":[
    { label:"ОИ 2019/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs", page:1, difficulty:3, requires_also:["5.4"] },
    { label:"ОИ 2022/11 кл, Зад 1 (Ирац. неравенства)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-11 кл-probs", page:1, difficulty:3, requires_also:["6.10"] },
    { label:"ОИ 2023/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:2, requires_also:["7.5"] },
    { label:"ОИ 2025/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs", page:1, difficulty:3, requires_also:["5.1","5.4"] }
  ],
  "5.12":[
    { label:"ОИ 2024/11 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-11 кл-probs", page:1, difficulty:3, requires_also:["5.3","5.4"] }
  ],
  "6.2":[
    { label:"BMO 1984/1 (α_i)", pdf:"Материали_БГ/BMO_1984-2006", page:1, difficulty:4, requires_also:["6.1"] },
    { label:"Book 7 — Ch 1.2: AM-HM", pdf:"Материали_EN/book-7", page:15, difficulty:3 }
  ],
  "6.3":[
    { label:"Book 7 — Ch 1.1: QM ≥ AM ≥ GM ≥ HM", pdf:"Материали_EN/book-7", page:10, difficulty:3 }
  ],
  "6.4":[
    { label:"BMO 1998/2 (Радикално)", pdf:"Материали_БГ/BMO_1984-2006", page:15, difficulty:5, requires_also:["6.5"] },
    { label:"BMO 2005/3 (a²/b + b²/c + c²/a)", pdf:"Материали_БГ/BMO_1984-2006", page:22, difficulty:4, requires_also:["6.1"] },
    { label:"ОИ 2020/10 кл, Зад 4 (Коши-Шварц)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-10 кл-probs", page:1, difficulty:4, requires_also:["6.1"] },
    { label:"НОМ 2010, Русия 11.5", pdf:"Материали_БГ/NOM_2010", page:11, difficulty:5 },
    { label:"Book 3 — Treasures: Cauchy-Schwarz", pdf:"Материали_EN/book-3", page:16, difficulty:4 },
    { label:"Book 7 — Ch 1.3: Cauchy-Schwarz", pdf:"Материали_EN/book-7", page:20, difficulty:4 }
  ],
  "6.5":[
    { label:"Book 3 — Treasures: Convex functions", pdf:"Материали_EN/book-3", page:29, difficulty:4 },
    { label:"Book 7 — Ch 1.7: Jensen", pdf:"Материали_EN/book-7", page:43, difficulty:4 }
  ],
  "6.6":[
    { label:"Book 7 — Ch 1.4: Chebyshev", pdf:"Материали_EN/book-7", page:27, difficulty:4 }
  ],
  "6.7":[
    { label:"ОИ 2025/11 кл, Зад 3 (Rearrangement)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-11 кл-probs", page:1, difficulty:3, requires_also:["8.6"] },
    { label:"Book 3 — Treasures: Rearrangements", pdf:"Материали_EN/book-3", page:22, difficulty:4 },
    { label:"Book 7 — Ch 1.5: Rearrangement", pdf:"Материали_EN/book-7", page:30, difficulty:4 }
  ],
  "6.8":[
    { label:"Book 7 — Ch 2.9-2.10: Майоризация", pdf:"Материали_EN/book-7", page:90, difficulty:5 }
  ],
  "6.9":[
    { label:"Book 7 — Ch 2.8: Schur", pdf:"Материали_EN/book-7", page:88, difficulty:4 }
  ],
  "6.10":[
    { label:"Book 7 — Ch 1.6: Hölder и Minkowski", pdf:"Материали_EN/book-7", page:36, difficulty:5 }
  ],
  "7.1":[
    { label:"BMO 1987/1", pdf:"Материали_БГ/BMO_1984-2006", page:4, difficulty:5, requires_also:["7.5"] },
    { label:"BMO 1997/4 (f(xf(x)+f(y)))", pdf:"Материали_БГ/BMO_1984-2006", page:14, difficulty:5, requires_also:["7.4"] },
    { label:"Book 10 — Ch 16: Functional Equations", pdf:"Материали_EN/book-10", page:449, difficulty:4 }
  ],
  "7.2":[
    { label:"Book 10 — Ch 16.3: Bounded FE", pdf:"Материали_EN/book-10", page:456, difficulty:4 }
  ],
  "7.3":[
    { label:"Book 10 — Ch 16.4: Monotone FE", pdf:"Материали_EN/book-10", page:458, difficulty:4 }
  ],
  "7.4":[
    { label:"BMO 1997/4 (инволюция)", pdf:"Материали_БГ/BMO_1984-2006", page:14, difficulty:5 }
  ],
  "7.5":[
    { label:"ОИ 2016/11 кл, Зад 4 (ФУ с итерации)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:5, requires_also:["7.9","7.3"] },
    { label:"ОИ 2023/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:2, requires_also:["5.11"] },
    { label:"Book 10 — Ch 16: FE Techniques", pdf:"Материали_EN/book-10", page:449, difficulty:4 },
    { label:"Book 10 — Ch 17: FE (more)", pdf:"Материали_EN/book-10", page:470, difficulty:5 }
  ],
  "7.6":[
    { label:"ОИ 2024/10 кл, Зад 1", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-10 кл-probs", page:1, difficulty:2, requires_also:["5.4"] },
    { label:"Book 10 — Ch 21: Recurrences", pdf:"Материали_EN/book-10", page:588, difficulty:4 },
    { label:"Book 12 — Ch 9-10: Linear Recurrences", pdf:"Материали_EN/book-12", page:188, difficulty:4 }
  ],
  "7.7":[
    { label:"ОИ 2016/11 кл, Зад 3", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:4, requires_also:["3.1","7.8"] },
    { label:"ОИ 2017/10 кл, Зад 3 (floor)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-10 кл-probs", page:1, difficulty:4, requires_also:["8.10"] }
  ],
  "7.8":[
    { label:"ОИ 2016/11 кл, Зад 3 (граници)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:4, requires_also:["7.7"] },
    { label:"Book 12 — Ch 13: Convergence", pdf:"Материали_EN/book-12", page:280, difficulty:4 }
  ],
  "7.9":[
    { label:"ОИ 2016/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-11 кл-probs", page:1, difficulty:5, requires_also:["7.3","7.5","7.8"] }
  ],
  "8.1":[
    { label:"BMO 1985/4 (1985 души, езици)", pdf:"Материали_БГ/BMO_1984-2006", page:2, difficulty:4, requires_also:["8.3"] },
    { label:"ОИ 2018/10 кл, Зад 3 (Дирихле)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-10 кл-probs", page:1, difficulty:5, requires_also:["3.6","3.2"] },
    { label:"ОИ 2020/11 кл, Зад 4 (Проекции)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-11 кл-probs", page:1, difficulty:5, requires_also:["8.3"] },
    { label:"ОИ 2022/10 кл, Зад 4 (Дирихле)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-10 кл-probs", page:1, difficulty:5, requires_also:["8.2","8.10"] },
    { label:"ОИ 2022/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-11 кл-probs", page:1, difficulty:5, requires_also:["8.2","8.10"] },
    { label:"Book 12 — Ch 5: Pigeonhole", pdf:"Материали_EN/book-12", page:134, difficulty:3 }
  ],
  "8.2":[
    { label:"ОИ 2017/10 кл, Зад 4 (Блок-дизайни)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-10 кл-probs", page:1, difficulty:5, requires_also:["8.11","9.5"] },
    { label:"ОИ 2023/10 кл, Зад 3 (Прави)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:4, requires_also:["8.3"] },
    { label:"Book 12 — Ch 3: PIE", pdf:"Материали_EN/book-12", page:65, difficulty:3 }
  ],
  "8.4":[
    { label:"ОИ 2019/10 кл, Зад 4 (троичен запис)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs", page:1, difficulty:4, requires_also:["5.7","3.2"] },
    { label:"Book 12 — Ch 12: Identities", pdf:"Материали_EN/book-12", page:255, difficulty:3 }
  ],
  "8.5":[
    { label:"ОИ 2025/10 кл, Зад 3 (Вероятностен)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs", page:1, difficulty:5, requires_also:["8.12","8.3"] }
  ],
  "8.6":[
    { label:"ОИ 2023/11 кл, Зад 4 (групи)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-11 кл-probs", page:1, difficulty:4, requires_also:["8.3","8.11"] },
    { label:"ОИ 2025/11 кл, Зад 3 (Rearrangement)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-11 кл-probs", page:1, difficulty:3, requires_also:["6.7"] }
  ],
  "8.7":[
    { label:"Book 12 — Ch 7: Stars and Bars", pdf:"Материали_EN/book-12", page:161, difficulty:3 }
  ],
  "8.8":[
    { label:"ОИ 2016/10 кл, Зад 3 (Пермутации)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2016-10 кл-probs", page:1, difficulty:3, requires_also:["8.6","8.10"] }
  ],
  "8.9":[
    { label:"Book 12 — Ch 14: Generating Functions", pdf:"Материали_EN/book-12", page:314, difficulty:4 }
  ],
  "8.10":[
    { label:"ОИ 2018/11 кл, Зад 4 (Индукция)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-11 кл-probs", page:1, difficulty:5, requires_also:["8.1","9.7"] },
    { label:"ОИ 2022/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-10 кл-probs", page:1, difficulty:5, requires_also:["8.1","8.2"] },
    { label:"Induction Problems", pdf:"Бонус/lectures-navid/Induction Problems", page:1, difficulty:4 },
    { label:"Book 12 — Ch 8: Induction", pdf:"Материали_EN/book-12", page:177, difficulty:4 },
    { label:"Book 3 — Treasures: Induction at Work", pdf:"Материали_EN/book-3", page:33, difficulty:4 }
  ],
  "8.11":[
    { label:"ОИ 2017/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-10 кл-probs", page:1, difficulty:5, requires_also:["8.2","8.3"] },
    { label:"ОИ 2023/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-11 кл-probs", page:1, difficulty:4, requires_also:["8.3","8.6"] }
  ],
  "8.12":[
    { label:"ОИ 2025/10 кл, Зад 3", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2025-10 кл-probs", page:1, difficulty:5, requires_also:["8.3","8.5"] }
  ],
  "8.13":[
    { label:"НОМ 2014, Китай 6", pdf:"Материали_БГ/NOM_2014", page:7, difficulty:5, requires_also:["8.3"] }
  ],
  "8.14":[
    { label:"OT_2012, Пенчев — Фишер", pdf:"Материали_БГ/OT_2012", page:45, difficulty:5 }
  ],
  "9.1":[
    { label:"ОИ 2023/10 кл, Зад 3 (Прави)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:4, requires_also:["8.3"] },
    { label:"Book 12 — Ch 15: Graph Theory", pdf:"Материали_EN/book-12", page:347, difficulty:3 },
    { label:"Book 3 — Treasures: Marriage Lemma", pdf:"Материали_EN/book-3", page:105, difficulty:4 }
  ],
  "9.2":[
    { label:"Book 12 — Ch 15.2: Trees", pdf:"Материали_EN/book-12", page:355, difficulty:3 }
  ],
  "9.3":[
    { label:"Book 12 — Ch 15.3: Euler/Hamilton", pdf:"Материали_EN/book-12", page:362, difficulty:4 }
  ],
  "9.4":[
    { label:"НОМ 2015-16, Китай (клики)", pdf:"Материали_БГ/NOM_2015-2016", page:8, difficulty:5 }
  ],
  "9.5":[
    { label:"ОИ 2017/11 кл, Зад 4 (Туран)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-11 кл-probs", page:1, difficulty:5, requires_also:["8.3","8.10"] }
  ],
  "9.6":[
    { label:"BMO 2001/4 (R(3,3) приложение)", pdf:"Материали_БГ/BMO_1984-2006", page:18, difficulty:5 }
  ],
  "9.7":[
    { label:"ОИ 2018/11 кл, Зад 4 (оцветяване)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-11 кл-probs", page:1, difficulty:5, requires_also:["8.10","8.1"] },
    { label:"ОИ 2024/10 кл, Зад 4 (mod 5)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2024-10 кл-probs", page:1, difficulty:4, requires_also:["8.1","8.10"] }
  ],
  "9.8":[
    { label:"BMO 2001/4 (Куб 3×3×3)", pdf:"Материали_БГ/BMO_1984-2006", page:18, difficulty:5, requires_also:["9.9"] },
    { label:"ОИ 2019/10 кл, Зад 3 (Паритет)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-10 кл-probs", page:1, difficulty:4, requires_also:["8.3"] },
    { label:"ОИ 2020/10 кл, Зад 3 (Инварианти)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2020-10 кл-probs", page:1, difficulty:4, requires_also:["8.10","3.1"] },
    { label:"ОИ 2021/10 кл, Зад 4 (F2)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-10 кл-probs", page:1, difficulty:5, requires_also:["9.11","8.3"] }
  ],
  "9.9":[
    { label:"BMO 2001/4 (симетрия)", pdf:"Материали_БГ/BMO_1984-2006", page:18, difficulty:5 }
  ],
  "9.10":[
    { label:"ОИ 2017/11 кл, Зад 3 (Игри)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-11 кл-probs", page:1, difficulty:5, requires_also:["3.1"] },
    { label:"CP4 Book 2, 5.7 + 9.16", pdf:"Материали_EN/Програмиране/book-4 (1)", page:48, difficulty:4 },
    { label:"Book 12 — Ch 13.4: Combinatorial Games", pdf:"Материали_EN/book-12", page:284, difficulty:5 }
  ],
  "9.11":[
    { label:"ОИ 2019/11 кл, Зад 3 (F2)", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2019-11 кл-probs", page:1, difficulty:5, requires_also:["4.5","4.4","3.1"] },
    { label:"ОИ 2021/10 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-10 кл-probs", page:1, difficulty:5, requires_also:["9.8"] },
    { label:"ОИ 2021/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2021-11 кл-probs", page:1, difficulty:5, requires_also:["9.8"] }
  ],
  "13.1":[
    { label:"Cauchy-Davenport — Tema2", pdf:"Теми с Лекции/Tema2-BorislavKirilov", page:1, difficulty:5, requires_also:["8.3"] }
  ],
  "13.2":[
    { label:"EGZ — Tema2", pdf:"Теми с Лекции/Tema2-BorislavKirilov", page:1, difficulty:5 }
  ],
  "13.3":[
    { label:"Alon's Nullstellensatz — Tema2", pdf:"Теми с Лекции/Tema2-BorislavKirilov", page:1, difficulty:5, requires_also:["5.3"] }
  ],
  "2.11":[
    { label:"ОИ 2017/11 кл, Зад 2", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2017-11 кл-probs", page:1, difficulty:5, requires_also:["1.2","1.5","1.8"] },
    { label:"ОИ 2018/11 кл, Зад 3", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2018-11 кл-probs", page:1, difficulty:5, requires_also:["1.5","1.10"] },
    { label:"Book 4 — Ch 3: Orthocenter", pdf:"Материали_EN/book-4", page:37, difficulty:4 },
    { label:"Book 4 — Ch 3.4: Orthic Triangle", pdf:"Материали_EN/book-4", page:45, difficulty:5 }
  ],
  "2.12":[
    { label:"Book 4 — Ch 9.1: Desargues", pdf:"Материали_EN/book-4", page:170, difficulty:5 },
    { label:"НОМ 2015-16, Русия 11.3", pdf:"Материали_БГ/NOM_2015-2016", page:12, difficulty:5, requires_also:["2.5"] }
  ],
  "8.15":[
    { label:"ОИ 2022/11 кл, Зад 4", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2022-11 кл-probs", page:1, difficulty:5, requires_also:["8.1","8.2","8.10"] },
    { label:"ОИ 2023/10 кл, Зад 3", pdf:"Задачи_Минали_Години/Областен/OLI-2-Областен кръг-2023-10 кл-probs", page:1, difficulty:4, requires_also:["8.3"] },
    { label:"Book 3 — Extremal Principle", pdf:"Материали_EN/book-3", page:80, difficulty:4 }
  ],
}

(function expandTasks() {
  const flat = [];
  for (const s of STEPS) for (const p of s.points) flat.push(p);
  const flatMap = {};
  flat.forEach(p => flatMap[p.id] = p);

  let added = 0, points = 0;
  for (const id in EXTRA_TASKS) {
    const p = flatMap[id];
    if (!p) continue;
    if (!p.tasks) p.tasks = [];
    const existing = new Set(p.tasks.map(t => t.label));
    const fresh = EXTRA_TASKS[id].filter(t => !existing.has(t.label));
    if (fresh.length) {
      p.tasks.push(...fresh);
      added += fresh.length;
      points++;
    }
  }
  console.log(`[Task Expansion] Added ${added} tasks across ${points} points`);
})();
