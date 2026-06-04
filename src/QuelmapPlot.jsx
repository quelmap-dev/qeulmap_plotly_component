import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import "./quelmap-plotly.css";
import { createPlotlyDomController, mergeQuelmapLayout } from "./plotly-customization";

/**
 * Plotlyのカスタマイズ済みラッパーコンポーネント
 * 標準のPlotコンポーネントと同じPropsを受け取ります。
 */
export default function QuelmapPlot({ layout = {}, config = {}, data, onInitialized, onUpdate, ...props }) {
    const [plotKey, setPlotKey] = useState(0);

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const domController = useMemo(
        () => createPlotlyDomController({ onResetView: () => setPlotKey((prev) => prev + 1) }),
        [],
    );

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

    useEffect(() => {
        return () => domController.cleanup();
    }, [domController]);

    // カスタムスタイルに必要なデフォルト設定
    const mergedLayout = useMemo(
        () => mergeQuelmapLayout(layout, containerSize.height),
        [layout, containerSize.height],
    );

    const internalConfig = useMemo(
        () => domController.getInternalConfig(config),
        [config, domController],
    );

    const handleInitialized = useCallback(
        (figure, plotDiv) => {
            domController.handleInitialized(figure, plotDiv, onInitialized);
        },
        [domController, onInitialized],
    );

    const handleUpdate = useCallback(
        (figure, plotDiv) => {
            domController.handleUpdate(figure, plotDiv, onUpdate);
        },
        [domController, onUpdate],
    );

    return (
        <div
            ref={containerRef}
            style={{ minHeight: 400, position: "relative" }}
        >
            {ready &&
                <Plot
                    key={plotKey}
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