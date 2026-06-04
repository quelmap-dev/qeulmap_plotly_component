// モードバーのカスタマイズ（React版・vanilla版で共有）
// Plotly が DOM を再構築しても再適用できるよう、plotDiv を受け取る純粋な DOM 操作として実装する。

const morePath =
    "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z";
const closePath =
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";

/**
 * モードバーをカスタマイズする。
 *  - ダウンロードボタンのアイコンを差し替え
 *  - 詳細メニュー（…）ボタンを追加し、他ボタン群の開閉を制御
 *
 * @param {HTMLElement} plotDiv Plotly のグラフ div（.js-plotly-plot 要素）
 * @param {{ isExpanded: boolean }} state 開閉状態を保持する可変オブジェクト
 */
export function customizeModebar(plotDiv, state) {
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

    // 詳細ボタンのグループを除外してotherGroupsを取得
    const otherGroups = Array.from(groups).slice(1).filter(
        (g) => !g.querySelector(".modebar-btn--details")
    );

    // 現在の展開状態を適用
    otherGroups.forEach((group) => {
        if (state.isExpanded) {
            group.classList.remove("modebar-group--hidden");
            group.classList.add("modebar-group--expanded");
        } else {
            group.classList.add("modebar-group--hidden");
            group.classList.remove("modebar-group--expanded");
        }
    });

    // 詳細ボタン: 毎回再作成する（Plotlyがモードバーを再構築するため）
    const existingDetailsGroup = modebar.querySelector(".modebar-btn--details")?.closest(".modebar-group");
    if (existingDetailsGroup) {
        existingDetailsGroup.remove();
    }

    const detailsGroup = document.createElement("div");
    detailsGroup.className = "modebar-group";
    detailsGroup.style.padding = "0";
    detailsGroup.style.backgroundColor = "transparent";

    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.className = "modebar-btn modebar-btn--details";
    detailsBtn.setAttribute("aria-label", "詳細メニューを表示");

    // アイコンSVG作成 (Material Design Icons: more_horiz / close)
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("height", "1em");
    iconSvg.setAttribute("width", "1em");
    iconSvg.style.fill = "currentColor";

    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    iconPath.setAttribute("d", state.isExpanded ? closePath : morePath);
    detailsBtn.classList.toggle("active", state.isExpanded);
    iconSvg.appendChild(iconPath);
    detailsBtn.appendChild(iconSvg);

    detailsBtn.addEventListener("click", () => {
        state.isExpanded = !state.isExpanded;
        detailsBtn.classList.toggle("active", state.isExpanded);
        iconPath.setAttribute("d", state.isExpanded ? closePath : morePath);

        let delay = 0;
        otherGroups.forEach((group) => {
            group.classList.toggle("modebar-group--hidden", !state.isExpanded);
            group.classList.toggle("modebar-group--expanded", state.isExpanded);

            group.querySelectorAll("button").forEach((btn) => {
                if (state.isExpanded) {
                    btn.style.animationDelay = `${delay}ms`;
                    delay += 60;
                } else {
                    btn.style.animationDelay = "";
                }
            });
        });
    });

    detailsGroup.appendChild(detailsBtn);
    downloadGroup.after(detailsGroup);
}
