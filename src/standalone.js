// =============================================================
// quelmap-plotly — 素のHTML / vanilla JS 向けエントリ
//
// このスクリプトを読み込むと、2通りの使い方ができます。
//
// (A) 自動適用（ドロップイン）★
//     すでに Plotly.js を使っているページに、この CSS と JS の
//     <link> / <script> を足すだけで、`window.Plotly.newPlot` /
//     `Plotly.react` を自動的にラップし、ツールバー（モードバー）と
//     ホバー（ツールチップ）のカスタマイズを適用します。
//     既存コードの `Plotly.newPlot(...)` 呼び出しはそのままで構いません。
//
//       <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>
//       <link  rel="stylesheet" href=".../quelmap-plotly.css">
//       <script src=".../quelmap-plotly.umd.js"></script>
//       <div id="myDiv"></div>
//       <script>
//         Plotly.newPlot('myDiv', data, layout, config); // 自動でカスタム適用
//       </script>
//
//     自動適用を止めたい場合は、本スクリプトを読み込む前に
//       window.__QUELMAP_DISABLE_AUTOPATCH__ = true;
//     を設定するか、後から `QuelmapPlot.uninstall()` を呼んでください。
//
// (B) 明示 API
//     React なしで Plotly.js と同じ感覚の命令的 API を使います。
//       QuelmapPlot.newPlot('myDiv', data, layout, config);
//     （こちらはコンテナ内に内部 div を作り、layout の既定値も含めて
//       React 版 <QuelmapPlot /> と同じ挙動になります）
// =============================================================
import "./quelmap-plotly.css";
import { buildLayout, buildConfig } from "./core/options.js";
import { customizeModebar } from "./core/modebar.js";
import { setupTooltip } from "./core/tooltip.js";

// ---- Plotly 本体への参照 -------------------------------------------------

// window.Plotly を取得（無ければ undefined を返す・例外は投げない）
function getPlotlyMaybe() {
    return typeof window !== "undefined" ? window.Plotly : undefined;
}

// window.Plotly を取得（無ければ分かりやすいエラーを投げる）
function getPlotly() {
    const P = getPlotlyMaybe();
    if (!P) {
        throw new Error(
            "[quelmap-plotly] Plotly.js が見つかりません。先に Plotly.js を読み込んでください " +
            '(例: <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>)。'
        );
    }
    return P;
}

// 自動適用でラップする前の「素の」Plotly メソッドを退避しておく。
// ラップ後に getPlotly().newPlot を呼ぶと再帰・二重適用になるため、
// 内部処理は必ずこの native 経由でネイティブのメソッドを呼ぶ。
//   native    … this を束縛した呼び出し用（内部処理が使う）
//   originals … 束縛前の元の関数（uninstall で元に戻すために使う）
let native = null;
let originals = null;
function ensureNative(P) {
    if (native) return native;
    P = P || getPlotly();
    originals = { newPlot: P.newPlot, react: P.react };
    native = {
        newPlot: P.newPlot.bind(P),
        react: P.react.bind(P),
        Plots: P.Plots,
    };
    return native;
}

// id 文字列または要素を受け取り、対象の要素を返す
function resolveEl(el) {
    const node = typeof el === "string" ? document.getElementById(el) : el;
    if (!node) {
        throw new Error("[quelmap-plotly] 対象の要素が見つかりません: " + el);
    }
    return node;
}

// ---- 描画後に共通で行うカスタマイズ（明示 API / 自動適用で共有） ----------

// モードバーの再構築 + カスタムツールチップの貼り直し
function customizePlot(plotDiv, entry) {
    entry.state.isExpanded = false;
    customizeModebar(plotDiv, entry.state);

    if (entry.tooltip) entry.tooltip.disconnect();
    entry.tooltip = setupTooltip(plotDiv);
}

// 再描画イベント（モードバー再カスタマイズ）とリサイズ監視を一度だけ紐付ける。
//   plotDiv:       Plotly のグラフ div（.js-plotly-plot）
//   observeTarget: サイズ変化を監視する要素
function attachListeners(plotDiv, observeTarget, entry) {
    // Plotly が再描画するたびにモードバーを再カスタマイズ（React 版の onUpdate 相当）
    if (!entry.afterplot && typeof plotDiv.on === "function") {
        entry.afterplot = true;
        if (plotDiv.removeAllListeners) plotDiv.removeAllListeners("plotly_afterplot");
        plotDiv.on("plotly_afterplot", () => customizeModebar(plotDiv, entry.state));
    }

    // コンテナのサイズ変化に追従（responsive:true は主に window resize を見るため補完）
    if (!entry.ro && typeof ResizeObserver !== "undefined") {
        entry.ro = new ResizeObserver(() => {
            try {
                ensureNative().Plots.resize(plotDiv);
            } catch {
                /* 破棄後などは無視 */
            }
        });
        entry.ro.observe(observeTarget);
    }
}

// ===========================================================================
// (B) 明示 API: コンテナ内に内部 div を作って描画する
// ===========================================================================

const registry = new WeakMap(); // container -> entry

// コンテナ内に Plotly 用の内部 div を用意する（React 版の構造を再現）
//   container (position:relative / min-height:400px)
//     > inner.quelmap-plot-wrapper.quelmap-plot-fill(.js-plotly-plot)
function ensureEntry(container) {
    let entry = registry.get(container);
    if (entry) return entry;

    if (!container.style.position) container.style.position = "relative";
    if (!container.style.minHeight) container.style.minHeight = "400px";

    const inner = document.createElement("div");
    inner.className = "quelmap-plot-wrapper quelmap-plot-fill";
    container.appendChild(inner);

    entry = {
        container,
        inner,
        state: { isExpanded: false },
        tooltip: null,
        ro: null,
        afterplot: false,
        last: null,
    };
    registry.set(container, entry);
    return entry;
}

// 保持している data/layout/config で完全に描画し直す（「ビューのリセット」用）
function rebuild(container) {
    const entry = registry.get(container);
    if (!entry || !entry.last) return Promise.resolve();
    const { data, layout, config } = entry.last;
    return newPlot(container, data, layout, config);
}

/**
 * Plotly.newPlot 相当。グラフを新規描画する。
 * @returns {Promise<HTMLElement>} 描画完了後にグラフ div を解決する Promise
 */
export function newPlot(el, data, layout = {}, config = {}) {
    const n = ensureNative();
    const container = resolveEl(el);
    const entry = ensureEntry(container);
    entry.last = { data, layout, config };

    const fullLayout = buildLayout(layout, entry.inner.clientHeight);
    const fullConfig = buildConfig(config, { onReset: () => rebuild(container) });

    return n.newPlot(entry.inner, data, fullLayout, fullConfig).then((gd) => {
        customizePlot(entry.inner, entry);
        attachListeners(entry.inner, container, entry);
        return gd;
    });
}

/**
 * Plotly.react 相当。差分描画でグラフを更新する。
 * 未初期化の場合は newPlot にフォールバックする。
 */
export function react(el, data, layout = {}, config = {}) {
    const n = ensureNative();
    const container = resolveEl(el);
    const entry = registry.get(container);
    if (!entry) return newPlot(el, data, layout, config);

    entry.last = { data, layout, config };
    const fullLayout = buildLayout(layout, entry.inner.clientHeight);
    const fullConfig = buildConfig(config, { onReset: () => rebuild(container) });

    return n.react(entry.inner, data, fullLayout, fullConfig).then((gd) => {
        customizeModebar(entry.inner, entry.state);
        return gd;
    });
}

/** Plotly.relayout 相当 */
export function relayout(el, ...args) {
    const entry = registry.get(resolveEl(el));
    if (!entry) return Promise.resolve();
    return getPlotly().relayout(entry.inner, ...args);
}

/** Plotly.restyle 相当 */
export function restyle(el, ...args) {
    const entry = registry.get(resolveEl(el));
    if (!entry) return Promise.resolve();
    return getPlotly().restyle(entry.inner, ...args);
}

/** Plotly.update 相当 */
export function update(el, ...args) {
    const entry = registry.get(resolveEl(el));
    if (!entry) return Promise.resolve();
    return getPlotly().update(entry.inner, ...args);
}

/** Plotly.purge 相当。グラフを破棄し、監視も停止する。 */
export function purge(el) {
    const container = resolveEl(el);
    const entry = registry.get(container);
    if (!entry) return;

    if (entry.tooltip) entry.tooltip.disconnect();
    if (entry.ro) entry.ro.disconnect();
    getPlotly().purge(entry.inner);
    entry.inner.remove();
    registry.delete(container);
}

// ===========================================================================
// (A) 自動適用: window.Plotly.newPlot / react をラップする
// ===========================================================================

const autoRegistry = new WeakMap(); // graphDiv -> entry

function getAutoEntry(div) {
    let entry = autoRegistry.get(div);
    if (!entry) {
        entry = {
            state: { isExpanded: false },
            tooltip: null,
            ro: null,
            afterplot: false,
            last: null,
        };
        autoRegistry.set(div, entry);
    }
    return entry;
}

// newPlot/react の引数を正規化する。
// Plotly は (gd, data, layout, config) の他に (gd, {data, layout, config, frames})
// という figure オブジェクト形式も受け付けるため、その両方に対応する。
// layout は「最小（ドロップイン）モード」でマージし、利用者の見た目を尊重する。
function buildAutoArgs(div, a, b, c, onReset) {
    const isFigure =
        a && typeof a === "object" && !Array.isArray(a) &&
        (a.data || a.layout || a.frames || a.config);

    if (isFigure) {
        const layout = a.layout || {};
        const config = a.config || {};
        const fig = {
            ...a,
            layout: buildLayout(layout, div.clientHeight, { minimal: true }),
            config: buildConfig(config, { onReset }),
        };
        return { args: [fig], last: { data: a.data || [], layout, config } };
    }

    const data = a || [];
    const layout = b || {};
    const config = c || {};
    return {
        args: [
            data,
            buildLayout(layout, div.clientHeight, { minimal: true }),
            buildConfig(config, { onReset }),
        ],
        last: { data, layout, config },
    };
}

// 保持している描画内容で再描画する（自動適用版の「ビューのリセット」用）
function resetAuto(div) {
    const entry = autoRegistry.get(div);
    if (!entry || !entry.last) return Promise.resolve();
    const { data, layout, config } = entry.last;
    return autoNewPlot(div, data, layout, config);
}

// ラップ後の Plotly.newPlot 本体
function autoNewPlot(gd, a, b, c, ...rest) {
    const n = ensureNative();
    const div = resolveEl(gd);
    div.classList.add("quelmap-plot-wrapper");

    const entry = getAutoEntry(div);
    const { args, last } = buildAutoArgs(div, a, b, c, () => resetAuto(div));
    entry.last = last;

    return n.newPlot(div, ...args, ...rest).then((g) => {
        customizePlot(div, entry);
        attachListeners(div, div, entry);
        return g;
    });
}

// ラップ後の Plotly.react 本体
function autoReact(gd, a, b, c, ...rest) {
    const n = ensureNative();
    const div = resolveEl(gd);
    div.classList.add("quelmap-plot-wrapper");

    const first = !autoRegistry.has(div);
    const entry = getAutoEntry(div);
    const { args, last } = buildAutoArgs(div, a, b, c, () => resetAuto(div));
    entry.last = last;

    return n.react(div, ...args, ...rest).then((g) => {
        if (first) {
            customizePlot(div, entry);
            attachListeners(div, div, entry);
        } else {
            customizeModebar(div, entry.state);
        }
        return g;
    });
}

/**
 * すでにネイティブで描画済みの `.js-plotly-plot` 要素を、後付けで（再描画せずに）
 * カスタマイズする。自動適用スクリプトより前にグラフが描画されていた場合の保険。
 * @param {string|HTMLElement} target グラフ div またはその id
 */
export function enhance(target) {
    const div = resolveEl(target);
    if (autoRegistry.has(div)) return;
    if (!div.classList.contains("js-plotly-plot")) return;
    if (div.classList.contains("quelmap-plot-wrapper")) return;

    div.classList.add("quelmap-plot-wrapper");
    const entry = getAutoEntry(div);
    customizePlot(div, entry);
    attachListeners(div, div, entry);
}

// ---- パッチの導入 / 解除 -------------------------------------------------

const PATCH_FLAG = "__quelmapPatched";

// ページ内のすでに描画済みグラフを拾って enhance する（読込順の保険）
function scanExisting() {
    if (typeof document === "undefined") return;
    const run = () => {
        document.querySelectorAll(".js-plotly-plot").forEach((div) => {
            try {
                enhance(div);
            } catch {
                /* 個別要素の失敗は無視 */
            }
        });
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
        run();
    }
}

/**
 * window.Plotly の newPlot / react をラップして自動適用を有効化する。
 * 既に適用済みなら何もしない（冪等）。
 * @param {object} [P] 対象の Plotly（省略時は window.Plotly）
 * @returns {boolean} 適用できたか
 */
export function install(P) {
    P = P || getPlotlyMaybe();
    if (!P) return false;
    if (P[PATCH_FLAG]) return true;

    ensureNative(P); // 必ずラップ前にネイティブを退避する
    P.newPlot = autoNewPlot;
    P.react = autoReact;
    try {
        Object.defineProperty(P, PATCH_FLAG, { value: true, configurable: true });
    } catch {
        P[PATCH_FLAG] = true;
    }

    scanExisting();
    return true;
}

/** 自動適用を解除し、ネイティブの Plotly.newPlot / react に戻す。 */
export function uninstall() {
    const P = getPlotlyMaybe();
    if (!P || !P[PATCH_FLAG] || !originals) return;
    P.newPlot = originals.newPlot;
    P.react = originals.react;
    try {
        delete P[PATCH_FLAG];
    } catch {
        P[PATCH_FLAG] = false;
    }
}

// スクリプト読込時に自動でパッチを当てる（オプトアウト可能）
function autoInstall() {
    if (typeof window === "undefined") return;
    if (window.__QUELMAP_DISABLE_AUTOPATCH__) return;

    if (install()) return;

    // Plotly がまだ読み込まれていない場合に備えてポーリング（最大 ~30 秒）
    let tries = 0;
    const timer = setInterval(() => {
        if (install() || ++tries > 600) clearInterval(timer);
    }, 50);
}

autoInstall();

export default {
    newPlot,
    react,
    relayout,
    restyle,
    update,
    purge,
    install,
    uninstall,
    enhance,
};
