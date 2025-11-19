# Implementation Plan - Star Glitcher 3D: True Identity & Rhythm

ユーザーの「キャラが違う」「スペースキーのバグ」「つまらない」というフィードバックに対し、根本的な修正とエンターテイメント性の向上を行います。

## Goal Description
1.  **Character Restoration**: 元の画像ファイル (`assets/images/character_sheet.png`) を使用し、Canvas処理で背景を透明化した上で、Three.jsのテクスチャとして適用します。これで「本物」のキャラが3D空間を走ります。
2.  **Input Fix**: スタートボタン等のフォーカスを解除（`.blur()`）し、スペースキーでの意図しないリスタートを防ぎます。
3.  **Game Feel (Juice)**:
    *   **Procedural Audio**: Web Audio APIを使用し、BGMと効果音（ジャンプ、コイン、爆発）を自動生成します。音があるだけで面白さは倍増します。
    *   **Phase System**: スコアに応じて世界の色（パレット）と障害物のパターンが変化する「フェーズ」制を導入し、飽きさせない展開を作ります。

## User Review Required
> [!NOTE]
> ブラウザの仕様上、音声を再生するには一度画面をクリックする必要があります（スタートボタンで解決）。

## Proposed Changes

### Character Rendering
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- `createCharacterTexture` を廃止し、`assets/images/character_sheet.png` を読み込んでクロマキー処理（背景透過）を行う `loadProcessedTexture` 関数を実装。

### Input Handling
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- ボタンクリック時に `this.blur()` を呼び出す。
- `keydown` イベントで `e.target.tagName` をチェックし、ボタンへの入力を無視する。

### Audio System
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- `class AudioSynth`: オシレーターを使ったシンセサイザー。
    - `playBGM()`: ベースラインとメロディをループ再生。
    - `playSFX(type)`: ジャンプ（矩形波）、爆発（ノイズ）、アイテム（サイン波）の音を生成。

### Gameplay Loop
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- **Phase System**:
    - Phase 1: Neon Pink (Normal)
    - Phase 2: Cyber Gold (Fast)
    - Phase 3: Glitch Red (Hard)
- **Obstacle Patterns**: 単純なランダムではなく、リズムに合わせた配置（BGMのビートと同期）。

## Verification Plan
- [ ] **キャラ表示**: 元の画像が背景透明で表示されているか。
- [ ] **操作**: スペースキーを連打してもリスタートしないか。
- [ ] **音**: BGMとSEが鳴るか。
- [ ] **面白さ**: 色の変化や音の同期で「ノれる」ゲームになっているか。
