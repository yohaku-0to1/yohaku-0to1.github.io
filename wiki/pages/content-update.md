# コンテンツ更新手順

## プロフィールを変更する

`js/data.js` の `PROFILE_DATA` を更新します。

```js
const PROFILE_DATA = {
  githubUsername: "your-name",
  avatarUrl: "",
  name: "表示名",
  bio: "自己紹介"
};
```

## Linksを更新する

同じく `js/data.js` の `links` 配列を編集します。

- `name`: 表示名
- `url`: リンク先
- `icon`: SVG文字列

## Toolsを更新する

`TOOLS_DATA` の配列を編集します。

- 既存項目の `categories` を適切につける
- 検索性のため `description` は用途を明記する

## よくある注意点

- URLは `https://` を含める
- ツールURLは `tools/*.html` を使う
- 外部リンクは `target="_blank"` の場合 `rel="noopener noreferrer"` を付与

## 反映確認

```sh
python3 tools/local_server.py --port 8000 --dir .
```

- トップ: `http://localhost:8000/`
- Wiki: `http://localhost:8000/wiki/`
