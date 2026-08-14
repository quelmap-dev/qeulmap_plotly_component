// モードバーボタンのホバーツールチップ（React版・vanilla版で共有）
// Plotly 標準のツールチップは CSS 疑似要素（::before / ::after）でボタンからの
// 相対配置のため、祖先要素の overflow: hidden で切れてしまう。
// 代わりに document.body 直下へ position: fixed で描画し、クリッピングの影響を受けないようにする。
// （疑似要素側は quelmap-plotly.css で非表示にしている）

const TOOLTIP_CLASS = "quelmap-modebar-tooltip";

function removeAllTooltips() {
    document.querySelectorAll(`.${TOOLTIP_CLASS}`).forEach((el) => el.remove());
}

/**
 * モードバーにホバーツールチップを取り付ける。
 * data-title 属性を持つボタンが対象。多重バインドは dataset フラグで防止する
 * （Plotly がモードバーを再構築した場合は新しい要素に改めてバインドされる）。
 *
 * @param {HTMLElement} modebar モードバー要素（.modebar）
 */
export function attachModebarTooltips(modebar) {
    if (modebar.dataset.quelmapTooltipBound) return;
    modebar.dataset.quelmapTooltipBound = "true";

    // 旧モードバーが残したツールチップがあれば掃除する
    removeAllTooltips();

    let currentBtn = null;

    const hide = () => {
        currentBtn = null;
        removeAllTooltips();
    };

    const show = (btn) => {
        const title = btn.getAttribute("data-title");
        if (!title) return;

        removeAllTooltips();
        currentBtn = btn;

        const tooltip = document.createElement("div");
        tooltip.className = TOOLTIP_CLASS;
        tooltip.textContent = title;

        // ダークモードのスコープ（.dark）がグラフ側にのみ付いている場合でも
        // body 直下のツールチップに配色が届くよう、クラスを引き継ぐ
        if (btn.closest(".dark")) {
            tooltip.classList.add("dark");
        }

        // ボタンの真上・中央（transform で -50% / -100% 補正）
        const rect = btn.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 6}px`;
        document.body.appendChild(tooltip);

        // 画面右端のボタンなどで見切れないよう、中央位置をビューポート内にクランプする
        const margin = 8;
        const half = tooltip.offsetWidth / 2;
        const centerX = Math.min(
            Math.max(rect.left + rect.width / 2, margin + half),
            window.innerWidth - margin - half
        );
        tooltip.style.left = `${centerX}px`;
    };

    modebar.addEventListener("mouseover", (e) => {
        const btn = e.target instanceof Element ? e.target.closest(".modebar-btn[data-title]") : null;
        if (!btn || btn === currentBtn) return;
        show(btn);
    });

    modebar.addEventListener("mouseout", (e) => {
        if (!currentBtn) return;
        // ボタン内の子要素間の移動では消さない
        if (e.relatedTarget instanceof Element && currentBtn.contains(e.relatedTarget)) return;
        hide();
    });

    // クリック時（ダウンロード開始など）はすぐ消す
    modebar.addEventListener("click", hide);
}
