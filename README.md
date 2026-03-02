# Punch Card Programming Simulator

IBM 80列パンチカードによるプログラミングを体験できるインタラクティブなWebアプリケーション。

![Screenshot](/.claude/tmp/screenshots/punchcard-countdown.png)

## 起動方法

ブラウザで `index.html` を直接開くだけで動作します。ビルドツールやフレームワークは不要です。

```bash
open index.html
```

ローカルサーバーを使う場合：

```bash
python3 -m http.server 8765
# http://localhost:8765 にアクセス
```

## 機能

### パンチカード操作
- **クリック**: セルをクリックして穴を開閉（トグル）
- **キーボード入力**: 文字を入力すると IBM 029 エンコーディングで自動パンチ
- **カーソル移動**: 矢印キー / Home / End
- **Backspace**: 前の列を消去
- **Enter**: 次のカードへ移動（末尾なら新規追加）

### デッキ管理
- カードの追加・削除・クリア
- Prev / Next ナビゲーション
- サムネイル付きデッキ概要パネル
- localStorage への自動保存

### プログラム実行
14命令の簡易インタープリタを搭載。ターミナル風パネル（黒背景/緑文字）に出力されます。

| 命令 | 書式 | 説明 |
|------|------|------|
| `PRT` | `PRT text` | テキスト出力 |
| `NUM` | `NUM var val` | 変数に数値代入 |
| `ADD` | `ADD var val` | 加算 |
| `SUB` | `SUB var val` | 減算 |
| `MUL` | `MUL var val` | 乗算 |
| `DIV` | `DIV var val` | 除算 |
| `SHW` | `SHW var` | 変数値を出力 |
| `LBL` | `LBL name` | ラベル定義 |
| `JMP` | `JMP name` | ラベルへジャンプ |
| `JEZ` | `JEZ var name` | 0ならジャンプ |
| `JGZ` | `JGZ var name` | 正ならジャンプ |
| `INP` | `INP var` | ユーザー入力 |
| `END` | `END` | 終了 |
| `REM` | `REM text` | コメント |

### サンプルプログラム
ドロップダウンから読み込み可能：

- **Hello World** — `PRT HELLO WORLD` → `END`
- **Countdown** — 10からカウントダウンして `LIFTOFF` を表示
- **Calculator** — 2数を入力して加算結果を表示
- **Fibonacci** — フィボナッチ数列の最初の10項を表示

## 技術スタック

- Vanilla HTML / CSS / JavaScript (ES Modules)
- ビルドツール・フレームワーク依存なし
- IBM Plex Mono フォント（Google Fonts）

## ファイル構成

```
acme/
├── index.html        # アプリシェル
├── css/
│   └── style.css     # レトロ IBM 風スタイル
└── js/
    ├── app.js        # アプリ初期化・状態管理
    ├── encoding.js   # IBM 029 文字エンコーディング
    ├── card.js       # PunchCard データモデル
    ├── deck.js       # CardDeck 管理
    ├── renderer.js   # カードグリッド DOM 描画
    ├── keyboard.js   # キーボード入力ハンドラ
    ├── interpreter.js # 命令インタープリタ
    └── tutorial.js   # チュートリアル・教育コンテンツ
```

## デプロイ (Cloudflare Pages)

静的サイトとしてそのままデプロイ可能です。

```bash
wrangler pages deploy acme/
```

またはCloudflareダッシュボードからドラッグ＆ドロップでデプロイできます。
