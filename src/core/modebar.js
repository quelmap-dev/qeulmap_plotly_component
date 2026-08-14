// モードバーのカスタマイズ（React版・vanilla版で共有）
// Plotly が DOM を再構築しても再適用できるよう、plotDiv を受け取る純粋な DOM 操作として実装する。
import { csvDownloadIcon } from "./icons.js";
import { downloadCsv } from "./csv.js";
import { attachModebarTooltips } from "./modebar-tooltip.js";

/**
 * モードバーをカスタマイズする。
 *  - ダウンロードボタンのアイコンを差し替え
 *  - 画像保存ボタンの横にCSVダウンロードボタンを追加
 *  - 画像保存・CSV以外のボタン群（ズーム・パン・投げ縄など）は使わないため非表示化
 *  - ホバーツールチップを overflow: hidden の影響を受けない固定配置で描画
 *
 * @param {HTMLElement} plotDiv Plotly のグラフ div（.js-plotly-plot 要素）
 */
export function customizeModebar(plotDiv) {
    const modebar = plotDiv.querySelector(".modebar");
    if (!modebar) return;

    const groups = modebar.querySelectorAll(".modebar-group");
    if (groups.length === 0) return;

    const downloadGroup = groups[0]; // 最初のグループ（通常PNGダウンロードなど）

    // ダウンロードボタンのアイコンを変更
    const downloadBtn = downloadGroup.querySelector(".modebar-btn");
    if (downloadBtn) {
        const svg = downloadBtn.querySelector("svg");
        if (svg) {
            // Material Design "Download" icon
            svg.setAttribute("viewBox", "0 0 24 24");
            const path = svg.querySelector("path");
            if (path) {
                path.setAttribute("d", "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z");
                path.removeAttribute("transform");
            }
        }
    }

    // CSVダウンロードボタン: 画像保存ボタンの横に追加（Plotlyがモードバーを再構築するため毎回作り直す）
    const existingCsvBtn = modebar.querySelector(".modebar-btn--csv");
    if (existingCsvBtn) {
        existingCsvBtn.remove();
    }

    const csvBtn = document.createElement("button");
    csvBtn.type = "button";
    csvBtn.setAttribute("rel", "tooltip");
    csvBtn.className = "modebar-btn modebar-btn--csv";
    csvBtn.setAttribute("data-title", "Download data as csv");
    csvBtn.setAttribute("aria-label", "データをCSV形式でダウンロード");

    const csvSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    csvSvg.setAttribute("viewBox", `0 0 ${csvDownloadIcon.width} ${csvDownloadIcon.height}`);
    csvSvg.setAttribute("height", "1em");
    csvSvg.setAttribute("width", "1em");
    csvSvg.style.fill = "currentColor";

    const csvPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    csvPath.setAttribute("d", csvDownloadIcon.path);
    csvSvg.appendChild(csvPath);
    csvBtn.appendChild(csvSvg);

    csvBtn.addEventListener("click", () => {
        downloadCsv(plotDiv);
    });

    if (downloadBtn) {
        downloadBtn.after(csvBtn);
    } else {
        downloadGroup.appendChild(csvBtn);
    }

    // 最初のグループ（画像保存 + CSV）以外のボタン群は使わないため非表示にする
    Array.from(groups)
        .slice(1)
        .forEach((group) => {
            group.classList.add("modebar-group--hidden");
        });

    attachModebarTooltips(modebar);
}
