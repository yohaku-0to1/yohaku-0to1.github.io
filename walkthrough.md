# Walkthrough - Character Visibility Fix

## Changes

### Character Rendering Fix
- **[FIX] Canvas Processing**: シェーダーによる透過処理が不安定だったため、**Canvas API**を使用した確実な透過処理に変更しました。
    - 画像を一度Canvasに描画し、ピクセルデータを走査して白色部分を透明化。
    - その結果をテクスチャとしてThree.jsに渡すことで、確実に表示されるようにしました。
- **[FIX] UV Mapping**: 画像の一部しか表示されない（または何も表示されない）可能性があったため、画像全体を表示するように設定をリセットしました。

## Verification Results

### Manual Verification Steps
1.  **キャラ表示**:
    - キャラクターが画面中央に表示されているか。
    - 背景が透明になっているか。
2.  **ゲームプレイ**:
    - キャラクターが見えた状態で、通常通りプレイできるか。

## Next Steps
- もし画像が「スプライトシート（複数の絵が並んでいる）」だった場合は、Canvasの描画範囲（`drawImage`の引数）を調整して、特定のポーズだけを切り抜く必要がある。現在は画像全体を表示している。
