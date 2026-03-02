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

### 必要環境

- Node.js 18+
- npm

### セットアップ

```bash
cd punch-card-simulator
npm install
npm run dev
# http://localhost:5173 にアクセス
```

### コマンド一覧

| コマンド | 説明 |
|---|---|
| `npm run dev` | Vite 開発サーバー起動 (HMR 対応) |
| `npm run build` | TypeScript 型チェック + 本番ビルド (`dist/`) |
| `npm run preview` | ビルド結果のローカルプレビュー |
| `npx tsc --noEmit` | TypeScript 型チェックのみ |

### プロジェクト設定ファイル

| ファイル | 説明 |
|---|---|
| `tsconfig.json` | TypeScript 設定 (strict, ES2020, moduleResolution: bundler) |
| `vite.config.ts` | Vite 設定 (root: `.`, outDir: `dist`) |
| `package.json` | `"type": "module"`, 依存: `vite`, `typescript` |

---

## アーキテクチャ

MVC パターンをベースとした構成です。

```
┌──────────────────────────────────────────────────────┐
│                   app.ts (Controller)                  │
├───────────────┬────────────────┬──────────────────────┤
│  CardDeck     │  CardRenderer  │    Interpreter       │
│  (Model)      │  (View)        │    (Engine)          │
│               │                │                      │
│  ┌─────────┐  │  ┌──────────┐  │  ┌────────────────┐  │
│  │PunchCard│  │  │Grid DOM  │  │  │Variables/Labels│  │
│  │ 80×12   │  │  │Click/    │  │  │Program Counter │  │
│  │boolean[]│  │  │Cursor    │  │  │Step Counter    │  │
│  └─────────┘  │  └──────────┘  │  └────────────────┘  │
│               │                │                      │
├───────────────┴────────────────┴──────────────────────┤
│               KeyboardHandler (Input)                 │
├───────────────────────────────────────────────────────┤
│  encoding.ts (IBM 029 Lookup Tables)                  │
│  tutorial.ts (Static Content & Examples)              │
└───────────────────────────────────────────────────────┘
```

### エントリポイント

`src/main.ts` がエントリポイントです。CSS のインポートと `App` クラスの初期化を行います。

```typescript
import './style.css';
import { App } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
```

Vite は `index.html` の `<script type="module" src="/src/main.ts">` から処理を開始します。

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
main.ts
└── app.ts
    ├── deck.ts
    │   └── card.ts
    │       └── encoding.ts
    ├── renderer.ts
    │   ├── encoding.ts
    │   └── card.ts (型参照)
    ├── keyboard.ts
    │   ├── encoding.ts
    │   └── card.ts (型参照)
    ├── interpreter.ts  (外部依存なし)
    └── tutorial.ts
        └── encoding.ts
```

---

## モジュール詳細

### encoding.ts — IBM 029 文字エンコーディング

全モジュールの基盤。IBM 029 キーパンチの文字⇔パンチパターン変換を提供します。

| エクスポート | 型 | 説明 |
|---|---|---|
| `COLS` | `number` (`80`) | カラム数 |
| `ROWS` | `number` (`12`) | 行数 |
| `ROW_LABELS` | `string[]` | 行ラベル `['12','11','0','1',...,'9']` |
| `ROW_INDEX` | `Record<string, number>` | ラベル→インデックス マップ |
| `CHAR_TO_PUNCHES` | `Record<string, string[]>` | 文字→パンチ行ラベル配列 |
| `PUNCHES_TO_CHAR` | `Record<string, string>` | パンチパターン→文字（逆引き） |
| `encodeChar(char: string)` | `number[] \| null` | 文字 → row index 配列 (0-11) |
| `decodeRows(rowIndices: number[])` | `string` | row index 配列 → 文字 |
| `getAllEncodings()` | `Array<{char, punches}>` | 全エンコーディング一覧 |

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

### card.ts — PunchCard データモデル

1枚のパンチカード (80列×12行) を表現するクラスです。

```typescript
import { PunchCard } from './card';

const card = new PunchCard();
card.encodeCharAt(0, 'A');       // 列0に'A'をパンチ
card.decodeCharAt(0);            // → 'A'
card.readText();                 // → 'A' (trailing spaces trimmed)
card.writeText('HELLO', 0);     // 列0-4に'HELLO'を書き込み
card.toggle(5, 0);              // 列5, row12 をトグル
card.toJSON();                  // → { punches: [[0,0],[0,3], ...] }
PunchCard.fromJSON(data);       // デシリアライズ
```

**型定義:**

```typescript
interface PunchCardJSON {
  punches: [number, number][];
}

class PunchCard {
  grid: boolean[][];  // grid[col][row]
  // ...
}
```

**主要メソッド:**

| メソッド | 説明 |
|---|---|
| `toggle(col: number, row: number): void` | パンチ状態をトグル |
| `punch(col: number, row: number): void` | パンチを追加 |
| `clear(col: number, row: number): void` | パンチを除去 |
| `isPunched(col: number, row: number): boolean` | パンチ状態を取得 |
| `clearColumn(col: number): void` | 列を全消去 |
| `encodeCharAt(col: number, char: string): boolean` | 文字をエンコードして列にパンチ |
| `decodeCharAt(col: number): string` | 列からデコードされた文字を取得 |
| `readText(): string` | カード全体を文字列として読み取り |
| `writeText(text: string, startCol?: number): number` | 文字列をカードに書き込み |
| `clearAll(): void` | カード全体を消去 |
| `isBlank(): boolean` | 空カードかどうか |
| `toJSON(): PunchCardJSON` | シリアライズ |
| `static fromJSON(data: PunchCardJSON): PunchCard` | デシリアライズ |

**シリアライズ形式 (sparse):**

```json
{ "punches": [[0, 0], [0, 3], [1, 0], [1, 4]] }
```

パンチされた `[col, row]` ペアのみ保存。空のセルは省略されるため効率的です。

---

### deck.ts — CardDeck 管理

複数の PunchCard を管理するデッキクラスです。

```typescript
import { CardDeck } from './deck';

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

### renderer.ts — カード描画

DOM を構築してカードの視覚表現を生成します。

**CardRenderer:**

```typescript
import { CardRenderer } from './renderer';

const renderer = new CardRenderer(document.getElementById('card-container')!);
renderer.onCellClick = (col: number, row: number) => { /* クリックハンドラ */ };
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

デッキ概要パネルのサムネイルを生成。Canvas (160x24px) でミニグリッドを描画します。

---

### keyboard.ts — キーボード入力

キー入力をカード操作に変換します。

```typescript
interface KeyboardHandlerOptions {
  getCard: () => PunchCard;
  onCursorMove: (col: number) => void;
  onColumnChanged: (col: number) => void;
  onNextCard: () => void;
}
```

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

### interpreter.ts — 命令インタープリタ

14命令をサポートする簡易プログラム実行エンジンです。

```typescript
import { Interpreter } from './interpreter';

const interp = new Interpreter();
interp.onOutput = (text: string) => console.log(text);
interp.onFinish = (msg: string) => console.log(msg);
interp.load(['PRT HELLO', 'END']);
interp.run();             // 全実行
// or
interp.stepOnce();        // 1命令ずつ
```

**主要プロパティの型:**

```typescript
variables: Record<string, number>;
labels: Record<string, number>;
program: string[];
pc: number;
stepCount: number;
running: boolean;
waitingForInput: boolean;
```

**実行フロー:**

1. `load(lines)` — プログラムをパース、ラベルを先行検索（1パス目）
2. `run()` — `step()` をループ呼び出し
3. `step()` — PC 位置の命令を実行、PC を進める
4. `INP` 命令で `waitingForInput = true` になり一時停止
5. コールバック経由で値を受け取ると再開
6. `END` 命令または最大ステップ数 (10,000) で終了

**変数:** `this.variables` (`Record<string, number>`)。未定義変数は `0` として扱います。

**新しい命令を追加する場合:**

`step()` メソッド内の `switch(op)` にケースを追加します。

```typescript
case 'NEW_OP': {
  // 実装
  this.pc++;
  break;
}
```

---

### tutorial.ts — チュートリアル・サンプル

静的コンテンツの生成と、サンプルプログラムの定義を担当します。

**サンプルプログラムを追加する場合:**

`EXAMPLES` オブジェクトにエントリを追加します。

```typescript
export const EXAMPLES: Record<string, string[]> = {
  'Hello World': ['PRT HELLO WORLD', 'END'],
  'My New Program': [
    'NUM X 5',
    'SHW X',
    'END',
  ],
};
```

ドロップダウンには `app.ts` の `_buildExamplesDropdown()` で自動反映されます。

---

### app.ts — アプリケーションコントローラ

全モジュールを統合するコントローラクラスです。`main.ts` から初期化されます。

**主要プロパティの型:**

```typescript
class App {
  deck: CardDeck;
  interpreter: Interpreter;
  renderer: CardRenderer | null;
  keyboard: KeyboardHandler | null;
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null;
}
```

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

**getElementById ヘルパー:** 要素が見つからない場合にエラーをスローするヘルパー関数を提供。TypeScript の null チェックを簡潔にします。

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

  <script type="module" src="/src/main.ts">
</body>
```

---

## デザイントークン（CSS カスタムプロパティ）

`src/style.css` の `:root` で定義されています。

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

1. `src/interpreter.ts` の `step()` メソッド内の `switch` にケースを追加
2. `src/tutorial.ts` の命令リファレンス HTML を更新
3. 必要に応じてサンプルプログラムを追加

### 新しい文字エンコーディングを追加する

1. `src/encoding.ts` の `CHAR_TO_PUNCHES` にエントリを追加
2. 逆引きマップは自動生成されるため対応不要
3. `src/keyboard.ts` は `CHAR_TO_PUNCHES` を参照するため自動対応

### 新しいサンプルプログラムを追加する

1. `src/tutorial.ts` の `EXAMPLES` オブジェクトにエントリを追加
2. ドロップダウンは `app.ts` で自動構築されるため他の変更は不要

### 新しい UI タブを追加する

1. `index.html` に `<button class="tab-btn" data-tab="xxx">` と `<div id="tab-xxx" class="tab-panel">` を追加
2. タブ切り替えロジックは `app.ts` の `_bindTabs()` が data 属性ベースで自動処理

---

## デプロイ

### Cloudflare Pages

```bash
npm run build
wrangler pages deploy dist/
```

### その他のホスティング

`npm run build` で生成される `dist/` ディレクトリを任意の静的ホスティングにデプロイできます。

- GitHub Pages
- Netlify
- Vercel
- S3 + CloudFront
