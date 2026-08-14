import { useRef, useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import "./quelmap-plotly.css";
import { buildLayout, buildConfig } from "./core/options.js";
import { customizeModebar } from "./core/modebar.js";
import { setupTooltip } from "./core/tooltip.js";

/**
 * Plotlyのカスタマイズ済みラッパーコンポーネント
 * 標準のPlotコンポーネントと同じPropsを受け取ります。
 *
 * 共通のカスタマイズ処理（モードバー / ツールチップ / layout・config の既定値）は
 * src/core 以下に切り出しており、素のJS版（src/standalone.js）と共有しています。
 */
export default function QuelmapPlot({ layout = {}, config = {}, data, onInitialized, onUpdate, ...props }) {
    const tooltipRef = useRef(null);

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                setContainerSize({ width, height });
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const ready = containerSize.width > 0 && containerSize.height > 0;

    // コンポーネントのアンマウント時にツールチップのObserver等を切断する
    useEffect(() => {
        return () => {
            if (tooltipRef.current) {
                tooltipRef.current.disconnect();
            }
        };
    }, []);

    // カスタムスタイルに必要なデフォルト設定
    const mergedLayout = useMemo(
        () => buildLayout(layout, containerSize.height),
        [layout, containerSize.height]
    );

    const internalConfig = useMemo(() => buildConfig(config), [config]);

    const handleInitialized = (figure, plotDiv) => {
        // 1. モードバーのカスタマイズ
        customizeModebar(plotDiv);

        // 2. カスタムツールチップの作成（前回分があれば切断してから作り直す）
        if (tooltipRef.current) {
            tooltipRef.current.disconnect();
        }
        tooltipRef.current = setupTooltip(plotDiv);

        if (onInitialized) {
            onInitialized(figure, plotDiv);
        }
    };

    const handleUpdate = (figure, plotDiv) => {
        customizeModebar(plotDiv);
        if (onUpdate) {
            onUpdate(figure, plotDiv);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{ minHeight: 400, position: "relative" }}
        >
            {ready &&
                <Plot
                    data={data}
                    layout={mergedLayout}
                    config={internalConfig}
                    className="quelmap-plot-wrapper"
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                    onInitialized={handleInitialized}
                    onUpdate={handleUpdate}
                    {...props}
                />
            }
        </div>
    );
}
