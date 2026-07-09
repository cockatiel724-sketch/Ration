// ============================================================
// src/app/screens/RecordScreen.tsx
// 記録画面
//
// ─ 通常記録：品名・金額・カテゴリー等を入力して1件追加
// ─ 内訳記録：レシート単位で品目を複数追加できる
//   「内訳を追加」ボタンで内訳セクションを展開し、
//   品目ごとに 品名・金額・カテゴリー・必需品/娯楽 を設定できる
// ============================================================

import { useState } from "react";
import { Star, CalendarDays, Building2, Check, ChevronDown, Plus, Trash2, ChevronUp, ReceiptText } from "lucide-react";

import type { ExpenseForm, FavoriteItem, UserCategory, ItemLine } from "../types";
import {
  INCOME_CATEGORIES, INCOME_CATEGORY_COLORS, INCOME_CATEGORY_ICONS,
  getPaymentIcon,
} from "../constants";
import { CategoryIcon } from "../components/CategoryIcon";

// ─── Props ───────────────────────────────────────────────────

interface RecordScreenProps {
  form: ExpenseForm;
  setForm: (f: ExpenseForm) => void;
  onSubmit: (itemLines?: ItemLine[]) => void;
  success: boolean;
  favorites: FavoriteItem[];
  applyFavorite: (fav: FavoriteItem) => void;
  paymentMethods: string[];
  categories: UserCategory[];
}

// ─── 内訳1行コンポーネント ────────────────────────────────────

function ItemLineRow({
  line, categories, onChange, onRemove,
}: {
  line: ItemLine;
  categories: UserCategory[];
  onChange: (updated: ItemLine) => void;
  onRemove: () => void;
}) {
  const [showCats, setShowCats] = useState(false);

  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-3 space-y-2">
      {/* 品名 + 削除ボタン */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={line.item}
          onChange={(e) => onChange({ ...line, item: e.target.value })}
          placeholder="品名"
          className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/40"
        />
        <button onClick={onRemove} className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      {/* 金額 */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm pl-1">¥</span>
        <input
          type="number"
          inputMode="numeric"
          value={line.amount}
          onChange={(e) => onChange({ ...line, amount: e.target.value })}
          placeholder="0"
          className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground"
          style={{ fontFamily: "'DM Mono', monospace" }}
        />
      </div>

      {/* カテゴリー（コンパクト） */}
      <div>
        <button
          onClick={() => setShowCats((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-1"
        >
          <CategoryIcon icon={categories.find((c) => c.label === line.category)?.icon ?? "Package"} size={12} />
          <span>{line.category || "カテゴリー選択"}</span>
          {showCats ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {showCats && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {categories.map((cat) => {
              const active = line.category === cat.label;
              return (
                <button
                  key={cat.id}
                  onClick={() => { onChange({ ...line, category: cat.label }); setShowCats(false); }}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <CategoryIcon icon={cat.icon} size={11} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 必需品 / 娯楽 */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange({ ...line, isEssential: true })}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
            line.isEssential ? "border-blue-500/40 bg-blue-500/15 text-blue-400" : "border-border text-muted-foreground"
          }`}
        >
          必需品
        </button>
        <button
          onClick={() => onChange({ ...line, isEssential: false })}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
            !line.isEssential ? "border-pink-500/40 bg-pink-500/15 text-pink-400" : "border-border text-muted-foreground"
          }`}
        >
          娯楽
        </button>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────

export function RecordScreen({
  form, setForm, onSubmit, success,
  favorites, applyFavorite,
  paymentMethods, categories,
}: RecordScreenProps) {
  const isExpense = form.type === "expense";
  const isReady   = form.amount !== "" && (isExpense ? form.item !== "" : true);
  const [showAllCats, setShowAllCats] = useState(false);
  const visibleCats = showAllCats ? categories : categories.slice(0, 10);

  // 内訳リスト
  const [itemLines, setItemLines] = useState<ItemLine[]>([]);
  const [showItemLines, setShowItemLines] = useState(false);

  const defaultCategory = categories[0]?.label ?? "";

  // 内訳行を追加
  const addLine = () => {
    setItemLines((prev) => [
      ...prev,
      { id: Date.now().toString(), item: "", amount: "", category: form.category || defaultCategory, isEssential: form.isEssential },
    ]);
  };

  // 内訳の合計を金額欄に自動反映するかどうか
  const linesTotal = itemLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const handleSubmit = () => {
    const validLines = itemLines.filter((l) => l.item.trim() && Number(l.amount) > 0);
    onSubmit(validLines.length > 0 ? validLines : undefined);
    setItemLines([]);
    setShowItemLines(false);
  };

  return (
    <div className="p-4 pb-6 space-y-3">

      {/* ── 支出 / 収入 切り替え ── */}
      <div className="pt-2">
        <div className="flex bg-muted rounded-2xl p-1">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => setForm({ ...form, type: t })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                form.type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              {t === "expense" ? "支出" : "収入"}
            </button>
          ))}
        </div>
      </div>

      {/* ── 日付 ── */}
      <div className="rounded-2xl bg-card border border-border px-4 py-3 flex items-center gap-3">
        <CalendarDays size={16} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground tracking-widest mb-0.5">日付</p>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-foreground" />
        </div>
      </div>

      {/* ── 金額 ── */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-muted-foreground tracking-widest">金額</p>
          {/* 内訳の合計がある場合にヒントを表示 */}
          {linesTotal > 0 && (
            <button
              onClick={() => setForm({ ...form, amount: String(linesTotal) })}
              className="text-[10px] text-primary hover:underline"
            >
              内訳合計 ¥{linesTotal.toLocaleString("ja-JP")} を反映
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-light ${isExpense ? "text-muted-foreground" : "text-primary"}`}>¥</span>
          <input type="number" inputMode="numeric" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            className="flex-1 text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/25 text-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }} />
        </div>
      </div>

      {isExpense ? (
        <>
          {/* ── 品名 ＋ お気に入り ── */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-2">品名</p>
            <input type="text" value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              placeholder="例：スーパーまとめ買い"
              className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 text-foreground" />
            {favorites.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {favorites.map((fav) => (
                  <button key={fav.id} onClick={() => applyFavorite(fav)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                      form.item === fav.item ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    <Star size={8} className={form.item === fav.item ? "fill-primary" : ""} />
                    {fav.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 店舗名 ── */}
          <div className="rounded-2xl bg-card border border-border px-4 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground tracking-widest mb-0.5">店舗名</p>
              <input type="text" value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                placeholder="例：イオン・スターバックス"
                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 text-foreground" />
            </div>
          </div>

          {/* ── カテゴリー（内訳なしのときのみ表示） ── */}
          {!showItemLines && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-3">カテゴリー</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleCats.map((cat) => {
                const active = form.category === cat.label;
                return (
                  <button key={cat.id} onClick={() => setForm({ ...form, category: cat.label })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl transition-all border ${
                      active ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    <CategoryIcon icon={cat.icon} size={14} className={active ? "text-primary" : "text-muted-foreground"} />
                    {cat.label}
                  </button>
                );
              })}
              {!showAllCats && categories.length > 10 && (
                <button onClick={() => setShowAllCats(true)}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-2xl border border-dashed border-border text-muted-foreground hover:text-foreground">
                  <ChevronDown size={12} />その他
                </button>
              )}
              {showAllCats && (
                <button onClick={() => setShowAllCats(false)}
                  className="text-xs px-3 py-2 rounded-2xl border border-dashed border-border text-muted-foreground">
                  閉じる
                </button>
              )}
            </div>
          </div>
          )}

          {/* ── 支払い方法 ── */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-3">支払い方法</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((pm) => {
                const Icon = getPaymentIcon(pm);
                return (
                  <button key={pm} onClick={() => setForm({ ...form, paymentMethod: pm })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      form.paymentMethod === pm ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    <Icon size={14} strokeWidth={1.8} />{pm}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 必需品 / 娯楽（内訳なしのときのみ） ── */}
          {!showItemLines && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-3">種別</p>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, isEssential: true })}
                className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all border ${
                  form.isEssential ? "border-blue-500/40 bg-blue-500/15 text-blue-400" : "border-border text-muted-foreground"
                }`}>必需品</button>
              <button onClick={() => setForm({ ...form, isEssential: false })}
                className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all border ${
                  !form.isEssential ? "border-pink-500/40 bg-pink-500/15 text-pink-400" : "border-border text-muted-foreground"
                }`}>娯楽</button>
            </div>
          </div>
          )}

          {/* ────────────────────────────────────────────────── */}
          {/* ── 内訳セクション ────────────────────────────── */}
          {/* ────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* 内訳ヘッダー（タップで開閉） */}
            <button
              onClick={() => { setShowItemLines((v) => !v); if (!showItemLines && itemLines.length === 0) addLine(); }}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-2">
                <ReceiptText size={16} className="text-muted-foreground" strokeWidth={1.8} />
                <span className="text-sm font-medium">内訳</span>
                {itemLines.length > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {itemLines.length}品目
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {showItemLines ? "閉じる" : "レシート単位で追加"}
                </span>
                {showItemLines ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </div>
            </button>

            {/* 内訳リスト */}
            {showItemLines && (
              <div className="border-t border-border px-4 pt-3 pb-4 space-y-3">
                <p className="text-[10px] text-muted-foreground">
                  品目ごとにカテゴリーや種別を個別設定できます。<br />
                  内訳の合計は金額欄に「反映」ボタンで自動入力できます。
                </p>

                {/* 内訳行リスト */}
                {itemLines.map((line) => (
                  <ItemLineRow
                    key={line.id}
                    line={line}
                    categories={categories}
                    onChange={(updated) => setItemLines((prev) => prev.map((l) => l.id === line.id ? updated : l))}
                    onRemove={() => setItemLines((prev) => prev.filter((l) => l.id !== line.id))}
                  />
                ))}

                {/* 内訳合計表示 */}
                {itemLines.length > 0 && linesTotal > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-muted-foreground">内訳合計</span>
                    <span className="text-sm font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
                      ¥{linesTotal.toLocaleString("ja-JP")}
                    </span>
                  </div>
                )}

                {/* 品目追加ボタン */}
                <button
                  onClick={addLine}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Plus size={13} strokeWidth={2} />
                  品目を追加
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* ── 収入元 ── */}
          <div className="rounded-2xl bg-card border border-border px-4 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground tracking-widest mb-0.5">収入元・会社名</p>
              <input type="text" value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                placeholder="例：株式会社〇〇"
                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 text-foreground" />
            </div>
          </div>

          {/* ── 収入カテゴリー ── */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-3">収入カテゴリー</p>
            <div className="flex flex-wrap gap-1.5">
              {INCOME_CATEGORIES.map((cat) => {
                const active = form.incomeCategory === cat;
                const color  = INCOME_CATEGORY_COLORS[cat];
                const Icon   = INCOME_CATEGORY_ICONS[cat];
                return (
                  <button key={cat} onClick={() => setForm({ ...form, incomeCategory: cat })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl transition-all border ${
                      active ? "border-transparent font-semibold" : "border-border text-muted-foreground"
                    }`}
                    style={active ? { background: color, color: "#052e16" } : {}}>
                    <Icon size={14} strokeWidth={1.8} />{cat}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── 送信ボタン ── */}
      <button onClick={handleSubmit} disabled={!isReady}
        className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${
          success ? "bg-green-500 text-white"
          : isReady ? "text-white hover:opacity-90 active:scale-[0.98]"
          : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
        style={isReady && !success ? {
          background: isExpense
            ? "linear-gradient(135deg, #059669 0%, #34d399 100%)"
            : "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
        } : {}}>
        {success
          ? <span className="flex items-center justify-center gap-2"><Check size={16} />記録しました！</span>
          : isExpense
            ? itemLines.filter((l) => l.item.trim() && Number(l.amount) > 0).length > 0
              ? `支出を追加する（合計 + ${itemLines.filter((l) => l.item.trim() && Number(l.amount) > 0).length}品目）`
              : "支出を追加する"
            : "収入を追加する"}
      </button>
    </div>
  );
}
