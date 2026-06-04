// layout / config のデフォルトをマージするヘルパー（React版・vanilla版で共有）
import { refreshIcon } from "./icons.js";

/**
 * Plotly に渡す layout を生成する。
 * カスタムスタイルに必要なデフォルト（modebar 色 / 透明背景 / autosize / 高さ）を適用する。
 *
 * @param {object} layout         ユーザー指定の layout
 * @param {number} [fallbackHeight] 高さが未指定のときに使うフォールバック（コンテナの実寸など）
 */
export function buildLayout(layout = {}, fallbackHeight) {
    return {
        modebar: {
            bgcolor: "transparent",
            color: "#999",
            activecolor: "#555",
        },
        paper_bgcolor: "rgba(255,255,255, 0)",
        ...layout,
        // autosize を有効にしつつ、明示的に高さを指定して 0 へのフォールバックを防ぐ
        autosize: true,
        height: layout.height || fallbackHeight || 400,
        dragmode: "orbit",
    };
}

/**
 * Plotly に渡す config を生成する。
 * ロゴ非表示・レスポンシブを有効化し、「ビューのリセット」ボタンを追加する。
 *
 * @param {object} config           ユーザー指定の config
 * @param {object} [handlers]
 * @param {Function} [handlers.onReset] リセットボタン押下時に呼ばれるコールバック
 */
export function buildConfig(config = {}, { onReset } = {}) {
    return {
        displaylogo: false,
        responsive: true,
        ...config,
        modeBarButtonsToAdd: [
            ...(config.modeBarButtonsToAdd || []),
            {
                name: "component_reload",
                title: "Reset View",
                icon: refreshIcon,
                click: () => {
                    if (onReset) onReset();
                },
            },
        ],
    };
}
