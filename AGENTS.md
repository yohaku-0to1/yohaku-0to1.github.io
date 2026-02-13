# AGENTS.md

## このプロジェクトの目的
- `yohaku-0to1.github.io` はポートフォリオ兼ツールハブの静的サイトです。
- メインは `index.html`、各機能は `tools/` 配下の独立ページで提供します。

## 主要構成
- `index.html`: トップページ本体。
- `js/data.js`: プロフィール、リンク、ツール一覧などの可変データ。
- `js/script.js`: トップページの表示ロジック（YouTube埋め込み、チャットUIなど）。
- `assets/css/style.css`: 共通スタイル。
- `tools/*.html` + `js/tools/*.js`: 各WebツールのUI/ロジック。
- `game.html`, `js/game.js`, `games/`: ゲーム関連（通常は触らない）。

## 作業ルール
- 基本は**ゲーム以外**を優先して対応する。ゲーム改修は明示依頼がある場合のみ。
- 変更しやすい内容は `js/data.js` に集約し、HTMLへ直書きを増やさない。
- 既存方針どおり Vanilla JS + HTML + CSS を維持し、重い依存追加は避ける。
- 外部リンクには `target="_blank"` を使う場合、`rel="noopener noreferrer"` を付与する。
- 既存デザイン/文言トーン（日本語中心、NEONキャラ）を大きく崩さない。

## 実装時チェック
- 編集したJSは `node --check <file>` で構文確認する。
- UI変更時は最低限、トップページと該当ツールページの表示崩れを確認する。
- `localStorage` / `JSON.parse` は壊れたデータを考慮して例外耐性を持たせる。

## ローカル実行メモ
- 通常確認は任意の静的サーバでOK。
- `tools/audio-splitter.html` はCOOP/COEPが必要なため、次で起動する:
  - `python3 tools/local_server.py --port 8000 --dir .`
  - `http://localhost:8000/tools/audio-splitter.html`

## デプロイ方針
- GitHub Pages運用（`main` 反映）。
- `push` はユーザー合意を取ってから実施する。
