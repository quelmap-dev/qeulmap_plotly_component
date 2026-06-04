// =============================================================
// quelmap-plotly — 素のHTML / vanilla JS 向けエントリ
//
// React なしで、CDN から読み込んだ Plotly.js（window.Plotly）を使って
// Plotly.js と同じ感覚で利用できる命令的 API を公開します。
//
//   <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>
//   <script src=".../quelmap-plotly.umd.js"></script>
//   <link rel="stylesheet" href=".../quelmap-plotly.css">
//   <div id="myDiv"></div>
//   <script>
//     QuelmapPlot.newPlot('myDiv', data, layout, config);
//   </script>
// =============================================================
import "./quelmap-plotly.css";
import { buildLayout, buildConfig } from "./core/options.js";
import { customizeModebar } from "./core/modebar.js";
import { setupTooltip } from "./core/tooltip.js";

// container 要素 -> 内部状態 を保持（GC に優しいよう WeakMap を使用）
const registry = new WeakMap();

// CDN で読み込まれた Plotly 本体を取得する（遅延参照で読み込み順に寛容にする）
function getPlotly() {
    const P = typeof window !== "undefined" ? window.Plotly : undefined;
    if (!P) {
        throw new Error(
            "[quelmap-plotly] Plotly.js が見つかりません。先に Plotly.js を読み込んでください " +
            '(例: <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>)。'
        );
    }
    return P;
}

// id 文字列または要素を受け取り、コンテナ要素を返す
function resolveEl(el) {
    const node = typeof el === "string" ? document.getElementById(el) : el;
    if (!node) {
        throw new Error("[quelmap-plotly] 対象の要素が見つかりません: " + el);
    }
    return node;
}

// コンテナ内に Plotly 用の内部 div を用意する（React版の構造を再現）
//   container (position:relative / min-height:400px) > inner.quelmap-plot-wrapper(.js-plotly-plot)
function ensureEntry(container) {
    let entry = registry.get(container);
    if (entry) return entry;

    if (!container.style.position) container.style.position = "relative";
    if (!container.style.minHeight) container.style.minHeight = "400px";

    const inner = document.createElement("div");
    inner.className = "quelmap-plot-wrapper";
    container.appendChild(inner);

    entry = {
        container,
        inner,
        state: { isExpanded: false },
        tooltip: null,
        ro: null,
        last: null,
    };
    registry.set(container, entry);
    return entry;
}

// 描画後に毎回行うカスタマイズ（モードバーの再構築 + ツールチップの貼り直し）
function applyCustomizations(entry) {
    entry.state.isExpanded = false;
    customizeModebar(entry.inner, entry.state);

    if (entry.tooltip) entry.tooltip.disconnect();
    entry.tooltip = setupTooltip(entry.inner);
}

// 再描画系イベント・リサイズ監視を一度だけ紐付ける
function attachListeners(entry) {
    const Plotly = getPlotly();
    const { inner, container } = entry;

    // Plotly が再描画するたびにモードバーを再カスタマイズ（React版の onUpdate 相当）
    if (inner.removeAllListeners) inner.removeAllListeners("plotly_afterplot");
    inner.on("plotly_afterplot", () => customizeModebar(inner, entry.state));

    // コンテナのサイズ変化に追従（responsive:true は主に window resize を見るため補完）
    if (!entry.ro && typeof ResizeObserver !== "undefined") {
        entry.ro = new ResizeObserver(() => {
            Plotly.Plots.resize(inner);
        });
        entry.ro.observe(container);
    }
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
    const Plotly = getPlotly();
    const container = resolveEl(el);
    const entry = ensureEntry(container);
    entry.last = { data, layout, config };

    const fullLayout = buildLayout(layout, entry.inner.clientHeight);
    const fullConfig = buildConfig(config, { onReset: () => rebuild(container) });

    return Plotly.newPlot(entry.inner, data, fullLayout, fullConfig).then((gd) => {
        applyCustomizations(entry);
        attachListeners(entry);
        return gd;
    });
}

/**
 * Plotly.react 相当。差分描画でグラフを更新する。
 * 未初期化の場合は newPlot にフォールバックする。
 */
export function react(el, data, layout = {}, config = {}) {
    const Plotly = getPlotly();
    const container = resolveEl(el);
    const entry = registry.get(container);
    if (!entry) return newPlot(el, data, layout, config);

    entry.last = { data, layout, config };
    const fullLayout = buildLayout(layout, entry.inner.clientHeight);
    const fullConfig = buildConfig(config, { onReset: () => rebuild(container) });

    return Plotly.react(entry.inner, data, fullLayout, fullConfig).then((gd) => {
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

export default { newPlot, react, relayout, restyle, update, purge };
