// カスタムツールチップ（React版・vanilla版で共有）
// Plotly の hoverlayer を MutationObserver で監視し、独自スタイルのツールチップを描画する。

const getTranslate = (el) => {
    const style = getComputedStyle(el);
    const matrix = new DOMMatrix(style.transform);

    return {
        x: matrix.m41,
        y: matrix.m42,
        z: matrix.m43,
    };
};

/**
 * カスタムツールチップをセットアップする。
 *
 * @param {HTMLElement} plotDiv Plotly のグラフ div（.js-plotly-plot 要素）
 * @returns {{ disconnect: () => void }} クリーンアップ用ハンドル
 */
export function setupTooltip(plotDiv) {
    let vanishTimeout = null;

    const plotlyContainer = plotDiv.querySelector(".plot-container.plotly .modebar-container");

    // 既存のツールチップがあれば削除（再初期化時など）
    const oldTooltip = plotDiv.querySelector(".custom-tooltip");
    if (oldTooltip) {
        oldTooltip.remove();
    }

    const tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip";

    // ベース座標とマウスオフセットを保持
    let baseCoords = { x: 0, y: 0 };
    let isVisible = false;

    // マウス移動でツールチップを微妙に動かす
    const handleMouseMove = (e) => {
        if (!isVisible) return;
        const rect = plotDiv.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const offsetX = (mouseX - baseCoords.x) * 0.2;
        const offsetY = (mouseY - baseCoords.y) * 0.2;

        tooltip.style.transform = `translate(${baseCoords.x + offsetX}px, ${baseCoords.y + offsetY}px)`;
    };

    plotDiv.addEventListener("mousemove", handleMouseMove);

    // コンテナに追加
    const hoverlayer_2d = plotDiv.querySelector("g.hoverlayer");
    if (hoverlayer_2d && plotlyContainer) {
        plotlyContainer.appendChild(tooltip);
    }

    const hoverlayer_3d = plotDiv.querySelector(".gl-container #scene svg");
    if (hoverlayer_3d) {
        const scene = plotDiv.querySelector(".gl-container #scene");
        if (scene) scene.appendChild(tooltip);
    }

    const hoverlayer = hoverlayer_3d || hoverlayer_2d;
    const is3D = !!hoverlayer_3d;

    let observer = null;

    if (hoverlayer) {
        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // ノード追加（ホバー表示）
                Array.from(mutation.addedNodes).forEach((node) => {
                    if (
                        node.nodeType === Node.ELEMENT_NODE &&
                        node.classList.contains("hovertext")
                    ) {
                        if (vanishTimeout) clearTimeout(vanishTimeout);

                        const transform = node.getAttribute("transform");
                        const match = transform?.match(
                            /translate\(([\d.-]+),([\d.-]+)\)/
                        );
                        const coords = match
                            ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
                            : null;
                        const pathEl = node.querySelector("path");
                        const fill = pathEl
                            ? window.getComputedStyle(pathEl).fill
                            : null;
                        const textEls = node.querySelectorAll("text");
                        let text = "";
                        let fontSize = null;

                        textEls.forEach((textEl) => {
                            const tspans = textEl.childNodes;
                            if (tspans.length === 0) {
                                text += textEl.textContent + "<br>";
                            } else {
                                tspans.forEach((tspan) => {
                                    text += tspan.textContent + "<br>";
                                });
                            }
                            fontSize = textEl
                                ? parseFloat(window.getComputedStyle(textEl).fontSize)
                                : null;
                        });

                        if (coords) {
                            baseCoords = coords;
                            if (getTranslate(tooltip).x === 0 && getTranslate(tooltip).y === 0) {
                                tooltip.style.transition = "none";
                                tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
                                requestAnimationFrame(() => {
                                    tooltip.style.transition = "";
                                });
                            }

                            if (is3D) {
                                tooltip.style.transform = `translate(calc(${coords.x}px + 50px), calc(${coords.y}px + 15px - 50%)`;
                            } else {
                                tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
                            }
                            tooltip.style.fontSize = fontSize
                                ? `${fontSize}px`
                                : "inherit";
                            tooltip.innerHTML = text || "";
                            const gradient = `
                                linear-gradient(
                                to bottom,
                                rgba(0,0,0,0) 0%,
                                rgba(0,0,0,0.15) 100%
                                ),
                                ${fill}
                            `;
                            tooltip.style.setProperty("--tooltip-accent", gradient);
                            tooltip.style.opacity = "1";

                            if (!is3D) {
                                isVisible = true;
                            }
                        }
                    }
                });

                // ノード削除（ホバー非表示）
                Array.from(mutation.removedNodes).forEach((node) => {
                    if (
                        node.nodeType === Node.ELEMENT_NODE &&
                        node.classList.contains("hovertext")
                    ) {
                        if (hoverlayer.querySelectorAll(".hovertext").length === 0) {
                            vanishTimeout = setTimeout(() => {
                                tooltip.style.opacity = "0";
                                isVisible = false;
                            }, 300);
                        }
                    }
                });
            });
        });

        observer.observe(hoverlayer, { childList: true });
    }

    return {
        tooltip,
        disconnect() {
            if (observer) observer.disconnect();
            plotDiv.removeEventListener("mousemove", handleMouseMove);
            if (vanishTimeout) clearTimeout(vanishTimeout);
            tooltip.remove();
        },
    };
}
