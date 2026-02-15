import { useRef, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import "./quelmap-plotly.css";

/**
 * Plotlyのカスタマイズ済みラッパーコンポーネント
 * 標準のPlotコンポーネントと同じPropsを受け取ります。
 */
export default function QuelmapPlot({ layout = {}, config = {}, onInitialized, onUpdate, ...props }) {
    const observerRef = useRef(null);
    const isExpandedRef = useRef(false);
    const [plotKey, setPlotKey] = useState(0);

    // コンポーネントのアンマウント時にObserverを切断する
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // カスタムスタイルに必要なデフォルト設定
    const internalLayout = {
        modebar: {
            bgcolor: "transparent",
            color: "#999",
            activecolor: "#555",
        },
        paper_bgcolor: 'rgba(255,255,255, 0)',
        ...layout, // ユーザー定義が優先（あるいはマージ）
    };

    const refreshIcon = {
        'width': 24,
        'height': 24,
        'path': 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'
    };

    const getTranslate =(el) => {
  const style = getComputedStyle(el);
  const matrix = new DOMMatrix(style.transform);

  return {
    x: matrix.m41,
    y: matrix.m42,
    z: matrix.m43
  };
}

    const internalConfig = {
        displaylogo: false,
        responsive: true,
        ...config,
        modeBarButtonsToAdd: [
            ...(config.modeBarButtonsToAdd || []),
            {
                name: 'component_reload',
                title: 'Reset View',
                icon: refreshIcon,
                click: () => setPlotKey(prev => prev + 1)
            }
        ]
    };

    // ---------------------------------------------------------
    // モードバーのカスタマイズ（関数として抽出）
    // PlotlyがDOM再構築する場合にも再適用できるようにする
    // ---------------------------------------------------------
    const customizeModebar = (plotDiv) => {
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
            if (isExpandedRef.current) {
                group.classList.remove("modebar-group--hidden");
                group.classList.add("modebar-group--expanded");
            } else {
                group.classList.add("modebar-group--hidden");
                group.classList.remove("modebar-group--expanded");
            }
        });

        // 既に詳細ボタンが追加されていないかチェック（Re-render対策）
        if (!modebar.querySelector(".modebar-btn--details")) {
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
            const morePath =
                "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z";
            const closePath =
                "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";

            iconPath.setAttribute("d", isExpandedRef.current ? closePath : morePath);
            detailsBtn.classList.toggle("active", isExpandedRef.current);
            iconSvg.appendChild(iconPath);
            detailsBtn.appendChild(iconSvg);

            detailsBtn.addEventListener("click", () => {
                isExpandedRef.current = !isExpandedRef.current;
                detailsBtn.classList.toggle("active", isExpandedRef.current);
                iconPath.setAttribute("d", isExpandedRef.current ? closePath : morePath);

                let delay = 0;
                otherGroups.forEach((group) => {
                    group.classList.toggle("modebar-group--hidden", !isExpandedRef.current);
                    group.classList.toggle("modebar-group--expanded", isExpandedRef.current);

                    group.querySelectorAll("button").forEach((btn) => {
                        if (isExpandedRef.current) {
                            btn.style.animationDelay = `${delay}ms`;
                            delay += 60;
                        } else {
                            btn.style.animationDelay = "";
                        }
                    });
                });
            });

            detailsGroup.appendChild(detailsBtn);
            // ダウンロードグループの後ろに挿入
            downloadGroup.after(detailsGroup);
        }
    };

    const handleInitialized = (figure, plotDiv) => {
        let vanishTimeout = null;

        const plotlyContainer = plotDiv.querySelector(".plot-container.plotly .modebar-container");

        // 1. モードバーのカスタマイズ
        isExpandedRef.current = false;
        customizeModebar(plotDiv);

        // ---------------------------------------------------------
        // 2. カスタムツールチップの作成
        // ---------------------------------------------------------
        
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

            // マウス位置からのオフセット（-5px ~ 5px の範囲で動く）
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
        
        let hoverlayer = hoverlayer_3d || hoverlayer_2d;
        const is3D = !!hoverlayer_3d;

        if (hoverlayer) {
            // 前回のObserverがあれば切断
            if (observerRef.current) observerRef.current.disconnect();

            const observer = new MutationObserver((mutations) => {
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
                                // color = textEl
                                //     ? window.getComputedStyle(textEl).fill
                                //     : null;
                            });

                            if (coords) {
                                baseCoords = coords;
                                // まだ0,0にいるなら、duaration 0で一旦移動させる
                                if (getTranslate(tooltip).x === 0 && getTranslate(tooltip).y === 0) {
                                    tooltip.style.transition = "none";
                                    tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
                                    // 次のフレームで通常のトランジションに戻す
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
                                // tooltip.style.color = color || "inherit";
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
            observerRef.current = observer;
        }

        // ユーザーが提供した onInitialized があれば実行
        if (onInitialized) {
            onInitialized(figure, plotDiv);
        }
    };

    // Plotlyが内部的にPlotly.react()でDOMを再構築した場合にモードバーを再カスタマイズ
    const handleUpdate = (figure, plotDiv) => {
        customizeModebar(plotDiv);
        if (onUpdate) {
            onUpdate(figure, plotDiv);
        }
    };

    const forcedLayout = {
    dragmode: "orbit",
    transition: {
        duration: 500,
    },
    };

    return (
            <Plot
                key={plotKey}
                layout={{ ...internalLayout, ...forcedLayout }}
                config={internalConfig}
                className="quelmap-plot-wrapper"
                onInitialized={handleInitialized}
                onUpdate={handleUpdate}
                {...props}
            />
    );
}
