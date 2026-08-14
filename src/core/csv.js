// データのCSVダウンロード機能（React版・vanilla版で共有）

// トレースからCSVに書き出す対象のデータ系プロパティ
const DATA_KEYS = [
    "x", "y", "z",
    "labels", "values", "text",
    "r", "theta",
    "lat", "lon", "locations",
    "open", "high", "low", "close",
];

function isArrayLike(v) {
    return Array.isArray(v) || ArrayBuffer.isView(v);
}

function escapeCell(value) {
    if (value === null || value === undefined) return "";
    const s = value instanceof Date ? value.toISOString() : String(value);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * Plotly のトレース配列（plotDiv.data 相当）をCSV文字列に変換する。
 * 各トレースのデータ系プロパティ（x / y / z / labels / values など）を列として並べる。
 * 2次元配列（ヒートマップの z など）は列ごとに展開する。
 *
 * @param {Array<object>} traces Plotly のトレース配列
 * @returns {string|null} CSV文字列。書き出せるデータが無い場合は null
 */
export function tracesToCsv(traces) {
    const list = Array.isArray(traces) ? traces : [];
    const columns = [];

    list.forEach((trace, i) => {
        if (!trace || typeof trace !== "object") return;
        const prefix = list.length > 1 ? `${trace.name || `trace${i + 1}`} ` : "";

        DATA_KEYS.forEach((key) => {
            const value = trace[key];
            if (!isArrayLike(value)) return;

            if (Array.isArray(value) && value.some(isArrayLike)) {
                // 2次元配列: 列ごとに展開して行列をそのまま再現する
                const colCount = Math.max(
                    ...value.map((row) => (isArrayLike(row) ? row.length : 1))
                );
                for (let j = 0; j < colCount; j++) {
                    columns.push({
                        header: `${prefix}${key}[${j}]`,
                        values: value.map((row) => (isArrayLike(row) ? row[j] : row)),
                    });
                }
            } else {
                columns.push({ header: `${prefix}${key}`, values: Array.from(value) });
            }
        });
    });

    if (columns.length === 0) return null;

    const rowCount = Math.max(...columns.map((c) => c.values.length));
    const lines = [columns.map((c) => escapeCell(c.header)).join(",")];
    for (let r = 0; r < rowCount; r++) {
        lines.push(columns.map((c) => escapeCell(c.values[r])).join(","));
    }
    return lines.join("\r\n");
}

// ユーザー指定の layout からグラフタイトルを取り出す。無ければ null。
// （_fullLayout はタイトル未指定時に編集モード用のプレースホルダー文字列を
// 持つことがあるため参照しない）
function plotTitleText(plotDiv) {
    const raw = plotDiv.layout && plotDiv.layout.title;
    const text = typeof raw === "string" ? raw : raw && raw.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
}

/**
 * ダウンロードさせるCSVのファイル名（"[グラフタイトル]-data.csv"）を返す。
 * タイトルが無い場合は "data.csv"。
 *
 * @param {HTMLElement} plotDiv Plotly のグラフ div（.js-plotly-plot 要素）
 */
export function csvFilename(plotDiv) {
    const title = plotTitleText(plotDiv);
    if (!title) return "data.csv";
    return `${title.replace(/[\\/:*?"<>|]/g, "_")}-data.csv`;
}

/**
 * グラフのデータをCSVファイルとしてダウンロードさせる。
 *
 * @param {HTMLElement} plotDiv Plotly のグラフ div（.js-plotly-plot 要素）
 */
export function downloadCsv(plotDiv) {
    const csv = tracesToCsv(plotDiv && plotDiv.data);
    if (csv === null) return;

    const filename = csvFilename(plotDiv);

    // BOM付きにしてExcelでの文字化けを防ぐ
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
