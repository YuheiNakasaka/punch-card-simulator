# 開発ガイド

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [アーキテクチャ](#アーキテクチャ)
- [モジュール詳細](#モジュール詳細)
- [データモデル](#データモデル)
- [DOM 構造](#dom-構造)
- [デザイントークン（CSS カスタムプロパティ）](#デザイントークンcss-カスタムプロパティ)
- [新機能の追加ガイド](#新機能の追加ガイド)
- [デプロイ](#デプロイ)

---

## 開発環境のセットアップ

ビルドツール・フレームワーク・npm は不要です。ES Modules を使用しているためローカルサーバーが必要です。

```bash
cd acme/punch-card-simulator

# ローカルサーバー起動
python3 -m http.server 8765

# ブラウザで開く
open http://localhost:8765
```

> **注意**: `file://` プロトコルでは ES Modules の import が CORS エラーになるため、HTTP サーバー経由で開いてください。

### 必要環境

- モダンブラウザ（ES Modules 対応: Chrome 61+, Firefox 60+, Safari 11+）
- ローカル HTTP サーバー（Python, Node, etc.）

---

## アーキテクチャ

MVC パターンをベースとした構成です。

```
┌──────────────────────────────────────────────────────┐
│                   app.js (Controller)                 │
├───────────────┬────────────────┬──────────────────────┤
│  CardDeck     │  CardRenderer  │    Interpreter       │
│  (Model)      │  (View)        │    (Engine)          │
│               │                │                      │
│  ┌─────────┐  │  ┌──────────┐  │  ┌────────────────┐  │
│  │PunchCard│  │  │Grid DOM  │  │  │Variables/Labels│  │
│  │ 80×12   │  │  │Click/    │  │  │Program Counter │  │
│  │ boolean │  │  │Cursor    │  │  │Step Counter    │  │
│  └─────────┘  │  └──────────┘  │  └────────────────┘  │
│               │                │                      │
├───────────────┴────────────────┴──────────────────────┤
│               KeyboardHandler (Input)                 │
├───────────────────────────────────────────────────────┤
│  encoding.js (IBM 029 Lookup Tables)                  │
│  tutorial.js (Static Content & Examples)              │
└───────────────────────────────────────────────────────┘
```

### データフロー

```
ユーザー操作 (キーボード / クリック)
  → KeyboardHandler or CardRenderer.onCellClick
    → PunchCard モデルを更新
      → CardDeck.onChange コールバック発火
        → app._updateAll() で再描画
          → localStorage に自動保存 (500ms debounce)
```

### モジュール依存関係

```
app.js
├── deck.js
│   └── card.js
│       └── encoding.js
├── renderer.js
│   └── encoding.js
├── keyboard.js
│   └── encoding.js
├── interpreter.js  (依存なし)
└── tutorial.js
    └── encoding.js
```

---

## モジュール詳細

### encoding.js — IBM 029 文字エンコーディング

全モジュールの基盤。IBM 029 キーパンチの文字⇔パンチパターン変換を提供します。

| エクスポート | 種別 | 説明 |
|---|---|---|
| `COLS` | `number` | カラム数 (`80`) |
| `ROWS` | `number` | 行数 (`12`) |
| `ROW_LABELS` | `string[]` | 行ラベル `['12','11','0','1',...,'9']` |
| `ROW_INDEX` | `object` | ラベル→インデックス マップ |
| `CHAR_TO_PUNCHES` | `object` | 文字→パンチ行ラベル配列 |
| `PUNCHES_TO_CHAR` | `object` | パンチパターン→文字（逆引き） |
| `encodeChar(char)` | `function` | 文字 → row index 配列 (0-11) |
| `decodeRows(rowIndices)` | `function` | row index 配列 → 文字 |
| `getAllEncodings()` | `function` | 全エンコーディング一覧 |

**エンコーディング規則:**

| 文字範囲 | ゾーンパンチ | 数字パンチ |
|---|---|---|
| A-I | Row 12 | Row 1-9 |
| J-R | Row 11 | Row 1-9 |
| S-Z | Row 0 | Row 2-9 |
| 0-9 | — | Row 0-9 |
| 特殊文字 | 2〜3行の組み合わせ | |

**新しい文字を追加する場合:**

`CHAR_TO_PUNCHES` にエントリを追加すれば、逆引きマップ `PUNCHES_TO_CHAR` はモジュールロード時に自動生成されます。

---

### card.js — PunchCard データモデル

1枚のパンチカード (80列×12行) を表現するクラスです。

```js
import { PunchCard } from './card.js';

const card = new PunchCard();
card.encodeCharAt(0, 'A');       // 列0に'A'をパンチ
card.decodeCharAt(0);            // → 'A'
card.readText();                 // → 'A' (trailing spaces trimmed)
card.writeText('HELLO', 0);     // 列0-4に'HELLO'を書き込み
card.toggle(5, 0);              // 列5, row12 をトグル
card.toJSON();                  // → { punches: [[0,0],[0,3], ...] }
PunchCard.fromJSON(data);       // デシリアライズ
```

**主要メソッド:**

| メソッド | 説明 |
|---|---|
| `toggle(col, row)` | パンチ状態をトグル |
| `punch(col, row)` | パンチを追加 |
| `clear(col, row)` | パンチを除去 |
| `isPunched(col, row)` | パンチ状態を取得 |
| `clearColumn(col)` | 列を全消去 |
| `encodeCharAt(col, char)` | 文字をエンコードして列にパンチ |
| `decodeCharAt(col)` | 列からデコードされた文字を取得 |
| `readText()` | カード全体を文字列として読み取り |
| `writeText(text, startCol)` | 文字列をカードに書き込み |
| `clearAll()` | カード全体を消去 |
| `isBlank()` | 空カードかどうか |
| `toJSON()` / `fromJSON()` | シリアライズ / デシリアライズ |

**シリアライズ形式 (sparse):**

```json
{ "punches": [[0, 0], [0, 3], [1, 0], [1, 4]] }
```

パンチされた `[col, row]` ペアのみ保存。空のセルは省略されるため効率的です。

---

### deck.js — CardDeck 管理

複数の PunchCard を管理するデッキクラスです。

```js
import { CardDeck } from './deck.js';

const deck = new CardDeck();
deck.onChange = () => { /* 変更通知 */ };
deck.currentCard;                  // 現在のカード
deck.addCard();                    // 現在位置の後ろに挿入
deck.next(); deck.prev();          // ナビゲーション
deck.loadProgram(['PRT HI', 'END']); // プログラム読み込み
deck.readAllText();                // → ['PRT HI', 'END']
deck.save(); deck.load();          // localStorage 永続化
```

**localStorage キー:** `punchcard-deck`

**保存形式:**

```json
{
  "cards": [{ "punches": [...] }, ...],
  "currentIndex": 0
}
```

---

### renderer.js — カード描画

DOM を構築してカードの視覚表現を生成します。

**CardRenderer:**

```js
import { CardRenderer } from './renderer.js';

const renderer = new CardRenderer(document.getElementById('card-container'));
renderer.onCellClick = (col, row) => { /* クリックハンドラ */ };
renderer.render(card);           // カードの状態を DOM に反映
renderer.updateCursor(col);      // カーソル位置を更新
```

**生成される DOM 構造:**

```
.punch-card
├── .card-char-row          ← デコード文字表示（80セル）
│   ├── .row-label.spacer
│   └── .char-cell × 80
├── .card-col-numbers       ← 列番号（1, 5, 10, 15, ... 80）
│   ├── .row-label.spacer
│   └── .col-num × 80
└── .card-grid              ← パンチグリッド（12行×80列 = 960セル）
    ├── .row-label + .grid-cell × 80  (row 12)
    ├── .row-label + .grid-cell × 80  (row 11)
    └── ...                            (row 0-9)
```

**renderCardThumbnail(card, index, isCurrent):**

デッキ概要パネルのサムネイルを生成。Canvas (160×24px) でミニグリッドを描画します。

---

### keyboard.js — キーボード入力

キー入力をカード操作に変換します。

| キー | 動作 |
|---|---|
| 英数字・記号 | `CHAR_TO_PUNCHES` にあれば列にエンコード、カーソル右移動 |
| `←` / `→` | カーソル移動 |
| `Home` / `End` | 列先頭/末尾へ |
| `Backspace` | 前列を消去 |
| `Delete` | 現在列を消去 |
| `Enter` | 次カードへ（末尾なら新規追加） |

**注意:** `<input>` / `<textarea>` にフォーカスがあるときは処理をスキップします。

---

### interpreter.js — 命令インタープリタ

14命令をサポートする簡易プログラム実行エンジンです。

```js
import { Interpreter } from './interpreter.js';

const interp = new Interpreter();
interp.onOutput = (text) => console.log(text);
interp.onFinish = (msg) => console.log(msg);
interp.load(['PRT HELLO', 'END']);
interp.run();             // 全実行
// or
interp.stepOnce();        // 1命令ずつ
```

**実行フロー:**

1. `load(lines)` — プログラムをパース、ラベルを先行検索（1パス目）
2. `run()` — `step()` をループ呼び出し
3. `step()` — PC 位置の命令を実行、PC を進める
4. `INP` 命令で `waitingForInput = true` になり一時停止
5. コールバック経由で値を受け取ると再開
6. `END` 命令または最大ステップ数 (10,000) で終了

**変数:** `this.variables` (string → number)。未定義変数は `0` として扱います。

**新しい命令を追加する場合:**

`step()` メソッド内の `switch(op)` にケースを追加します。

```js
case 'NEW_OP': {
  // 実装
  this.pc++;
  break;
}
```

---

### tutorial.js — チュートリアル・サンプル

静的コンテンツの生成と、サンプルプログラムの定義を担当します。

**サンプルプログラムを追加する場合:**

`EXAMPLES` オブジェクトにエントリを追加します。

```js
export const EXAMPLES = {
  'Hello World': ['PRT HELLO WORLD', 'END'],
  'My New Program': [
    'NUM X 5',
    'SHW X',
    'END',
  ],
  // ...
};
```

ドロップダウンには `app.js` の `_buildExamplesDropdown()` で自動反映されます。

---

### app.js — アプリケーションコントローラ

全モジュールを統合するエントリポイントです。

**初期化フロー (`init()`):**

1. `CardRenderer` を生成、クリックハンドラを設定
2. `KeyboardHandler` を生成、コールバックを設定
3. `CardDeck.onChange` に再描画を紐づけ
4. `Interpreter` のコールバック (output/input/step/finish) を設定
5. ツールバーボタンのイベントリスナーを登録
6. タブナビゲーションを設定
7. サンプルドロップダウンを構築
8. チュートリアル・エンコーディングテーブルを描画
9. localStorage からデッキを復元
10. 初回描画

**自動保存:** `_scheduleSave()` で 500ms デバウンスの localStorage 保存を行います。

---

## データモデル

### PunchCard グリッド

```
grid[col][row]  (boolean)

col: 0-79 (80列)
row: 0-11 (12行)

行のマッピング:
  index 0  → Row 12 (ゾーン)
  index 1  → Row 11 (ゾーン)
  index 2  → Row 0  (ゾーン/数字)
  index 3  → Row 1  (数字)
  ...
  index 11 → Row 9  (数字)
```

### エンコーディング例

```
'A' → Row 12 + Row 1 → grid[col][0] = true, grid[col][3] = true
'5' → Row 5          → grid[col][7] = true
' ' → (パンチなし)
```

---

## DOM 構造

```html
<body>
  <header class="app-header">          <!-- IBM 青ヘッダー -->

  <div class="toolbar">                <!-- ツールバー -->
    ├── btn-prev / card-counter / btn-next
    ├── btn-add / btn-remove / btn-clear-card / btn-clear-deck
    └── examples-select

  <div class="card-area">              <!-- パンチカード表示エリア -->
    └── #card-container                <!-- CardRenderer がここに構築 -->

  <div class="tab-bar">                <!-- タブ切り替え -->
    └── Deck | Output | Encoding | Tutorial

  <div class="tab-content">            <!-- タブパネル -->
    ├── #tab-deck > #deck-overview     <!-- カードサムネイル一覧 -->
    ├── #tab-output                    <!-- ターミナル出力 -->
    │   ├── #terminal-output
    │   └── #terminal-input-area       <!-- INP 命令用 -->
    ├── #tab-reference                 <!-- エンコーディング表 -->
    └── #tab-tutorial                  <!-- チュートリアル -->

  <div class="exec-bar">               <!-- 実行バー -->
    └── btn-run / btn-step / btn-reset
</body>
```

---

## デザイントークン（CSS カスタムプロパティ）

`css/style.css` の `:root` で定義されています。

### カラーパレット

| トークン | 値 | 用途 |
|---|---|---|
| `--manila` | `#F5E6C8` | カード背景 |
| `--manila-dark` | `#E8D5B0` | カード影 |
| `--ibm-blue` | `#0530AD` | ヘッダー・プライマリボタン |
| `--ibm-blue-light` | `#1A5AE0` | ホバー・アクティブタブ |
| `--brown` | `#3E2723` | カード上のテキスト |
| `--punch-hole` | `#1A1A1A` | パンチ穴 |
| `--terminal-bg` | `#0A0A0A` | 出力パネル背景 |
| `--terminal-green` | `#33FF33` | 出力テキスト |
| `--bg` | `#2C2C2C` | ページ背景 |
| `--surface` | `#383838` | ツールバー等 |
| `--cursor-color` | `rgba(255,200,50,0.4)` | カーソルハイライト |

### レスポンシブ対応

```css
@media (max-width: 1200px)  → カードを 0.85 倍に縮小
@media (max-width: 900px)   → カードを 0.65 倍に縮小、左寄せ
```

---

## 新機能の追加ガイド

### 新しいインタープリタ命令を追加する

1. `js/interpreter.js` の `step()` メソッド内の `switch` にケースを追加
2. `js/tutorial.js` の命令リファレンス HTML を更新
3. 必要に応じてサンプルプログラムを追加

### 新しい文字エンコーディングを追加する

1. `js/encoding.js` の `CHAR_TO_PUNCHES` にエントリを追加
2. 逆引きマップは自動生成されるため対応不要
3. `js/keyboard.js` は `CHAR_TO_PUNCHES` を参照するため自動対応

### 新しいサンプルプログラムを追加する

1. `js/tutorial.js` の `EXAMPLES` オブジェクトにエントリを追加
2. ドロップダウンは `app.js` で自動構築されるため他の変更は不要

### 新しい UI タブを追加する

1. `index.html` に `<button class="tab-btn" data-tab="xxx">` と `<div id="tab-xxx" class="tab-panel">` を追加
2. タブ切り替えロジックは `app.js` の `_bindTabs()` が data 属性ベースで自動処理

---

## デプロイ

### Cloudflare Pages

静的サイトとしてそのままデプロイ可能です。ビルドコマンドは不要です。

```bash
# CLI
wrangler pages deploy acme/punch-card-simulator/

# または Cloudflare ダッシュボードからドラッグ＆ドロップ
```

### その他のホスティング

すべてのアセットパスは相対パスのため、任意の静的ホスティングで動作します。

- GitHub Pages
- Netlify
- Vercel
- S3 + CloudFront
