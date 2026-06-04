# quelmap-plotly

Plotly.js のカスタムラッパーコンポーネント。モードバーのカスタマイズやホバーツールチップのスタイリングが含まれています。

## インストール

```bash
npm install git+https://github.com/quelmap-dev/qeulmap_plotly_component.git
```

## 使い方（React）

```tsx
import { QuelmapPlot } from "quelmap-plotly";
import "quelmap-plotly/style.css";

function App() {
  return (
    <QuelmapPlot
      data={[
        {
          x: [1, 2, 3],
          y: [2, 6, 3],
          type: "scatter",
          mode: "lines+markers",
        },
      ]}
      layout={{ title: "Sample Chart" }}
    />
  );
}
```

## Props（React）

`QuelmapPlot` は `react-plotly.js` の `Plot` コンポーネントと同じ Props を受け取ります。

詳しくは [react-plotly.js](https://github.com/plotly/react-plotly.js#basic-props) を参照してください。

## Peer Dependencies

使用するプロジェクト側で以下のパッケージをインストールしてください。

```bash
npm install react react-dom plotly.js react-plotly.js
```

## 使い方（Vanilla JS / CDN）

React を使わず、素の HTML からも利用できます。

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/quelmap-plotly/dist/index.css"
/>
<div id="plot" style="width: 100%; height: 420px"></div>

<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script src="https://unpkg.com/quelmap-plotly/dist/quelmap-plotly.cdn.js"></script>
<script>
  let chart;

  (async () => {
    chart = await QuelmapPlotly.createQuelmapPlot("#plot", {
      data: [
        {
          x: [1, 2, 3],
          y: [2, 6, 3],
          type: "scatter",
          mode: "lines+markers",
        },
      ],
      layout: { title: "CDN Sample" },
    });
  })();

  // 更新
  // chart.update({ data: [...], layout: {...}, config: {...} });

  // 破棄
  // chart.destroy();
</script>
```

## 開発

```bash
# デモアプリの起動
npm run dev

# ライブラリビルド（ESM + CDN IIFE）
npm run build:lib
```
