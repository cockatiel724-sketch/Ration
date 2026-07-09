// ============================================================
// src/app/screens/HistoryScreen.tsx
// 分析画面（カレンダー / グラフ タブ）
// ============================================================

import { useState, useRef, useEffect } from "react";
import { X, TrendingUp, Trash2, ReceiptText, ChevronDown, ChevronUp } from "lucide-react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";

import type { Transaction } from "../types";
import { INCOME_CATEGORY_COLORS, yen, commas, getMonthLabel, daysInMonth, TODAY } from "../constants";
import { CategoryIcon } from "../components/CategoryIcon";

// ─── Props ───────────────────────────────────────────────────

interface HistoryScreenProps {
  monthKey: string;
  monthOptions: string[];
  onChangeMonth: (key: string) => void;
  byDate: Record<string, Transaction[]>;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  onDelete: (id: string) => void;
  categoryColorMap: Record<string, string>;
  categoryIconMap:  Record<string, string>;
  allTransactions:  Transaction[];
}

// ─── 共通ユーティリティ ──────────────────────────────────────

/** 数値を "250,000" 形式にフォーマット（グラフ軸用） */
const fmtY = (v: number) => v.toLocaleString("ja-JP");

/** 通算/月別トグル */
function ModeToggle({ mode, onChange }: { mode: "month" | "all"; onChange: (m: "month" | "all") => void }) {
  return (
    <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
      {(["month", "all"] as const).map((m) => (
        <button key={m} onClick={() => onChange(m)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
            mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}>
          {m === "month" ? "月別" : "通算"}
        </button>
      ))}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 10, fontSize: 11,
};

// ─── スワイプ削除行 ───────────────────────────────────────────

function getPrefix(id: string) { return id.replace(/_main$/, "").replace(/_line\d+$/, ""); }
function isReceiptMain(t: Transaction) { return t.id.endsWith("_main"); }

function SwipeRow({ t, isOpen, onOpen, onClose, onDeleteRequest, color, icon, allTransactions, categoryColorMap, categoryIconMap }: {
  t: Transaction; isOpen: boolean;
  onOpen: () => void; onClose: () => void; onDeleteRequest: () => void;
  color: string; icon: string;
  allTransactions: Transaction[];
  categoryColorMap: Record<string, string>;
  categoryIconMap: Record<string, string>;
}) {
  const DELETE_W = 72;
  const startX = useRef(0); const startY = useRef(0); const isDragging = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLines, setShowLines] = useState(false);

  const prefix    = getPrefix(t.id);
  const lineItems = isReceiptMain(t)
    ? allTransactions.filter((tx) => tx.id.startsWith(`${prefix}_line`))
    : [];
  const hasLines  = lineItems.length > 0;

  useEffect(() => {
    const el = rowRef.current; if (!el) return;
    const h = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy)) { isDragging.current = true; e.preventDefault(); }
    };
    el.addEventListener("touchmove", h, { passive: false });
    return () => el.removeEventListener("touchmove", h);
  }, []);

  const onTS = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; isDragging.current = false; };
  const onTE = (e: React.TouchEvent) => { if (!isDragging.current) return; const dx = e.changedTouches[0].clientX - startX.current; if (dx < -40) onOpen(); else if (dx > 20) onClose(); };
  const onMD = (e: React.MouseEvent) => { startX.current = e.clientX; };
  const onMU = (e: React.MouseEvent) => { const dx = e.clientX - startX.current; if (dx < -40) onOpen(); else if (dx > 20) onClose(); };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive transition-all duration-200" style={{ width: isOpen ? DELETE_W : 0 }}>
        {isOpen && <button onClick={onDeleteRequest} className="flex flex-col items-center gap-1 text-white w-full h-full justify-center"><Trash2 size={15} strokeWidth={2} /><span className="text-[9px]">削除</span></button>}
      </div>

      {/* 行本体 */}
      <div ref={rowRef} onTouchStart={onTS} onTouchEnd={onTE} onMouseDown={onMD} onMouseUp={onMU}
        className="flex items-center gap-2.5 py-2.5 bg-card transition-transform duration-200 cursor-grab select-none"
        style={{ transform: isOpen ? `translateX(-${DELETE_W}px)` : "translateX(0)", paddingRight: isOpen ? 12 : 0 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          {t.type === "expense" && !t.isReceiptMeta ? <CategoryIcon icon={icon} size={14} style={{ color }} /> : <TrendingUp size={14} style={{ color: INCOME_CATEGORY_COLORS[t.category as keyof typeof INCOME_CATEGORY_COLORS] ?? "#60a5fa" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium truncate">{t.item}</p>
            {hasLines && <ReceiptText size={12} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{t.store ? `${t.store} · ` : ""}{t.category} · {t.paymentMethod || "―"}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="text-right">
            <p className={`text-sm font-semibold ${t.type === "income" ? "text-primary" : ""}`} style={{ fontFamily: "'DM Mono', monospace" }}>
              {t.type === "income" ? "+" : ""}{yen(t.amount)}
            </p>
            {t.type === "expense" && !t.isReceiptMeta && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.isEssential ? "bg-blue-500/15 text-blue-400" : "bg-pink-500/15 text-pink-400"}`}>
                {t.isEssential ? "必需品" : "娯楽"}
              </span>
            )}
          </div>
          {hasLines && (
            <button onClick={(e) => { e.stopPropagation(); setShowLines((v) => !v); }}
              className="p-1 text-muted-foreground hover:text-foreground ml-0.5">
              {showLines ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 内訳展開パネル */}
      {hasLines && showLines && (
        <div className="bg-muted/40 border-t border-border px-3 py-2 space-y-1.5">
          {lineItems.map((line) => {
            const lc = categoryColorMap[line.category] ?? "#94a3b8";
            const li = categoryIconMap[line.category]  ?? "Package";
            return (
              <div key={line.id} className="flex items-center gap-2 py-0.5">
                <div className="w-5 flex-shrink-0 flex justify-center">
                  <div className="w-px h-4 bg-border" />
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${lc}18` }}>
                  <CategoryIcon icon={li} size={11} style={{ color: lc }} />
                </div>
                <span className="flex-1 text-xs truncate">{line.item}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{line.category}</span>
                <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {yen(line.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── グラフ共通ヘッダー ──────────────────────────────────────

function ChartHeader({ title, mode, onChange, monthKey }: {
  title: string; mode: "month" | "all";
  onChange: (m: "month" | "all") => void; monthKey: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground">{title}</h2>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
          {mode === "month" ? getMonthLabel(monthKey) : "通算（全期間）"}
        </p>
      </div>
      <ModeToggle mode={mode} onChange={onChange} />
    </div>
  );
}

// ─── 1. カテゴリー内訳 ───────────────────────────────────────

function CategoryChart({ monthKey, allTransactions, categoryColorMap, categoryIconMap }: {
  monthKey: string; allTransactions: Transaction[];
  categoryColorMap: Record<string, string>; categoryIconMap: Record<string, string>;
}) {
  const [mode, setMode] = useState<"month" | "all">("month");
  const FALLBACK = "#94a3b8";

  const src = mode === "month"
    ? allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.date.startsWith(monthKey))
    : allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta);

  const total = src.reduce((s, t) => s + t.amount, 0);
  const map: Record<string, number> = {};
  src.forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
  const data = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  if (!data.length) return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="カテゴリー内訳" mode={mode} onChange={setMode} monthKey={monthKey} />
      <p className="text-xs text-muted-foreground text-center py-4">データがありません</p>
    </div>
  );

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="カテゴリー内訳" mode={mode} onChange={setMode} monthKey={monthKey} />
      <div style={{ height: 160 }} className="mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {data.map((e) => <Cell key={e.name} fill={categoryColorMap[e.name] ?? FALLBACK} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [yen(v), ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5">
        {data.map((e, i) => {
          const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
          const color = categoryColorMap[e.name] ?? FALLBACK;
          const icon  = categoryIconMap[e.name]  ?? "Package";
          return (
            <div key={e.name}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                  <CategoryIcon icon={icon} size={12} style={{ color }} />
                </div>
                <span className="flex-1 text-xs truncate">{e.name}</span>
                <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(e.value)}</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0">{pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden ml-10">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. 必需品 vs 娯楽 ───────────────────────────────────────

function EssentialLeisureChart({ monthKey, allTransactions }: { monthKey: string; allTransactions: Transaction[] }) {
  const [mode, setMode] = useState<"month" | "all">("month");

  const src = mode === "month"
    ? allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.date.startsWith(monthKey))
    : allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta);

  const essential = src.filter((t) => t.isEssential).reduce((s, t) => s + t.amount, 0);
  const leisure   = src.filter((t) => !t.isEssential).reduce((s, t) => s + t.amount, 0);
  const total     = essential + leisure;
  const ep = total > 0 ? Math.round((essential / total) * 100) : 0;
  const pieData = [
    { name: "必需品", value: essential, color: "#60a5fa" },
    { name: "娯楽",   value: leisure,   color: "#f472b6" },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="必需品 vs 娯楽" mode={mode} onChange={setMode} monthKey={monthKey} />
      {total === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">データがありません</p>
      ) : (
        <>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [yen(v), ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {pieData.map((d) => {
              const pct = Math.round((d.value / total) * 100);
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="flex-1 text-xs">{d.name}</span>
                  <span className="text-xs font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(d.value)}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 px-1">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>必需品 {ep}%</span><span>娯楽 {100 - ep}%</span>
            </div>
            <div className="h-2 rounded-full bg-pink-400/30 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${ep}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 3. 曜日別支出パターン ───────────────────────────────────

function DayOfWeekChart({ monthKey, allTransactions }: { monthKey: string; allTransactions: Transaction[] }) {
  const [mode, setMode] = useState<"month" | "all">("month");
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  const src = mode === "month"
    ? allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.date.startsWith(monthKey))
    : allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta);

  const dowMap = [0, 0, 0, 0, 0, 0, 0];
  src.forEach((t) => { dowMap[new Date(t.date + "T00:00:00").getDay()] += t.amount; });
  const data = DOW.map((d, i) => ({ day: d, amount: dowMap[i] }));
  const maxDay = data.reduce((m, d) => d.amount > m.amount ? d : m, data[0]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="曜日別支出パターン" mode={mode} onChange={setMode} monthKey={monthKey} />
      {maxDay.amount > 0 && (
        <p className="text-[9px] text-muted-foreground mb-2">
          最多: <span className="text-primary font-semibold">{maxDay.day}曜日</span> ({yen(maxDay.amount)})
        </p>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} width={68}
            tickFormatter={fmtY} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [yen(v), "支出"]} />
          <Bar dataKey="amount" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 4. 支払い方法別 ─────────────────────────────────────────

function PaymentMethodChart({ monthKey, allTransactions }: { monthKey: string; allTransactions: Transaction[] }) {
  const [mode, setMode] = useState<"month" | "all">("month");

  const src = mode === "month"
    ? allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.date.startsWith(monthKey))
    : allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta);

  const map: Record<string, number> = {};
  src.forEach((t) => { const k = t.paymentMethod || "未設定"; map[k] = (map[k] ?? 0) + t.amount; });
  const data  = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="支払い方法別" mode={mode} onChange={setMode} monthKey={monthKey} />
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">データがありません</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(80, data.length * 38)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false}
                tickFormatter={fmtY} width={68} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} width={88} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [yen(v), ""]} />
              <Bar dataKey="value" fill="#fb923c" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {data.map((p) => {
              const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
              return (
                <div key={p.name} className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground w-24 truncate flex-shrink-0">{p.name}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold w-20 text-right flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(p.value)}</span>
                  <span className="text-muted-foreground w-6 text-right flex-shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 5. 店舗別支出 ───────────────────────────────────────────

function StoreChart({ monthKey, allTransactions }: { monthKey: string; allTransactions: Transaction[] }) {
  const [mode, setMode] = useState<"month" | "all">("month");

  const src = mode === "month"
    ? allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.date.startsWith(monthKey) && t.store?.trim())
    : allTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta && t.store?.trim());

  const map: Record<string, { amount: number; count: number }> = {};
  src.forEach((t) => {
    const k = t.store.trim();
    if (!map[k]) map[k] = { amount: 0, count: 0 };
    map[k].amount += t.amount; map[k].count += 1;
  });
  const data  = Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount).slice(0, 10);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <ChartHeader title="店舗別支出" mode={mode} onChange={setMode} monthKey={monthKey} />
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">店舗名の記録がありません</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(100, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false}
                tickFormatter={fmtY} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number, _: string, entry: any) => [`${yen(v)}（${entry.payload.count}回）`, ""]} />
              <Bar dataKey="amount" fill="#34d399" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {data.map((s, i) => {
              const pct = total > 0 ? Math.round((s.amount / total) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-xs truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{s.count}回</span>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>{yen(s.amount)}</span>
                    <span className="text-[10px] text-muted-foreground w-7 text-right flex-shrink-0">{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden ml-5 mt-1">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 6. 値段順ランキング ─────────────────────────────────────
// 高い順 / 安い順 × 全体 / カテゴリー別 / 店舗別 で上位20件を表示

type SortOrder  = "desc" | "asc";
type GroupBy    = "all" | "category" | "store";
// "month"=月別, "all"=通算（複数でも含む）, "single"=単品（1回の購入記録で最高額）
type RankMode   = "month" | "all" | "single";

function RankingChart({ monthKey, allTransactions, categoryColorMap, categoryIconMap }: {
  monthKey: string; allTransactions: Transaction[];
  categoryColorMap: Record<string, string>; categoryIconMap: Record<string, string>;
}) {
  const [mode,    setMode]    = useState<RankMode>("month");
  const [order,   setOrder]   = useState<SortOrder>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("all");
  const [selected, setSelected] = useState<string>("");

  const FALLBACK_COLOR = "#94a3b8";
  const FALLBACK_ICON  = "Package";

  // 母集団（modeで切り替え）
  const src = (() => {
    const base = mode === "month"
      ? allTransactions.filter((t) => t.date.startsWith(monthKey))
      : allTransactions; // "all" も "single" も全期間から引く
    return base.filter((t) => t.type === "expense" && !t.isReceiptMeta);
  })();

  // 「単品」モード：同じ品名×店舗の組み合わせで1件ずつに集約（最高額を代表値として使用）
  const effectiveSrc = mode === "single"
    ? (() => {
        // 各トランザクションをそのまま使い、重複除去はしない
        // ※「単品」は「1回の購入記録で最高額のもの」なので全期間の個別レコードをそのまま使う
        return src;
      })()
    : src;

  const categories = [...new Set(effectiveSrc.map((t) => t.category))].sort();
  const stores     = [...new Set(effectiveSrc.map((t) => t.store).filter(Boolean))].sort();

  const filtered = effectiveSrc.filter((t) => {
    if (groupBy === "category") return selected ? t.category === selected : true;
    if (groupBy === "store")    return selected ? t.store    === selected : true;
    return true;
  });

  const ranked = [...filtered]
    .sort((a, b) => order === "desc" ? b.amount - a.amount : a.amount - b.amount)
    .slice(0, 20);

  // 1〜3位の◆バッジ色
  const MEDAL = [
    { color: "#B8860B", bg: "#FFF8DC", label: "1" }, // 金
    { color: "#6b7280", bg: "#F3F4F6", label: "2" }, // 銀
    { color: "#92400e", bg: "#FEF3C7", label: "3" }, // 銅
  ];

  const modeLabel: Record<RankMode, string> = {
    month: getMonthLabel(monthKey),
    all:   "通算（全期間）",
    single: "全期間・単品最高額",
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground">値段順ランキング</h2>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{modeLabel[mode]} · 上位20件</p>
        </div>
        {/* 月別 / 通算 / 単品 トグル */}
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {([["month","月別"],["all","通算"],["single","単品"]] as [RankMode,string][]).map(([v, label]) => (
            <button key={v} onClick={() => { setMode(v); setSelected(""); }}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                mode === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 高い順 / 安い順 × 全体 / カテゴリー / 店舗 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {([["desc","高い順"],["asc","安い順"]] as [SortOrder,string][]).map(([v, label]) => (
            <button key={v} onClick={() => setOrder(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                order === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>{label}</button>
          ))}
        </div>
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {([["all","全体"],["category","カテゴリー"],["store","店舗"]] as [GroupBy,string][]).map(([v, label]) => (
            <button key={v} onClick={() => { setGroupBy(v); setSelected(""); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                groupBy === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* 絞り込みセレクト */}
      {groupBy === "category" && categories.length > 0 && (
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground mb-3">
          <option value="">すべてのカテゴリー</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {groupBy === "store" && stores.length > 0 && (
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none text-foreground mb-3">
          <option value="">すべての店舗</option>
          {stores.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      {/* ランキングリスト */}
      {ranked.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">データがありません</p>
      ) : (
        <div className="space-y-2">
          {ranked.map((t, i) => {
            const color   = categoryColorMap[t.category] ?? FALLBACK_COLOR;
            const iconKey = categoryIconMap[t.category]  ?? FALLBACK_ICON;
            const rank    = i + 1;
            const medal   = MEDAL[i]; // 1〜3位のみ defined

            return (
              <div key={t.id} className="flex items-center gap-2.5">
                {/* 順位バッジ */}
                <div className="w-7 flex-shrink-0 flex items-center justify-center">
                  {medal ? (
                    // ◆バッジ（金・銀・銅）
                    <div className="relative flex items-center justify-center">
                      {/* ◆の形はrotateした正方形で表現 */}
                      <div style={{
                        width: 22, height: 22,
                        background: medal.bg,
                        border: `1.5px solid ${medal.color}`,
                        transform: "rotate(45deg)",
                        borderRadius: 3,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        position: "absolute",
                        fontSize: 9,
                        fontWeight: 700,
                        color: medal.color,
                        letterSpacing: "-0.5px",
                      }}>
                        {medal.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-muted-foreground w-full text-center">
                      {rank}
                    </span>
                  )}
                </div>

                {/* カテゴリーアイコン */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <CategoryIcon icon={iconKey} size={13} style={{ color }} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.item}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {t.store ? `${t.store} · ` : ""}{t.category} · {t.date}
                  </p>
                </div>

                {/* 金額 */}
                <span className="text-sm font-bold flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {yen(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── グラフ分析ビュー（全カード組み立て） ─────────────────────

function ChartView({ monthKey, monthOptions, allTransactions, categoryColorMap, categoryIconMap }: {
  monthKey: string; monthOptions: string[]; allTransactions: Transaction[];
  categoryColorMap: Record<string, string>; categoryIconMap: Record<string, string>;
}) {
  // 月別収支推移（直近6ヶ月・トグルなし）
  const last6 = [...monthOptions].slice(0, 6).reverse();
  const trendData = last6.map((ym) => {
    const [, m] = ym.split("-");
    const txs = allTransactions.filter((t) => t.date.startsWith(ym));
    return {
      month:   `${Number(m)}月`,
      income:  txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: txs.filter((t) => t.type === "expense" && !t.isReceiptMeta).reduce((s, t) => s + t.amount, 0),
      balance: txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
             - txs.filter((t) => t.type === "expense" && !t.isReceiptMeta).reduce((s, t) => s + t.amount, 0),
    };
  });

  return (
    <div className="space-y-3 pb-4">
      {/* 月別収支推移 */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">月別収支推移</h2>
        <p className="text-[9px] text-muted-foreground/60 mb-3">直近6ヶ月の収入・支出・収支</p>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={trendData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} axisLine={false} tickLine={false} width={72}
              tickFormatter={fmtY} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => yen(v)} />
            <Bar dataKey="income"  name="収入" fill="#60a5fa" radius={[3, 3, 0, 0]} barSize={12} />
            <Bar dataKey="expense" name="支出" fill="#34d399" radius={[3, 3, 0, 0]} barSize={12} />
            <Line dataKey="balance" name="収支" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 justify-center">
          {[["収入","#60a5fa"],["支出","#34d399"],["収支","#facc15"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span className="text-[10px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <CategoryChart     monthKey={monthKey} allTransactions={allTransactions} categoryColorMap={categoryColorMap} categoryIconMap={categoryIconMap} />
      <EssentialLeisureChart monthKey={monthKey} allTransactions={allTransactions} />
      <DayOfWeekChart    monthKey={monthKey} allTransactions={allTransactions} />
      <PaymentMethodChart monthKey={monthKey} allTransactions={allTransactions} />
      <StoreChart        monthKey={monthKey} allTransactions={allTransactions} />
      <RankingChart      monthKey={monthKey} allTransactions={allTransactions} categoryColorMap={categoryColorMap} categoryIconMap={categoryIconMap} />
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────

export function HistoryScreen({
  monthKey, monthOptions, onChangeMonth,
  byDate, selectedDate, setSelectedDate, onDelete,
  categoryColorMap, categoryIconMap, allTransactions,
}: HistoryScreenProps) {
  const [view, setView]         = useState<"calendar" | "chart">("calendar");
  const [year, month]           = monthKey.split("-").map(Number);
  const DAYS     = daysInMonth(monthKey);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const WD       = ["日", "月", "火", "水", "木", "金", "土"];

  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [confirmTx,   setConfirmTx]   = useState<Transaction | null>(null);
  const FALLBACK_COLOR = "#94a3b8";
  const FALLBACK_ICON  = "Package";

  // 月集計はallTransactionsから（_line*含む・isReceiptMeta除外）
  const allTxs       = allTransactions.filter((t) => t.date.startsWith(monthKey));
  const monthExpense = allTxs.filter((t) => t.type === "expense" && !t.isReceiptMeta).reduce((s, t) => s + t.amount, 0);
  const monthIncome  = allTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const balance      = monthIncome - monthExpense;
  // 支出日数は表示用byDate経由でOK（日付の存在チェックだけなので）
  const activeDays   = Object.keys(byDate).filter((d) => byDate[d].some((t) => t.type === "expense" && !t.isReceiptMeta)).length;
  const avgPerDay    = Math.round(monthExpense / DAYS);
  const validSelected = selectedDate && selectedDate.startsWith(monthKey) && byDate[selectedDate];

  return (
    <div className="pb-6 overflow-y-auto h-screen" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 space-y-3">

        {/* ── ヘッダー ── */}
        <div className="pt-2 pb-1">
          <select value={monthKey} onChange={(e) => { onChangeMonth(e.target.value); setSelectedDate(null); }}
            className="text-xs bg-transparent font-medium outline-none text-muted-foreground">
            {monthOptions.map((m) => <option key={m} value={m}>{m.replace("-", "年")}月</option>)}
          </select>
          <h1 className="text-xl font-semibold mt-0.5">分析</h1>
        </div>

        {/* ── 内部タブ（カレンダー / グラフ） ── */}
        <div className="flex bg-muted rounded-2xl p-1">
          {(["calendar", "chart"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              {v === "calendar" ? "カレンダー" : "グラフ"}
            </button>
          ))}
        </div>

        {/* ── カレンダービュー ── */}
        {view === "calendar" && (
          <>
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="grid grid-cols-3 divide-x divide-border">
                {[
                  { label: "収入", value: yen(monthIncome),  color: "text-foreground" },
                  { label: "支出", value: yen(monthExpense),  color: "text-foreground" },
                  { label: "収支", value: (balance >= 0 ? "+" : "") + yen(balance), color: balance >= 0 ? "text-primary" : "text-destructive" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center px-2 first:pl-0 last:pr-0">
                    <p className="text-[9px] text-muted-foreground tracking-widest mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`} style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border my-3" />
              <div className="grid grid-cols-2 divide-x divide-border">
                {[
                  { label: "支出日数", value: `${activeDays}日` },
                  { label: `平均 / 日（${DAYS}日）`, value: yen(avgPerDay) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center px-2 first:pl-0 last:pr-0">
                    <p className="text-[9px] text-muted-foreground tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-3">
              <div className="grid grid-cols-7 mb-1">
                {WD.map((d, i) => (
                  <div key={d} className={`text-center text-[10px] font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: DAYS }).map((_, i) => {
                  const day     = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayTxs  = byDate[dateStr] ?? [];
                  // 金額集計はallTransactionsから（_line*含む・_main=isReceiptMeta除外）
                  const allDayTxs = allTransactions.filter((t) => t.date === dateStr);
                  const dayExp  = allDayTxs.filter((t) => t.type === "expense" && !t.isReceiptMeta).reduce((s, t) => s + t.amount, 0);
                  const dayInc  = allDayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
                  const isSel   = selectedDate === dateStr;
                  const isToday = dateStr === TODAY;
                  return (
                    <button key={day}
                      onClick={() => { setSelectedDate(isSel ? null : dateStr); setOpenSwipeId(null); }}
                      className={`rounded-xl p-1 text-center transition-all min-h-[46px] flex flex-col items-center justify-center ${isSel ? "ring-1 ring-primary/60" : "hover:bg-muted/40"}`}
                      style={isSel ? { background: "rgba(52,211,153,0.15)" } : {}}>
                      <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                      {dayExp > 0 ? <span className="text-[8px] font-semibold mt-0.5 text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{commas(dayExp)}</span> : <span className="h-3" />}
                      {dayInc > 0 && <span className="text-[8px] font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>+{commas(dayInc)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {validSelected && (
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground tracking-widest">
                      {Number(selectedDate!.slice(5, 7))}月{Number(selectedDate!.slice(8, 10))}日の記録
                    </p>
                    <p className="text-lg font-bold mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {yen(allTransactions.filter((t) => t.date === selectedDate! && t.type === "expense" && !t.isReceiptMeta).reduce((s, t) => s + t.amount, 0))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-[9px] text-muted-foreground">← スワイプで削除</p>
                    <button onClick={() => setSelectedDate(null)} className="text-muted-foreground p-1 ml-1"><X size={16} /></button>
                  </div>
                </div>
                <div className="divide-y divide-border px-4">
                  {byDate[selectedDate!].map((t) => (
                    <SwipeRow key={t.id} t={t}
                      isOpen={openSwipeId === t.id}
                      onOpen={() => setOpenSwipeId(t.id)}
                      onClose={() => setOpenSwipeId(null)}
                      onDeleteRequest={() => { setOpenSwipeId(null); setConfirmTx(t); }}
                      color={categoryColorMap[t.category] ?? FALLBACK_COLOR}
                      icon={categoryIconMap[t.category]  ?? FALLBACK_ICON}
                      allTransactions={allTransactions}
                      categoryColorMap={categoryColorMap}
                      categoryIconMap={categoryIconMap}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── グラフビュー ── */}
        {view === "chart" && (
          <ChartView
            monthKey={monthKey} monthOptions={monthOptions}
            allTransactions={allTransactions}
            categoryColorMap={categoryColorMap} categoryIconMap={categoryIconMap}
          />
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {confirmTx && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmTx(null)}>
          <div className="w-full max-w-sm bg-card rounded-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-sm font-semibold">この記録を削除しますか？</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{confirmTx.item}{confirmTx.store ? ` · ${confirmTx.store}` : ""} · {yen(confirmTx.amount)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTx(null)} className="flex-1 py-3 rounded-2xl text-sm font-medium bg-muted text-foreground">キャンセル</button>
              <button onClick={() => { onDelete(confirmTx.id); setConfirmTx(null); }} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-destructive text-white">削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
