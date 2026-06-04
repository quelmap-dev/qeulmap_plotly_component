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

## 使い方（素のHTML / CDN・React不要）

React を使わず、CDN から読み込んだ Plotly.js（`window.Plotly`）を使って、**Plotly.js とほぼ同じ命令的 API** で利用できます。

```html
<!-- 1) Plotly.js 本体（本家CDN） -->
<script src="https://cdn.plot.ly/plotly-3.0.1.min.js" charset="utf-8"></script>

<!-- 2) quelmap-plotly（npm 公開後は jsDelivr / unpkg から） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quelmap-plotly/dist/quelmap-plotly.css">
<script src="https://cdn.jsdelivr.net/npm/quelmap-plotly/dist/quelmap-plotly.umd.js"></script>

<div id="myDiv" style="width:600px;height:400px;"></div>
<script>
  // Plotly.newPlot と同じシグネチャ: (div または id, data, layout, config)
  QuelmapPlot.newPlot('myDiv', [
    { x: ['A', 'B', 'C'], y: [90, 40, 60], type: 'bar' }
  ], { title: { text: 'Sample' } });
</script>
```

### 公開する API（`window.QuelmapPlot`）

Plotly.js の同名メソッドに対応しています（第1引数は描画先の要素または id）。

| メソッド | 対応する Plotly | 説明 |
| --- | --- | --- |
| `QuelmapPlot.newPlot(el, data, layout?, config?)` | `Plotly.newPlot` | 新規描画（Promise を返す） |
| `QuelmapPlot.react(el, data, layout?, config?)` | `Plotly.react` | 差分更新（未初期化なら newPlot にフォールバック） |
| `QuelmapPlot.relayout(el, ...)` | `Plotly.relayout` | layout の部分更新 |
| `QuelmapPlot.restyle(el, ...)` | `Plotly.restyle` | trace の部分更新 |
| `QuelmapPlot.update(el, ...)` | `Plotly.update` | layout/trace の同時更新 |
| `QuelmapPlot.purge(el)` | `Plotly.purge` | 破棄（監視・ツールチップも停止） |

- 高さはコンテナ要素のサイズに追従します（未指定時は 400px）。
- ダークモードは `.dark` の子孫に置くだけで有効になります。
- 動くサンプルは [`examples/cdn.html`](examples/cdn.html) を参照してください。

> **CDN について**: `https://cdn.jsdelivr.net/npm/quelmap-plotly/...` は **npm 公開後**に利用できます。npm に公開せず GitHub から直接配信したい場合は、ビルド成果物（`dist/`）をコミットまたは GitHub Release に添付したうえで `https://cdn.jsdelivr.net/gh/quelmap-dev/qeulmap_plotly_component@<tag>/dist/quelmap-plotly.umd.js` を使用してください（`dist/` は既定で `.gitignore` 対象です）。

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

# ライブラリビルド（React 向け ES モジュール）
npm run build:lib

# 素のHTML / CDN 向け UMD ビルド
npm run build:standalone

# 両方まとめてビルド
npm run build:all
```
