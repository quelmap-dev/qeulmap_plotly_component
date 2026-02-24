// src/BarChart.jsx
import { useState } from "react";
import QuelmapPlot from "./QuelmapPlot";
import Plot from "react-plotly.js";

// --- データセットA（デフォルト） ---
var trace1A = {
    x: ['Zebras', 'Lions', 'Pelicans'],
    y: [90, 40, 60],
    type: 'bar',
    name: 'New York Zoo'
};

var trace2A = {
    x: ['Zebras', 'Lions', 'Pelicans'],
    y: [10, 80, 45],
    type: 'bar',
    name: 'San Francisco Zoo'
};

var dataA = [trace1A, trace2A];

// --- データセットB（トグル用） ---
var trace1B = {
    x: ['Zebras', 'Lions', 'Pelicans', 'Elephants', 'Penguins'],
    y: [50, 70, 30, 95, 55],
    type: 'bar',
    name: 'New York Zoo'
};

var trace2B = {
    x: ['Zebras', 'Lions', 'Pelicans', 'Elephants', 'Penguins'],
    y: [65, 20, 85, 40, 75],
    type: 'bar',
    name: 'San Francisco Zoo'
};

var trace3B = {
    x: ['Zebras', 'Lions', 'Pelicans', 'Elephants', 'Penguins'],
    y: [30, 55, 60, 70, 25],
    type: 'bar',
    name: 'Tokyo Zoo'
};

var dataB = [trace1B, trace2B, trace3B];

// --- 3Dデータ ---
var pointCount = 31;
var i, r;

var x = [];
var y = [];
var z = [];
var c = [];

for (i = 0; i < pointCount; i++) {
    r = 10 * Math.cos(i / 10);
    x.push(r * Math.cos(i));
    y.push(r * Math.sin(i));
    z.push(i);
    c.push(i);
}

const layout = {
    title: { text: "フルーツ売上", font: { size: 20 } },
    paper_bgcolor: "#f8f9fa",
    plot_bgcolor: "#f8f9fa",
};

const layoutB = {
    title: { text: "動物園データ（拡張版）", font: { size: 20 } },
    paper_bgcolor: "#eef2ff",
    plot_bgcolor: "#eef2ff",
};

const config = {
    // CustomPlot handles defaults
};


export default function BarChart() {
    const [useAltData, setUseAltData] = useState(false);

    const currentData = useAltData ? dataB : dataA;
    const currentLayout = useAltData ? layoutB : layout;

    return (
        <div>
            {/* --- トグルUI --- */}
            <div style={{
                padding: "12px 16px",
                margin: "16px",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                gap: 12,
            }}>
                <span style={{ fontWeight: 600 }}>データ切替テスト:</span>
                <button
                    onClick={() => setUseAltData(prev => !prev)}
                    style={{
                        padding: "6px 16px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        background: useAltData ? "#4f46e5" : "#f3f4f6",
                        color: useAltData ? "#fff" : "#333",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.2s",
                    }}
                >
                    {useAltData ? "データB (5動物・3園)" : "データA (3動物・2園)"}
                </button>
                <span style={{ fontSize: 13, color: "#888" }}>
                    ← クリックでdata/layoutが動的に変わります
                </span>
            </div>

            <p>元々</p>
            <Plot
                data={currentData}
                layout={currentLayout}
                config={config}
            />
            <p>かっこいい版</p>

            <QuelmapPlot
                data={currentData}
                layout={currentLayout}
                config={config}
            />
            <p>下のコンテンツ</p>
        </div>
    );
}