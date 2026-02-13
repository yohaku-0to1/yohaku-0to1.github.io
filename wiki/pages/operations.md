# 運用メモ

## ローカル確認

このプロジェクトは静的サイトなので、ローカルサーバで確認します。

```sh
python3 tools/local_server.py --port 8000 --dir .
```

## デプロイ

`main` へのpushで GitHub Pages に反映されます。

```sh
git push origin main
```

## push前チェック

- `git status -sb` で差分確認
- JS編集時は `node --check` 実施
- 画面崩れがないか最低限トップページを確認

## トラブルシュート

### ページが真っ白になる

- Consoleエラーを確認
- `script` の読み込みパスを確認
- `.card` 初期opacityで見えない場合は、初期化で `animate-fade-in-up` を付与

### デプロイ済みなのに反映されない

- ブラウザキャッシュをクリア（ハードリロード）
- 数分待って再確認

### Git操作が権限エラーになる

- 実行環境によっては昇格実行で `git commit / git push` が必要
