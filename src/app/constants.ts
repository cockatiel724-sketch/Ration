// ============================================================
// src/app/constants.ts
// ============================================================

import {
  // アイコンピッカー用に50種をここでも import
  UtensilsCrossed, ShoppingCart, Shirt,        Gamepad2,      Pill,
  Home,            Zap,          Smartphone,    Plane,         Car,
  Music,           BookOpen,     Dumbbell,      PawPrint,      Leaf,
  Coffee,          Gift,         Laptop,        GraduationCap, Wrench,
  Palette,         Wallet,       Heart,         Baby,          Camera,
  Bike,            Bus,          Train,         Pizza,         Beef,
  Wine,            Beer,         Scissors,      Hammer,        Tv,
  Headphones,      Globe,        Umbrella,      Sun,           Star,
  Package,         Banknote,     Building2,     Mountain,      ShoppingBag,
  Briefcase,       Clock,        MapPin,        Trophy,        Flower2,
  // 収入カテゴリー・支払い方法アイコン
  CreditCard,      Landmark,     TrendingUp,
} from "lucide-react";

import type { IncomeCategory, LucideIcon, FavoriteItem, Transaction, UserCategory } from "./types";

// ─── アイコンピッカー用リスト（設定画面・50種） ───────────────
// NOTE: アイコンの描画は CategoryIcon.tsx が担当するため
//       ICON_MAP はそちらに定義してある

export const CATEGORY_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: "UtensilsCrossed", Icon: UtensilsCrossed },
  { key: "ShoppingCart",    Icon: ShoppingCart    },
  { key: "Shirt",           Icon: Shirt           },
  { key: "Gamepad2",        Icon: Gamepad2        },
  { key: "Pill",            Icon: Pill            },
  { key: "Home",            Icon: Home            },
  { key: "Zap",             Icon: Zap             },
  { key: "Smartphone",      Icon: Smartphone      },
  { key: "Plane",           Icon: Plane           },
  { key: "Car",             Icon: Car             },
  { key: "Music",           Icon: Music           },
  { key: "BookOpen",        Icon: BookOpen        },
  { key: "Dumbbell",        Icon: Dumbbell        },
  { key: "PawPrint",        Icon: PawPrint        },
  { key: "Leaf",            Icon: Leaf            },
  { key: "Coffee",          Icon: Coffee          },
  { key: "Gift",            Icon: Gift            },
  { key: "Laptop",          Icon: Laptop          },
  { key: "GraduationCap",   Icon: GraduationCap   },
  { key: "Wrench",          Icon: Wrench          },
  { key: "Palette",         Icon: Palette         },
  { key: "Wallet",          Icon: Wallet          },
  { key: "Heart",           Icon: Heart           },
  { key: "Baby",            Icon: Baby            },
  { key: "Camera",          Icon: Camera          },
  { key: "Bike",            Icon: Bike            },
  { key: "Bus",             Icon: Bus             },
  { key: "Train",           Icon: Train           },
  { key: "Pizza",           Icon: Pizza           },
  { key: "Beef",            Icon: Beef            },
  { key: "Wine",            Icon: Wine            },
  { key: "Beer",            Icon: Beer            },
  { key: "Scissors",        Icon: Scissors        },
  { key: "Hammer",          Icon: Hammer          },
  { key: "Tv",              Icon: Tv              },
  { key: "Headphones",      Icon: Headphones      },
  { key: "Globe",           Icon: Globe           },
  { key: "Umbrella",        Icon: Umbrella        },
  { key: "Sun",             Icon: Sun             },
  { key: "Star",            Icon: Star            },
  { key: "Package",         Icon: Package         },
  { key: "Banknote",        Icon: Banknote        },
  { key: "Building2",       Icon: Building2       },
  { key: "Mountain",        Icon: Mountain        },
  { key: "ShoppingBag",     Icon: ShoppingBag     },
  { key: "Briefcase",       Icon: Briefcase       },
  { key: "Clock",           Icon: Clock           },
  { key: "MapPin",          Icon: MapPin          },
  { key: "Trophy",          Icon: Trophy          },
  { key: "Flower2",         Icon: Flower2         },
];

// ─── デフォルトカテゴリー ────────────────────────────────────

export const DEFAULT_CATEGORIES: UserCategory[] = [
  { id: "c1", label: "食費",   icon: "UtensilsCrossed" }, // ナイフ＆フォーク
  { id: "c2", label: "日用品", icon: "ShoppingCart"    }, // カート
  { id: "c3", label: "衣服",   icon: "Shirt"           }, // シャツ
  { id: "c4", label: "娯楽",   icon: "Gamepad2"        }, // ゲームコントローラー
  { id: "c5", label: "医療",   icon: "Pill"            }, // 薬
  { id: "c6", label: "家賃",   icon: "Home"            }, // 家
  { id: "c7", label: "光熱費", icon: "Zap"             }, // 稲妻
  { id: "c8", label: "通信費", icon: "Smartphone"      }, // スマートフォン
];

// ─── カラーパレット ──────────────────────────────────────────

export const CATEGORY_COLOR_PALETTE = [
  "#34d399","#60a5fa","#f472b6","#fb923c",
  "#a78bfa","#facc15","#f87171","#38bdf8",
  "#4ade80","#e879f9","#fbbf24","#94a3b8",
];

export function buildCategoryColorMap(cats: UserCategory[]): Record<string, string> {
  const map: Record<string, string> = {};
  cats.forEach((c, i) => { map[c.label] = CATEGORY_COLOR_PALETTE[i % CATEGORY_COLOR_PALETTE.length]; });
  return map;
}

export function buildCategoryIconMap(cats: UserCategory[]): Record<string, string> {
  const map: Record<string, string> = {};
  cats.forEach((c) => { map[c.label] = c.icon; });
  return map;
}

// ─── 収入カテゴリー（固定） ──────────────────────────────────

export const INCOME_CATEGORIES: IncomeCategory[] = ["給与","副業","投資","贈り物","その他"];

export const INCOME_CATEGORY_COLORS: Record<IncomeCategory, string> = {
  給与: "#60a5fa", 副業: "#34d399", 投資: "#facc15", 贈り物: "#f472b6", その他: "#94a3b8",
};

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, LucideIcon> = {
  給与: Briefcase, 副業: TrendingUp, 投資: Landmark, 贈り物: Gift, その他: Package,
};

// ─── デフォルト値 ────────────────────────────────────────────

export const DEFAULT_PAYMENT_METHODS = ["現金","クレジットカード","電子マネー","デビットカード"];

// 固定費のデフォルト（初期状態は空）
export const DEFAULT_FIXED_EXPENSES: import("./types").FixedExpense[] = [];

export const DEFAULT_FAVORITES: FavoriteItem[] = [
  { id:"f1", label:"コンビニ", item:"コンビニ", store:"セブンイレブン", category:"食費", paymentMethod:"電子マネー",       isEssential:false },
  { id:"f2", label:"スーパー", item:"スーパー", store:"イオン",         category:"食費", paymentMethod:"クレジットカード", isEssential:true  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id:"1",  date:"2024-06-25", amount:1240,   item:"コンビニ",     store:"セブンイレブン", category:"食費",   subcategory:"", paymentMethod:"電子マネー",       isEssential:false, type:"expense" },
  { id:"2",  date:"2024-06-25", amount:4500,   item:"スーパー",     store:"イオン",         category:"食費",   subcategory:"", paymentMethod:"クレジットカード", isEssential:true,  type:"expense" },
  { id:"3",  date:"2024-06-24", amount:2800,   item:"映画チケット", store:"TOHOシネマズ",   category:"娯楽",   subcategory:"", paymentMethod:"クレジットカード", isEssential:false, type:"expense" },
  { id:"4",  date:"2024-06-23", amount:3200,   item:"薬局",         store:"マツモトキヨシ", category:"医療",   subcategory:"", paymentMethod:"現金",             isEssential:true,  type:"expense" },
  { id:"5",  date:"2024-06-22", amount:12000,  item:"電気代",       store:"東京電力",       category:"光熱費", subcategory:"", paymentMethod:"クレジットカード", isEssential:true,  type:"expense" },
  { id:"6",  date:"2024-06-21", amount:6800,   item:"焼肉ランチ",   store:"焼肉きんぐ",     category:"娯楽",   subcategory:"", paymentMethod:"クレジットカード", isEssential:false, type:"expense" },
  { id:"7",  date:"2024-06-19", amount:3400,   item:"日用品",       store:"コスモス",       category:"日用品", subcategory:"", paymentMethod:"電子マネー",       isEssential:true,  type:"expense" },
  { id:"8",  date:"2024-06-18", amount:980,    item:"カフェ",       store:"スターバックス", category:"食費",   subcategory:"", paymentMethod:"電子マネー",       isEssential:false, type:"expense" },
  { id:"9",  date:"2024-06-15", amount:22000,  item:"ジム月会費",   store:"エニタイム",     category:"娯楽",   subcategory:"", paymentMethod:"クレジットカード", isEssential:false, type:"expense" },
  { id:"10", date:"2024-06-25", amount:250000, item:"給与",         store:"株式会社〇〇",   category:"給与",   subcategory:"", paymentMethod:"",                 isEssential:true,  type:"income"  },
];

// ─── 日付ユーティリティ ─────────────────────────────────────

export const formatLocalDate = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const TODAY = formatLocalDate();

// ─── 金額フォーマット ────────────────────────────────────────

export const yen    = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
export const commas = (n: number) => n.toLocaleString("ja-JP");

// ─── データ集計 ──────────────────────────────────────────────

// isReceiptMeta=true（レシート親行・表示専用）は集計から除外する
const forStats = (txs: Transaction[]) => txs.filter((t) => !t.isReceiptMeta);

// カレンダー・履歴一覧用：親行（_main）は残す（表示に使う）
export const groupByDate = (txs: Transaction[]): Record<string, Transaction[]> =>
  txs.reduce<Record<string, Transaction[]>>((acc, t) => { (acc[t.date] ||= []).push(t); return acc; }, {});

export const buildPieData = (txs: Transaction[]) => {
  const map: Record<string, number> = {};
  // isReceiptMeta を除外して集計
  forStats(txs).filter((t) => t.type === "expense").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

// ─── 月操作 ──────────────────────────────────────────────────

export const getMonthKey   = (date: string) => date.slice(0, 7);
export const getMonthLabel = (key: string)  => { const [y, m] = key.split("-"); return `${y}年${Number(m)}月`; };
export const daysInMonth   = (key: string)  => { const [y, m] = key.split("-").map(Number); return new Date(y, m, 0).getDate(); };

export const buildDailyData = (txs: Transaction[], monthKey: string) =>
  Array.from({ length: daysInMonth(monthKey) }, (_, i) => {
    const day  = i + 1;
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    return {
      day: String(day),
      amount: forStats(txs).filter((t) => t.date === date && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

export const buildMonthlyData = (txs: Transaction[], monthOptions: string[]) =>
  [...monthOptions].slice(0, 12).reverse().map((key) => {
    const [, m] = key.split("-");
    return {
      month:  `${Number(m)}月`,
      amount: forStats(txs).filter((t) => t.date.startsWith(key) && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

// ─── 支払い方法アイコン ──────────────────────────────────────

export function getPaymentIcon(method: string): LucideIcon {
  if (method === "現金")           return Banknote;
  if (method === "クレジットカード") return CreditCard;
  if (method === "電子マネー")      return Smartphone;
  if (method === "デビットカード")   return Wallet;
  return CreditCard;
}
