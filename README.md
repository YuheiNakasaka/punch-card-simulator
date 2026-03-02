# Punch Card Programming Simulator

IBM 80列パンチカードによるプログラミングを体験できるインタラクティブなWebアプリケーション。

## 起動方法

```bash
npm install
npm run dev
# http://localhost:5173 にアクセス
```

### その他のコマンド

```bash
npm run build     # 本番ビルド (dist/ に出力)
npm run preview   # ビルド結果のプレビュー
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

- **Vite** — 開発サーバー / ビルドツール
- **TypeScript** — strict モード
- **IBM Plex Mono** フォント（Google Fonts）
- フレームワーク依存なし（Vanilla DOM 操作）

## ファイル構成

```
punch-card-simulator/
├── index.html          # アプリシェル
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts         # エントリポイント (CSS import + bootstrap)
│   ├── app.ts          # アプリ初期化・状態管理
│   ├── encoding.ts     # IBM 029 文字エンコーディング
│   ├── card.ts         # PunchCard データモデル
│   ├── deck.ts         # CardDeck 管理
│   ├── renderer.ts     # カードグリッド DOM 描画
│   ├── keyboard.ts     # キーボード入力ハンドラ
│   ├── interpreter.ts  # 命令インタープリタ
│   ├── tutorial.ts     # チュートリアル・サンプルプログラム
│   └── style.css       # レトロ IBM 風スタイル
└── dist/               # ビルド出力 (git 管理外)
```

## デプロイ

### Cloudflare Pages

```bash
npm run build
wrangler pages deploy dist/
```
