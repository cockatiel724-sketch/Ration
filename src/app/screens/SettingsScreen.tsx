// ============================================================
// src/app/screens/SettingsScreen.tsx
// 設定画面（折りたたみセクション・固定費追加）
// ============================================================

import { useState, useRef, useEffect } from "react";
import {
  Sun, Moon, Plus, X, Check, Trash2, GripVertical, ChevronDown,
} from "lucide-react";

import type { FavoriteItem, UserCategory, FixedExpense } from "../types";
import { getPaymentIcon, yen, CATEGORY_ICON_OPTIONS, DEFAULT_CATEGORIES } from "../constants";
import { CategoryIcon } from "../components/CategoryIcon";

interface SettingsScreenProps {
  dark: boolean;
  setDark: (v: boolean) => void;
  favorites: FavoriteItem[];
  setFavorites: (f: FavoriteItem[]) => void;
  paymentMethods: string[];
  setPaymentMethods: (p: string[]) => void;
  categories: UserCategory[];
  setCategories: (c: UserCategory[]) => void;
  fixedExpenses: FixedExpense[];
  setFixedExpenses: (f: FixedExpense[]) => void;
  syncMessage: string;
}

// ─── 折りたたみセクション ─────────────────────────────────────

function Section({
  title, count, children, addLabel, onAdd,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  addLabel?: string;
  onAdd?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* ヘッダー（タップで開閉） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}件
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* 展開コンテンツ */}
      {open && (
        <div className="border-t border-border">
          {children}
          {onAdd && (
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={onAdd}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}
              >
                <Plus size={13} strokeWidth={2.5} />
                {addLabel ?? "追加"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ドラッグ並び替えリスト（カテゴリー用） ──────────────────

function DraggableCats({
  categories, setCategories,
}: {
  categories: UserCategory[];
  setCategories: (c: UserCategory[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (dragIdx === null) return;
    const findOver = (y: number) =>
      itemRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const r = ref.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) setOverIdx(i);
      });
    const onMove = (e: TouchEvent | MouseEvent) =>
      findOver("touches" in e ? e.touches[0].clientY : e.clientY);
    const onEnd = () => {
      if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
        const next = [...categories];
        const [item] = next.splice(dragIdx, 1);
        next.splice(overIdx, 0, item);
        setCategories(next);
      }
      setDragIdx(null);
      setOverIdx(null);
    };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend",  onEnd);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend",  onEnd);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onEnd);
    };
  }, [dragIdx, overIdx, categories, setCategories]);

  return (
    <div>
      {categories.map((cat, i) => (
        <div
          key={cat.id}
          ref={(el) => { itemRefs.current[i] = el; }}
          className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
            overIdx === i && dragIdx !== i ? "bg-primary/8" : ""
          } ${dragIdx === i ? "opacity-40" : ""}`}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); setDragIdx(i); }}
            onTouchStart={() => setDragIdx(i)}
            className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab touch-none p-1 -ml-1"
          >
            <GripVertical size={16} strokeWidth={1.5} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <CategoryIcon icon={cat.icon} size={15} className="text-foreground" />
          </div>
          <span className="flex-1 text-sm">{cat.label}</span>
          {DEFAULT_CATEGORIES.some((d) => d.id === cat.id) ? (
            <span className="text-[9px] text-muted-foreground/40 px-1">固定</span>
          ) : (
            <button
              onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── カテゴリー追加フォーム ──────────────────────────────────

function CatAddForm({
  categories, setCategories, onClose,
}: {
  categories: UserCategory[];
  setCategories: (c: UserCategory[]) => void;
  onClose: () => void;
}) {
  const [label,   setLabel]   = useState("");
  const [iconKey, setIconKey] = useState("Package");

  const save = () => {
    const l = label.trim();
    if (!l || categories.some((c) => c.label === l)) return;
    setCategories([...categories, { id: `c${Date.now()}`, label: l, icon: iconKey }]);
    onClose();
  };

  return (
    <div className="p-4 border-t border-border bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">カテゴリーを追加</p>
        <button onClick={onClose} className="text-muted-foreground"><X size={14} /></button>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">カテゴリー名</p>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：交際費"
          className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-2">アイコン（50種）</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
            <CategoryIcon icon={iconKey} size={18} className="text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">選択中</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {CATEGORY_ICON_OPTIONS.map(({ key, Icon }) => (
            <button key={key} onClick={() => setIconKey(key)}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                iconKey === key ? "bg-primary/20 ring-1 ring-primary text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              <Icon size={15} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={!label.trim()}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>
        <Check size={12} className="inline mr-1.5" />追加する
      </button>
    </div>
  );
}

// ─── 固定費フォーム ───────────────────────────────────────────

function FixedExpenseForm({
  initial, categories, paymentMethods, onSave, onClose,
}: {
  initial?: FixedExpense;
  categories: UserCategory[];
  paymentMethods: string[];
  onSave: (fe: FixedExpense) => void;
  onClose: () => void;
}) {
  const [item,      setItem]      = useState(initial?.item      ?? "");
  const [amount,    setAmount]    = useState(initial?.amount    ? String(initial.amount) : "");
  const [store,     setStore]     = useState(initial?.store     ?? "");
  const [category,  setCategory]  = useState(initial?.category  ?? (categories[0]?.label ?? ""));
  const [pm,        setPm]        = useState(initial?.paymentMethod ?? (paymentMethods[0] ?? "現金"));
  const [essential, setEssential] = useState(initial?.isEssential ?? true);
  const [day,       setDay]       = useState(initial?.dayOfMonth ?? 1);

  const canSave = item.trim() && Number(amount) > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      id:            initial?.id ?? `fe_${Date.now()}`,
      label:         item.trim(),  // 品名をそのままラベルとして使う
      item:          item.trim(),
      amount:        parseInt(amount, 10),
      store,
      category,
      paymentMethod: pm,
      isEssential:   essential,
      dayOfMonth:    day,
    });
  };

  return (
    <div className="p-4 bg-muted/30 space-y-3 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{initial ? "固定費を編集" : "固定費を追加"}</p>
        <button onClick={onClose} className="text-muted-foreground"><X size={14} /></button>
      </div>

      {/* 品名・金額 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">品名</p>
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="家賃"
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">金額（必須）</p>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }} />
        </div>
      </div>

      {/* 引き落とし日 */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">毎月の記録日</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">毎月</span>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}
            className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground font-medium">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">に自動記録</span>
        </div>
      </div>

      {/* 店舗・カテゴリー */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">支払先</p>
          <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="大家さん"
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">カテゴリー</p>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground">
            {categories.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* 支払い方法・種別 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">支払い方法</p>
          <select value={pm} onChange={(e) => setPm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground">
            {paymentMethods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">種別</p>
          <div className="flex gap-1 h-[36px]">
            <button onClick={() => setEssential(true)}
              className={`flex-1 rounded-xl text-[11px] font-medium border ${essential ? "border-blue-500/40 bg-blue-500/15 text-blue-400" : "border-border text-muted-foreground"}`}>
              必需品
            </button>
            <button onClick={() => setEssential(false)}
              className={`flex-1 rounded-xl text-[11px] font-medium border ${!essential ? "border-pink-500/40 bg-pink-500/15 text-pink-400" : "border-border text-muted-foreground"}`}>
              娯楽
            </button>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={!canSave}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>
        <Check size={12} className="inline mr-1.5" />{initial ? "変更を保存" : "追加する"}
      </button>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────

export function SettingsScreen({
  dark, setDark,
  favorites, setFavorites,
  paymentMethods, setPaymentMethods,
  categories, setCategories,
  fixedExpenses, setFixedExpenses,
  syncMessage,
}: SettingsScreenProps) {
  // カテゴリー追加フォームの開閉
  const [showCatForm, setShowCatForm] = useState(false);

  // お気に入り
  const [editFavId,    setEditFavId]    = useState<string | null>(null);
  const [showFavForm,  setShowFavForm]  = useState(false);
  const [favForm, setFavForm] = useState<Omit<FavoriteItem, "id">>({
    label: "", item: "", amount: undefined, store: "",
    category: categories[0]?.label ?? "",
    paymentMethod: paymentMethods[0] ?? "現金", isEssential: true,
  });

  // 固定費
  const [editFixedId,   setEditFixedId]   = useState<string | null>(null);
  const [showFixedForm, setShowFixedForm] = useState(false);

  // 支払い方法
  const [newPayment, setNewPayment] = useState("");

  // ── お気に入り操作 ──────────────────────────────────────
  const openAddFav = () => {
    setEditFavId(null);
    setFavForm({ label: "", item: "", amount: undefined, store: "", category: categories[0]?.label ?? "", paymentMethod: paymentMethods[0] ?? "現金", isEssential: true });
    setShowFavForm(true);
  };
  const openEditFav = (fav: FavoriteItem) => {
    setEditFavId(fav.id);
    setFavForm({ label: fav.label, item: fav.item, amount: fav.amount, store: fav.store, category: fav.category, paymentMethod: fav.paymentMethod, isEssential: fav.isEssential });
    setShowFavForm(true);
  };
  const saveFav = () => {
    if (!favForm.item) return;
    // 品名をそのままラベルとして使う（表示名は廃止）
    const saving = { ...favForm, label: favForm.item };
    if (editFavId) setFavorites(favorites.map((f) => f.id === editFavId ? { ...saving, id: editFavId } : f));
    else           setFavorites([...favorites, { ...saving, id: Date.now().toString() }]);
    setShowFavForm(false);
    setEditFavId(null);
  };

  // ── 固定費操作 ──────────────────────────────────────────
  const openAddFixed  = () => { setEditFixedId(null); setShowFixedForm(true); };
  const openEditFixed = (id: string) => { setEditFixedId(id); setShowFixedForm(true); };
  const saveFixed = (fe: FixedExpense) => {
    if (editFixedId) setFixedExpenses(fixedExpenses.map((f) => f.id === editFixedId ? fe : f));
    else             setFixedExpenses([...fixedExpenses, fe]);
    setShowFixedForm(false);
    setEditFixedId(null);
  };
  const deleteFixed = (id: string) => setFixedExpenses(fixedExpenses.filter((f) => f.id !== id));

  // 支払い方法
  const addPayment = () => {
    const t = newPayment.trim();
    if (t && !paymentMethods.includes(t)) { setPaymentMethods([...paymentMethods, t]); setNewPayment(""); }
  };

  return (
    <div className="p-4 pb-6 space-y-3">
      <div className="pt-2 pb-1">
        <p className="text-xs text-muted-foreground tracking-widest">環境設定</p>
        <h1 className="text-xl font-semibold mt-0.5">設定</h1>
      </div>

      {/* ── 保存状態 ── */}
      <div className="rounded-2xl bg-card border border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground tracking-widest mb-1">保存状態</p>
        <p className="text-sm font-medium">{syncMessage}</p>
      </div>

      {/* ── ダークモード ── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-[10px] text-muted-foreground tracking-widest">表示設定</p>
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? "bg-indigo-500/15" : "bg-yellow-400/15"}`}>
              {dark ? <Moon size={15} className="text-indigo-400" strokeWidth={1.8} />
                    : <Sun  size={15} className="text-yellow-500" strokeWidth={1.8} />}
            </div>
            <div>
              <p className="text-sm font-medium">{dark ? "ダークモード" : "ライトモード"}</p>
              <p className="text-[10px] text-muted-foreground">画面テーマを切り替え</p>
            </div>
          </div>
          <button onClick={() => setDark(!dark)}
            className="relative w-11 h-6 rounded-full transition-colors duration-300"
            style={{ background: dark ? "#34d399" : "#d1d5db" }}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${dark ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* ── カテゴリー ── */}
      <Section title="カテゴリー" count={categories.length} onAdd={() => setShowCatForm(true)} addLabel="カテゴリーを追加">
        <DraggableCats categories={categories} setCategories={setCategories} />
        {showCatForm && (
          <CatAddForm categories={categories} setCategories={(c) => { setCategories(c); setShowCatForm(false); }} onClose={() => setShowCatForm(false)} />
        )}
      </Section>

      {/* ── お気に入り品目 ── */}
      <Section title="お気に入り品目" count={favorites.length} onAdd={openAddFav} addLabel="お気に入りを追加">
        {favorites.length === 0 && !showFavForm && (
          <p className="text-xs text-muted-foreground text-center py-4">まだ登録されていません</p>
        )}
        {favorites.map((fav) => {
          const catIcon = categories.find((c) => c.label === fav.category)?.icon ?? "Package";
          return (
            <div key={fav.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <CategoryIcon icon={catIcon} size={14} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{fav.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {fav.category}{fav.store ? ` · ${fav.store}` : ""}{fav.amount != null ? ` · ${yen(fav.amount)}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditFav(fav)} className="p-1.5 text-muted-foreground hover:text-foreground text-xs">編集</button>
                <button onClick={() => setFavorites(favorites.filter((f) => f.id !== fav.id))} className="p-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {/* お気に入り追加・編集フォーム */}
        {showFavForm && (
          <div className="p-4 border-t border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">{editFavId ? "編集" : "新規追加"}</p>
              <button onClick={() => setShowFavForm(false)} className="text-muted-foreground"><X size={14} /></button>
            </div>
            {[
              { label: "品名",   key: "item",  ph: "コンビニ・スーパー" },
              { label: "店舗名", key: "store", ph: "イオン" },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                <input type="text" value={(favForm as any)[key]}
                  onChange={(e) => setFavForm({ ...favForm, [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/40" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">金額（任意）</p>
                <input type="number" value={favForm.amount ?? ""}
                  onChange={(e) => setFavForm({ ...favForm, amount: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder="0"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground"
                  style={{ fontFamily: "'DM Mono', monospace" }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">カテゴリー</p>
                <select value={favForm.category} onChange={(e) => setFavForm({ ...favForm, category: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground">
                  {categories.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">支払い方法</p>
                <select value={favForm.paymentMethod} onChange={(e) => setFavForm({ ...favForm, paymentMethod: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground">
                  {paymentMethods.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">種別</p>
                <div className="flex gap-1 h-[36px]">
                  <button onClick={() => setFavForm({ ...favForm, isEssential: true })}
                    className={`flex-1 rounded-xl text-[11px] font-medium border ${favForm.isEssential ? "border-blue-500/40 bg-blue-500/15 text-blue-400" : "border-border text-muted-foreground"}`}>必需品</button>
                  <button onClick={() => setFavForm({ ...favForm, isEssential: false })}
                    className={`flex-1 rounded-xl text-[11px] font-medium border ${!favForm.isEssential ? "border-pink-500/40 bg-pink-500/15 text-pink-400" : "border-border text-muted-foreground"}`}>娯楽</button>
                </div>
              </div>
            </div>
            <button onClick={saveFav} disabled={!favForm.item}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>
              <Check size={12} className="inline mr-1.5" />{editFavId ? "変更を保存" : "追加する"}
            </button>
          </div>
        )}
      </Section>

      {/* ── 固定費 ── */}
      <Section title="固定費" count={fixedExpenses.length} onAdd={openAddFixed} addLabel="固定費を追加">
        {fixedExpenses.length === 0 && !showFixedForm && (
          <p className="text-xs text-muted-foreground text-center py-4">まだ登録されていません</p>
        )}
        {fixedExpenses.map((fe) => {
          const catIcon = categories.find((c) => c.label === fe.category)?.icon ?? "Package";
          return (
            <div key={fe.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <CategoryIcon icon={catIcon} size={14} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{fe.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {yen(fe.amount)} · 毎月{fe.dayOfMonth}日 · {fe.category}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditFixed(fe.id)} className="p-1.5 text-muted-foreground hover:text-foreground text-xs">編集</button>
                <button onClick={() => deleteFixed(fe.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {showFixedForm && (
          <FixedExpenseForm
            initial={editFixedId ? fixedExpenses.find((f) => f.id === editFixedId) : undefined}
            categories={categories}
            paymentMethods={paymentMethods}
            onSave={saveFixed}
            onClose={() => { setShowFixedForm(false); setEditFixedId(null); }}
          />
        )}
      </Section>

      {/* ── 支払い方法 ── */}
      <Section title="支払い方法" count={paymentMethods.length}>
        {paymentMethods.map((pm, i) => {
          const Icon = getPaymentIcon(pm);
          return (
            <div key={pm} className={`flex items-center gap-3 px-4 py-3 ${i < paymentMethods.length - 1 ? "border-b border-border/50" : ""}`}>
              <Icon size={15} strokeWidth={1.8} className="text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm">{pm}</span>
              <button onClick={() => { if (paymentMethods.length > 1) setPaymentMethods(paymentMethods.filter((p) => p !== pm)); }}
                disabled={paymentMethods.length <= 1}
                className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          <input type="text" value={newPayment}
            onChange={(e) => setNewPayment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPayment()}
            placeholder="支払い方法を追加..."
            className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 text-foreground" />
          <button onClick={addPayment} disabled={!newPayment.trim()}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>
            追加
          </button>
        </div>
      </Section>

      <p className="text-center text-[10px] text-muted-foreground pt-2">家計簿アプリ v1.0.0</p>
    </div>
  );
}
