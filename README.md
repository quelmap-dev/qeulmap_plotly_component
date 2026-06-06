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

React を使わず、CDN から読み込んだ Plotly.js（`window.Plotly`）を使えます。使い方は2通りあります。

- **A) 自動適用（ドロップイン・推奨）** … 既存ページに `<link>` / `<script>` を足すだけ。`Plotly.newPlot(...)` の呼び出しはそのままでカスタマイズが乗ります。
- **B) 明示 API** … `QuelmapPlot.newPlot(...)` を呼ぶ。React 版 `<QuelmapPlot />` と同じ既定値（背景・高さ等）まで適用したい場合向け。

このリポジトリは **npm 未公開のまま、jsDelivr の GitHub 直配信**で利用できます（UMD バンドル `dist/quelmap-plotly.umd.js` をリポジトリにコミット済み）。

### A) 既存の Plotly ページに足すだけ（自動適用・推奨）

すでに Plotly.js を使っているページなら、**CSS と JS の2タグを追加するだけ**。読み込み時に `window.Plotly.newPlot` / `Plotly.react` を自動的にラップし、ツールバー（モードバー）とホバー（ツールチップ）のカスタマイズを適用します。**既存の `Plotly.newPlot(...)` 呼び出しを書き換える必要はありません。**

```html
<!-- 既存ページ: Plotly.js 本体（そのまま） -->
<script src="https://cdn.plot.ly/plotly-3.0.1.min.js" charset="utf-8"></script>

<!-- これを足すだけ（@main はタグ名や commit に変更可） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/quelmap-dev/qeulmap_plotly_component@main/dist/quelmap-plotly.css">
<script src="https://cdn.jsdelivr.net/gh/quelmap-dev/qeulmap_plotly_component@main/dist/quelmap-plotly.umd.js"></script>

<div id="myDiv" style="width:600px;height:400px;"></div>
<script>
  // 素の Plotly のまま。自動的に quelmap のカスタマイズが乗る
  Plotly.newPlot('myDiv', [
    { x: ['A', 'B', 'C'], y: [90, 40, 60], type: 'bar' }
  ], { title: { text: 'Sample' } });
</script>
```

- 自動適用では、**既存チャートの見た目・サイズ・操作（背景 / 高さ / dragmode など）は変更せず**、ツールバーとホバーだけを差し替えます（プロジェクトが本来変えている「ツールメニュー」と「ホバー」の挙動のみ）。
- 「ビューのリセット」ボタンの追加・Plotly ロゴ非表示・コンテナのリサイズ追従も併せて有効になります。
- スクリプト読込より**前にすでに描画済み**のグラフがあっても、自動で拾って後付け適用します。個別に適用したい場合は `QuelmapPlot.enhance(el)` を呼べます。
- 自動適用を**止めたい**場合は、スクリプト読込より前に `window.__QUELMAP_DISABLE_AUTOPATCH__ = true;` を宣言するか、後から `QuelmapPlot.uninstall()` を呼びます（再開は `QuelmapPlot.install()`）。
- 動くサンプル: [`examples/cdn-auto.html`](examples/cdn-auto.html)

### B) 明示 API（`QuelmapPlot.*` / React 不要）

`Plotly.js とほぼ同じ命令的 API` で、React 版 `<QuelmapPlot />` と同じ既定 layout（透明背景・高さフォールバック等）まで適用します。コンテナ内に内部 div を作って描画します。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/quelmap-dev/qeulmap_plotly_component@main/dist/quelmap-plotly.css">
<script src="https://cdn.jsdelivr.net/gh/quelmap-dev/qeulmap_plotly_component@main/dist/quelmap-plotly.umd.js"></script>

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
| `QuelmapPlot.install()` | — | 自動適用（`window.Plotly` のラップ）を有効化（既定で自動実行） |
| `QuelmapPlot.uninstall()` | — | 自動適用を解除し、ネイティブの `Plotly.newPlot` / `react` に戻す |
| `QuelmapPlot.enhance(el)` | — | すでに描画済みの `.js-plotly-plot` を後付けでカスタマイズ（再描画なし） |

- 明示 API では高さはコンテナ要素のサイズに追従します（未指定時は 400px）。
- ダークモードは `.dark` の子孫に置くだけで有効になります。
- 命令的 API のサンプルは [`examples/cdn.html`](examples/cdn.html) を参照してください。

### 配信 URL（ref）の指定

jsDelivr の `@` 以降には branch / タグ / commit を指定できます。

| 用途 | URL の `@` 部分 | 例 |
| --- | --- | --- |
| 本番（推奨・キャッシュ恒久） | タグ | `@v0.1.0` |
| デフォルトブランチの最新 | ブランチ | `@main` |
| 特定時点に固定 | commit ハッシュ | `@<commit-sha>` |

- **本番ではタグ（または commit）への固定を推奨**します。`@main` などのブランチ指定は jsDelivr のキャッシュが最大 12 時間効くため、更新が即時反映されません。
- `claude/...` のように **スラッシュを含むブランチ名は jsDelivr の `@gh` で正しく解釈されません**。その場合は commit ハッシュ（`@<sha>/dist/...`）を使うか、スラッシュを含まないブランチ／タグを使ってください。
- タグの作成例: `git tag v0.1.0 && git push origin v0.1.0`

### 成果物の更新フロー（重要）

GitHub 直配信では `dist/quelmap-plotly.umd.js` / `dist/quelmap-plotly.css` を**リポジトリにコミットして配信**します。`src/` を変更したら、再ビルドしてコミットしてください（この 2 ファイルのみ追跡対象、他の `dist/` は `.gitignore` 対象です）。

```bash
npm run build:standalone   # dist/quelmap-plotly.{umd.js,css} を再生成
git add dist/quelmap-plotly.umd.js dist/quelmap-plotly.css
git commit -m "rebuild CDN bundle"
```

> npm に公開する場合は、`unpkg` / `jsdelivr` フィールドにより `https://cdn.jsdelivr.net/npm/quelmap-plotly/dist/quelmap-plotly.umd.js` でも配信できます（`prepare` が `dist` を自動生成します）。

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
