// ============================================================
// src/app/components/CategoryIcon.tsx
// アイコンキー文字列から Lucide コンポーネントを引き出して描画する
//
// ポイント：ICON_MAP をこのファイル内に直接定義することで
// constants.ts への依存をなくし、モジュール読み込み問題を防ぐ
// ============================================================

import type { CSSProperties } from "react";
import {
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
} from "lucide-react";

// ─── アイコンマップ ───────────────────────────────────────────
// このファイルの中で完結させる（constants.ts に依存しない）

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; className?: string }>> = {
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
};

interface CategoryIconProps {
  icon: string;           // ICON_MAP のキー（例: "UtensilsCrossed"）
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function CategoryIcon({ icon, size = 16, className = "", style }: CategoryIconProps) {
  // icon が未定義・空・マップにないキーの場合は Package（箱）にフォールバック
  const Icon = (icon && ICON_MAP[icon]) || Package;
  return <Icon size={size} strokeWidth={1.8} className={className} style={style} />;
}

// constants.ts の CATEGORY_ICON_OPTIONS が参照するためエクスポートしておく
export { ICON_MAP };
