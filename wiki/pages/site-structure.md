# サイト構成ガイド

このリポジトリは、静的なポートフォリオ + 複数Webツールで構成されています。

## ルート構成

- `index.html`: トップページ
- `assets/`: 共通CSSと画像
- `js/`: トップページとツール共通JS
- `tools/`: 各ツールのHTML
- `games/`, `game.html`: ゲーム関連
- `wiki/`: このWiki

## 重要ファイル

### `js/data.js`

トップに表示するデータを集約しています。

- `PROFILE_DATA`
- `TOOLS_DATA`
- `links`

### `js/script.js`

トップページの描画ロジック。

- プロフィール表示
- Links描画
- Tools描画（検索・タグフィルタ）
- チャットUI

### `assets/css/style.css`

共通テーマ。現在は `editorial-mono` を中心に運用しています。

## ツール追加時の最小手順

1. `tools/your-tool.html` を追加
2. `js/tools/your-tool.js` を追加
3. `js/data.js` の `TOOLS_DATA` に1件追加

```js
{
  name: "Your Tool",
  description: "説明",
  url: "tools/your-tool.html",
  categories: ["汎用"],
  icon: "<svg ...></svg>"
}
```
