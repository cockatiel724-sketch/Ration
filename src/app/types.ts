// ============================================================
// src/app/types.ts
// ============================================================

import type { FC, SVGProps } from "react";

export type Tab = "home" | "history" | "record" | "settings";
export type RecordType = "expense" | "income";

export interface UserCategory {
  id: string;
  label: string;
  icon: string;
}

export type IncomeCategory = "給与" | "副業" | "投資" | "贈り物" | "その他";

export type LucideIcon = FC<
  SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; className?: string }
>;

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  item: string;
  store: string;
  category: string;
  subcategory: string;
  paymentMethod: string;
  isEssential: boolean;
  type: RecordType;
  fixedExpenseId?: string;
  /**
   * true のとき「レシート親行（表示専用）」として扱う。
   * 金額集計・グラフ分析からは除外し、
   * 内訳行（_line*）の合計として表示するためだけに使う。
   */
  isReceiptMeta?: boolean;
}

export interface FavoriteItem {
  id: string;
  label: string;
  item: string;
  amount?: number;
  store: string;
  category: string;
  paymentMethod: string;
  isEssential: boolean;
}

/**
 * 固定費（毎月自動で支出記録されるもの）
 * dayOfMonth: 毎月何日に記録するか（1〜31）
 */
export interface FixedExpense {
  id: string;
  label: string;        // 表示名（例：「家賃」「Netflix」）
  item: string;         // 品名
  amount: number;       // 金額（固定費なので必須・数値）
  store: string;        // 支払先
  category: string;
  paymentMethod: string;
  isEssential: boolean;
  dayOfMonth: number;   // 毎月何日に記録するか（1〜31）
}

export interface ExpenseForm {
  type: RecordType;
  date: string;
  amount: string;
  item: string;
  store: string;
  category: string;
  paymentMethod: string;
  isEssential: boolean;
  incomeCategory: IncomeCategory;
}

/** レシート内訳の1行 */
export interface ItemLine {
  id: string;
  item: string;
  amount: string;   // 入力中は文字列
  category: string;
  isEssential: boolean;
}
