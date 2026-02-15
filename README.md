# quelmap-plotly

Plotly.js のカスタムラッパーコンポーネント。モードバーのカスタマイズやホバーツールチップのスタイリングが含まれています。

## インストール

```bash
npm install git+https://github.com/quelmap-dev/qeulmap_plotly_component.git
```

## 使い方

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

## Props

`QuelmapPlot` は `react-plotly.js` の `Plot` コンポーネントと同じ Props を受け取ります。

詳しくは [react-plotly.js](https://github.com/plotly/react-plotly.js#basic-props) を参照してください。

## Peer Dependencies

使用するプロジェクト側で以下のパッケージをインストールしてください。

```bash
npm install react react-dom plotly.js react-plotly.js
```

## 開発

```bash
# デモアプリの起動
npm run dev

# ライブラリビルド
npm run build:lib
```
