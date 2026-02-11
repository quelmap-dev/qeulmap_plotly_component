// src/BarChart.jsx
import QuelmapPlot from "./QuelmapPlot";
import Plot from "react-plotly.js";

// const data = [
//     {
//         type: "bar",
//         x: ["りんご", "バナナ", "オレンジ", "ぶどう", "いちご"],
//         y: [24, 18, 30, 12, 36],
//         marker: {
//             color: ["#FF6B6B", "#FFD93D", "#FF9F43", "#A29BFE", "#FF6B81"],
//         },
//     },
// ];
var trace1 = {
    x: ['Zebras', 'Lions', 'Pelicans'],
    y: [90, 40, 60],
    type: 'bar',
    name: 'New York Zoo'
};

var trace2 = {
    x: ['Zebras', 'Lions', 'Pelicans'],
    y: [10, 80, 45],
    type: 'bar',
    name: 'San Francisco Zoo'
};

var data = [trace1, trace2];


var pointCount = 31;
var i, r;

var x = [];
var y = [];
var z = [];
var c = [];

for(i = 0; i < pointCount; i++) 
{
   r = 10 * Math.cos(i / 10);
   x.push(r * Math.cos(i));
   y.push(r * Math.sin(i));
   z.push(i);
   c.push(i)
}


// const data = [{
//   type: 'scatter3d',
//   mode: 'lines+markers',
//   x: x,
//   y: y,
//   z: z,
//   line: {
//     width: 6,
//     color: c,
//     colorscale: "Viridis"},
//   marker: {
//     size: 3.5,
//     color: c,
//     colorscale: "Greens",
//     cmin: -20,
//     cmax: 50
//   }}]



const layout = {
    title: { text: "フルーツ売上", font: { size: 20 } },
    paper_bgcolor: "#f8f9fa",
    plot_bgcolor: "#f8f9fa",
};

const config = {
    // CustomPlot handles defaults
};


export default function BarChart() {
    return (
        <dev>
<p>元々</p>
<Plot
            data={data}
            layout={layout}
            config={config}
        />
        <p>かっこいい版</p>

        <QuelmapPlot
            data={data}
            layout={layout}
            config={config}
        />

    </dev>
    );
}
