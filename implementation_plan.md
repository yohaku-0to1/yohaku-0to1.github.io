# Implementation Plan - Star Rush (Pixel Art & Logic Fix)

ユーザーからのフィードバック（ゲームオーバー挙動の誤解、画像の透過不全）に対応し、さらにクオリティを高めます。

## Goal Description
- **Fix Game Over Logic**: ゲームオーバー直後にクリックすると即座にリスタートしてしまう問題を修正（クールダウンを追加）。
- **Pixel Art Character**: 画像ファイルを使用せず、コード内で定義した「ドット絵データ」を使用してキャラクターを描画。これにより透過の問題を完全に解決し、レトロで高品質な雰囲気を出す。
- **Animation**: ドット絵のコマ送りアニメーション（走り、ジャンプ、ダッシュ）を実装。

## User Review Required
> [!NOTE]
> キャラクターはコードベースのドット絵（ピクセルアート）になります。元のデザイン（水色髪、ピンクパーカー）を再現しますが、解像度は荒くなります（それが味になります）。

## Proposed Changes

### Game Logic Fixes
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- **Restart Cooldown**: `gameOver` 状態になってから1秒間はリスタート入力を受け付けないようにする。
- **Collision Logic**: 衝突時の判定を再確認し、意図しない挙動がないかチェック。

### Visual Overhaul (Pixel Art)
#### [MODIFY] [js/game.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/game.js)
- **PixelSprite System**: 
    - 0と1（またはカラーコード）の2次元配列でキャラクターの絵を定義。
    - `drawPixelSprite` 関数を作成し、Canvasに拡大描画。
- **Animations**:
    - `RUN_FRAMES`: 走りの2〜4コマ。
    - `JUMP_FRAME`: ジャンプ中のポーズ。
    - `DASH_FRAME`: ダッシュ中のポーズ。

## Verification Plan

### Manual Verification
- [ ] **ゲームオーバー挙動**: 障害物に当たった際、すぐにクリックしてもリスタートせず、一瞬「GAME OVER」画面が見えるか。
- [ ] **キャラクター表示**: ドット絵としてきれいに描画されているか。背景が完全に透明か。
- [ ] **アニメーション**: 走っている時に足が動いているか。
