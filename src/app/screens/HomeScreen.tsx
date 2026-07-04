// ============================================================
// src/app/screens/HomeScreen.tsx
// ホーム画面（ダッシュボード）
// ============================================================

import { useState, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { LogOut, Trash2, ReceiptText, ChevronDown, ChevronUp } from "lucide-react";
import type { User } from "firebase/auth";

import type { Transaction } from "../types";
import { yen } from "../constants";
import { CategoryIcon } from "../components/CategoryIcon";

// ─── Props ───────────────────────────────────────────────────

interface HomeScreenProps {
  monthLabel: string;
  total: number;
  essential: number;
  leisure: number;
  pieData: { name: string; value: number }[];
  dailyData: { day: string; amount: number }[];
  monthlyData: { month: string; amount: number }[];
  recentTxs: Transaction[];
  categoryColorMap: Record<string, string>;
  categoryIconMap: Record<string, string>;
  allTransactions: Transaction[]; // 内訳行の検索用
  dark: boolean;
  user: User;
  onLogout: () => void;
  onDelete: (id: string) => void;
  monthKey: string;
  monthOptions: string[];
  onChangeMonth: (key: string) => void;
}

// ─── スワイプ削除行 ───────────────────────────────────────────

interface SwipeableRowProps {
  t: Transaction;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDeleteRequest: () => void;
  color: string;
  icon: string;
  allTransactions: Transaction[];
  categoryColorMap: Record<string, string>;
  categoryIconMap: Record<string, string>;
}

/** IDからタイムスタンププレフィックスを取り出す（例: "1234567890_main" → "1234567890"） */
function getPrefix(id: string) { return id.replace(/_main$/, "").replace(/_line\d+$/, ""); }

/** このトランザクションがレシート親行か */
function isReceiptMain(t: Transaction) { return t.id.endsWith("_main"); }

function SwipeableRow({ t, isOpen, onOpen, onClose, onDeleteRequest, color, icon, allTransactions, categoryColorMap, categoryIconMap }: SwipeableRowProps) {
  const DELETE_W   = 72;
  const startX     = useRef(0);
  const startY     = useRef(0);
  const isDragging = useRef(false);
  const rowRef     = useRef<HTMLDivElement>(null);
  const [showLines, setShowLines] = useState(false);

  // 内訳行（同じプレフィックスの _line* を抽出）
  const prefix    = getPrefix(t.id);
  const lineItems = isReceiptMain(t)
    ? allTransactions.filter((tx) => tx.id.startsWith(`${prefix}_line`))
    : [];
  const hasLines  = lineItems.length > 0;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const handleMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy)) { isDragging.current = true; e.preventDefault(); }
    };
    el.addEventListener("touchmove", handleMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleMove);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) onOpen(); else if (dx > 20) onClose();
  };
  const onMouseDown = (e: React.MouseEvent) => { startX.current = e.clientX; };
  const onMouseUp   = (e: React.MouseEvent) => {
    const dx = e.clientX - startX.current;
    if (dx < -40) onOpen(); else if (dx > 20) onClose();
  };

  return (
    <div className="relative overflow-hidden">
      {/* 削除ボタン */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive transition-all duration-200"
        style={{ width: isOpen ? DELETE_W : 0 }}
      >
        {isOpen && (
          <button onClick={onDeleteRequest} className="flex flex-col items-center gap-1 text-white w-full h-full justify-center">
            <Trash2 size={16} strokeWidth={2} />
            <span className="text-[9px] font-medium">削除</span>
          </button>
        )}
      </div>

      {/* 行本体 */}
      <div
        ref={rowRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className="flex items-center gap-3 px-4 py-3 bg-card transition-transform duration-200 cursor-grab active:cursor-grabbing select-none"
        style={{ transform: isOpen ? `translateX(-${DELETE_W}px)` : "translateX(0)" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <CategoryIcon icon={icon} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium truncate">{t.item}</p>
            {/* レシートアイコン（内訳ありの親行のみ） */}
            {hasLines && (
              <ReceiptText size={13} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t.store || t.category} · {t.date.slice(8)}日
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm font-semibold tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
            {yen(t.amount)}
          </span>
          {/* 内訳展開ボタン */}
          {hasLines && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowLines((v) => !v); }}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              {showLines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* 内訳展開パネル */}
      {hasLines && showLines && (
        <div className="bg-muted/40 border-t border-border px-4 py-2 space-y-1.5">
          {lineItems.map((line) => (
            <div key={line.id} className="flex items-center gap-2 py-1">
              <div className="w-1 h-full self-stretch flex-shrink-0 flex items-center">
                <div className="w-px h-full bg-border" style={{ minHeight: 16 }} />
              </div>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${categoryColorMap?.[line.category] ?? "#94a3b8"}18` }}>
                <CategoryIcon icon={categoryIconMap?.[line.category] ?? "Package"} size={12}
                  style={{ color: categoryColorMap?.[line.category] ?? "#94a3b8" }} />
              </div>
              <span className="flex-1 text-xs truncate">{line.item}</span>
              <span className="text-[10px] text-muted-foreground">{line.category}</span>
              <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                {yen(line.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────

export function HomeScreen({
  monthLabel, total, essential, leisure,
  pieData, dailyData, monthlyData, recentTxs,
  categoryColorMap, categoryIconMap, allTransactions,
  dark, user, onLogout, onDelete,
  monthKey, monthOptions, onChangeMonth,
}: HomeScreenProps) {
  const pieTotal = pieData.reduce((s, e) => s + e.value, 0);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [confirmTx,   setConfirmTx]   = useState<Transaction | null>(null);
  const initials = (user.displayName || user.email || "U").slice(0, 1).toUpperCase();

  const FALLBACK_COLOR = "#94a3b8";
  const FALLBACK_ICON = "Package";

  return (
    <div className="p-4 space-y-3 pb-6">

      {/* ── ヘッダー ── */}
      <div className="pt-2 pb-1 flex items-start justify-between gap-3">
        <div>
          <select
            value={monthKey}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="text-xs bg-transparent font-medium outline-none"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m.replace("-", "年")}月</option>
            ))}
          </select>
          <h1 className="text-xl font-semibold mt-1">家計</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-10 w-10 overflow-hidden rounded-full border border-border bg-card text-sm font-semibold text-primary"
          >
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
              : <span className="text-xs">{user.email === "demo@ration-app.com" ? "ゲスト" : initials}</span>}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-10 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
              <div className="px-3 py-2">
                {user.email === "demo@ration-app.com" ? (
                  <>
                    <p className="text-sm font-medium">ゲストユーザー</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      デモ用アカウントで閲覧中
                    </p>
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">{user.displayName || "Rationユーザー"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                  </>
                )}
              </div>
              <button
                onClick={onLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut size={14} />ログアウト
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 支出合計カード ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-2 w-20 h-20 rounded-full bg-white/5" />
        <p className="text-xs text-white/70 mb-1 tracking-widest">支出合計</p>
        <p className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
          {yen(total)}
        </p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-[10px] text-white/60 tracking-widest">必需品</p>
            <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(essential)}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-[10px] text-white/60 tracking-widest">娯楽</p>
            <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(leisure)}</p>
          </div>
        </div>
      </div>

      {/* ── カテゴリー別円グラフ ── */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-3">カテゴリー別</h2>
        <div className="flex flex-col">
          {/* 円グラフ */}
          <div style={{ width: 140, height: 140 }} className="mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {pieData.map((e) => (
                    <Cell key={e.name} fill={categoryColorMap[e.name] ?? FALLBACK_COLOR} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 凡例（全カテゴリー・縦並び） */}
          <div className="space-y-2 mt-3">
            {pieData.map((e) => {
              const pct    = Math.round((e.value / pieTotal) * 100);
              const color  = categoryColorMap[e.name] ?? FALLBACK_COLOR;
              const iconKey = categoryIconMap[e.name] ?? FALLBACK_ICON;
              return (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <CategoryIcon icon={iconKey} size={12} style={{ color }} />
                      <span className="text-[11px] text-muted-foreground">{e.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {yen(e.value)}
                      </span>
                      <span className="text-[10px] font-semibold w-7 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 日別推移 ── */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-3">日別推移</h2>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false}
              ticks={Array.from({ length: 16 }, (_, i) => String(i * 2 + 1))} />
            <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} width={48}
              tickFormatter={(v: number) => v.toLocaleString("ja-JP")} />
            <Tooltip cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              formatter={(v: number) => [yen(v), "支出"]}
              contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]} fill={dark ? "#34d399" : "#059669"} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 月別推移 ── */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-3">月別推移</h2>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} width={48}
              tickFormatter={(v: number) => v.toLocaleString("ja-JP")} />
            <Tooltip cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              formatter={(v: number) => [yen(v), "支出"]}
              contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]} fill={dark ? "#60a5fa" : "#2563eb"} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 最近の支出リスト ── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground">最近の支出</h2>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">← 左にスワイプで削除</p>
        </div>
        <div className="divide-y divide-border">
          {recentTxs.map((t) => (
            <SwipeableRow
              key={t.id}
              t={t}
              isOpen={openSwipeId === t.id}
              onOpen={() => setOpenSwipeId(t.id)}
              onClose={() => setOpenSwipeId(null)}
              onDeleteRequest={() => { setOpenSwipeId(null); setConfirmTx(t); }}
              color={categoryColorMap[t.category] ?? FALLBACK_COLOR}
              icon={categoryIconMap[t.category] ?? FALLBACK_ICON}
              allTransactions={allTransactions}
              categoryColorMap={categoryColorMap}
              categoryIconMap={categoryIconMap}
            />
          ))}
        </div>
      </div>

      {/* ── 削除確認ダイアログ ── */}
      {confirmTx && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmTx(null)}>
          <div className="w-full max-w-sm bg-card rounded-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-sm font-semibold">この支出を削除しますか？</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {confirmTx.item}{confirmTx.store ? ` · ${confirmTx.store}` : ""} · {yen(confirmTx.amount)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTx(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium bg-muted text-foreground">
                キャンセル
              </button>
              <button
                onClick={() => { onDelete(confirmTx.id); setConfirmTx(null); }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-destructive text-white">
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
