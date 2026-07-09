// ============================================================
// src/app/App.tsx
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Clock, PlusCircle, Settings, BarChart2 } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

import {
  getStorageMode, saveBudgetData, subscribeBudgetData, type BudgetData,
} from "../lib/budgetRepository";
import { auth, googleProvider, hasFirebaseConfig } from "../lib/firebase";

import type { Tab, Transaction, FavoriteItem, ExpenseForm, UserCategory, FixedExpense } from "./types";
import {
  TODAY, formatLocalDate,
  DEFAULT_FAVORITES, DEFAULT_PAYMENT_METHODS, DEFAULT_CATEGORIES,
  DEFAULT_FIXED_EXPENSES, SAMPLE_TRANSACTIONS,
  getMonthKey, getMonthLabel,
  buildPieData, buildDailyData, buildMonthlyData,
  buildCategoryColorMap, buildCategoryIconMap,
  groupByDate,
} from "./constants";

import { SplashScreen, LoginScreen } from "./screens/AuthScreens";
import { HomeScreen }                from "./screens/HomeScreen";
import { HistoryScreen }             from "./screens/HistoryScreen";
import { RecordScreen }              from "./screens/RecordScreen";
import { SettingsScreen }            from "./screens/SettingsScreen";

export default function App() {
  const [tab, setTab]             = useState<Tab>("home");
  const [dark, setDark]           = useState(false); // デフォルトはライトモード
  const [booting, setBooting]     = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser]           = useState<User | null>(null);
  const [authError, setAuthError] = useState("");

  const [transactions,    setTransactions]    = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [favorites,       setFavorites]       = useState<FavoriteItem[]>(DEFAULT_FAVORITES);
  const [paymentMethods,  setPaymentMethods]  = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [categories,      setCategories]      = useState<UserCategory[]>(DEFAULT_CATEGORIES);
  const [fixedExpenses,   setFixedExpenses]   = useState<FixedExpense[]>(DEFAULT_FIXED_EXPENSES);
  const [syncMessage,     setSyncMessage]     = useState("読み込み中...");

  const [monthKey, setMonthKey]       = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [form, setForm] = useState<ExpenseForm>({
    type: "expense", date: TODAY, amount: "", item: "", store: "",
    category: DEFAULT_CATEGORIES[0]?.label ?? "食費",
    paymentMethod: "クレジットカード", isEssential: true, incomeCategory: "給与",
  });
  const [recordSuccess, setRecordSuccess] = useState(false);

  const hasLoaded            = useRef(false);
  const isApplyingRemoteData = useRef(false);
  // 固定費の自動適用は1セッション1回だけ行うためのフラグ
  const hasAppliedFixed      = useRef(false);

  // ── 派生データ ──────────────────────────────────────────
  const visibleTransactions = useMemo(
    () => transactions.filter((t) => getMonthKey(t.date) === monthKey),
    [transactions, monthKey],
  );
  // isReceiptMeta=true（レシート親行）は集計から除外する
  const expenses  = visibleTransactions.filter((t) => t.type === "expense" && !t.isReceiptMeta);
  const total     = expenses.reduce((s, t) => s + t.amount, 0);
  const essential = expenses.filter((t) => t.isEssential).reduce((s, t) => s + t.amount, 0);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(categories), [categories]);
  const categoryIconMap  = useMemo(() => buildCategoryIconMap(categories),  [categories]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  // ── useEffects ──────────────────────────────────────────
  // 注: 以前はここで「1秒後に必ずbooting解除」という固定タイマーを使っていたが、
  //     ロゴのON/OFFアニメーション再生を優先するため廃止。
  //     代わりに SplashScreen の onFinished（アニメーション完了 or 保険タイマー）
  //     が呼ばれたタイミングで setBooting(false) する方式に変更した。

  useEffect(() => { setSelectedDate(null); }, [monthKey]);

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError("");
      // ユーザーが変わったらフラグリセット
      hasAppliedFixed.current = false;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    hasLoaded.current            = false;
    isApplyingRemoteData.current = false;
    hasAppliedFixed.current      = false;
    setSyncMessage("読み込み中...");

    const unsubscribe = subscribeBudgetData(
      user.uid,
      (data) => {
        if (data) {
          isApplyingRemoteData.current = true;

          // ── カテゴリー移行（旧emoji → 新icon形式） ──
          const rawCats = (data as any).categories as Array<UserCategory & { emoji?: string }> | undefined;
          if (rawCats?.length) {
            const migrated = rawCats.map((cat) => {
              if (cat.icon) return { id: cat.id, label: cat.label, icon: cat.icon };
              const def = DEFAULT_CATEGORIES.find((d) => d.id === cat.id);
              return { id: cat.id, label: cat.label, icon: def?.icon ?? "Package" };
            });
            setCategories(migrated);
          }

          // ── 固定費の読み込み ──
          const loadedFixed = ((data as any).fixedExpenses ?? []) as FixedExpense[];
          setFixedExpenses(loadedFixed);

          // ── 固定費の自動適用（初回ロード時のみ） ──
          if (!hasAppliedFixed.current && loadedFixed.length > 0) {
            hasAppliedFixed.current = true;
            const loadedTxs = data.transactions as Transaction[];
            const now       = new Date();
            const ym        = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            const today     = now.getDate();
            const maxDay    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

            const toAdd: Transaction[] = [];
            loadedFixed.forEach((fe) => {
              if (today < fe.dayOfMonth) return;
              const exists = loadedTxs.some(
                (t) => t.fixedExpenseId === fe.id && t.date.startsWith(ym)
              );
              if (!exists) {
                const day = Math.min(fe.dayOfMonth, maxDay);
                toAdd.push({
                  id:              `fe_${fe.id}_${ym}`,
                  date:            `${ym}-${String(day).padStart(2, "0")}`,
                  amount:          fe.amount,
                  item:            fe.item,
                  store:           fe.store,
                  category:        fe.category,
                  subcategory:     "",
                  paymentMethod:   fe.paymentMethod,
                  isEssential:     fe.isEssential,
                  type:            "expense",
                  fixedExpenseId:  fe.id,
                });
              }
            });

            const finalTxs = toAdd.length > 0 ? [...toAdd, ...loadedTxs] : loadedTxs;
            setTransactions(finalTxs);
          } else {
            setTransactions(data.transactions as Transaction[]);
          }

          setFavorites(data.favorites as FavoriteItem[]);
          setPaymentMethods(data.paymentMethods);
          setDark(data.dark);

        } else {
          // ── data が null = Firestoreにデータなし（初回ログイン）──
          // デモアカウントの場合だけ SAMPLE_TRANSACTIONS を自動投入して保存する
          const DEMO_EMAIL = "demo@ration-app.com";
          if (user.email === DEMO_EMAIL) {
            isApplyingRemoteData.current = false; // 保存トリガーを有効にする
            // state をサンプルデータで初期化 → useEffect が変化を検知して自動保存
            setTransactions(SAMPLE_TRANSACTIONS);
            setFavorites(DEFAULT_FAVORITES);
            setPaymentMethods(DEFAULT_PAYMENT_METHODS);
            setCategories(DEFAULT_CATEGORIES);
            setSyncMessage("デモデータを初期化しています...");
          }
        }

        hasLoaded.current = true;
        setSyncMessage(`${getStorageMode()}で保存中`);
      },
      (error) => {
        console.error(error);
        hasLoaded.current = true;
        setSyncMessage("Firebase接続に失敗しました。ブラウザ保存を使用中");
      },
    );
    return unsubscribe;
  }, [user]);

  // ── Firebase への保存 ──────────────────────────────────
  useEffect(() => {
    if (!user || !hasLoaded.current) return;
    if (isApplyingRemoteData.current) { isApplyingRemoteData.current = false; return; }

    const data = {
      user: { uid: user.uid, name: user.displayName ?? "", email: user.email ?? "", photoURL: user.photoURL ?? "" },
      transactions:   transactions.map((t) => ({ ...t, amount: t.amount ?? 0, store: t.store ?? "", subcategory: "" })),
      favorites:      favorites.map((f) => ({ ...f, amount: f.amount ?? null })),
      paymentMethods: paymentMethods.filter(Boolean),
      categories,
      fixedExpenses,
      dark:           dark ?? false,
      updatedAt:      new Date().toISOString(),
    } as unknown as BudgetData;

    saveBudgetData(user.uid, data)
      .then(()    => setSyncMessage(`${getStorageMode()}で保存済み`))
      .catch((err) => { console.error(err); setSyncMessage("Firebase保存に失敗しました。ブラウザ保存済み"); });
  }, [transactions, favorites, paymentMethods, categories, fixedExpenses, dark, user]);

  // ── ハンドラー ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthError("");
    if (!hasFirebaseConfig || !auth || !googleProvider) {
      setAuthError("Firebase設定が見つかりません。.env を確認してください。"); return;
    }
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { console.error(error); setAuthError("Googleログインに失敗しました。"); }
  };

  /**
   * ゲストログイン（固定デモアカウント）
   *
   * 固定のメールアドレス＋パスワードで自動ログインする。
   * どの端末・ブラウザからでも同じ uid でログインできるため、
   * Firestore 上のデモデータを全員で共有できる。
   *
   * ── セットアップ手順 ──
   * 1. Firebase コンソール → Authentication → Sign-in method
   *    「メール/パスワード」を有効化
   * 2. Authentication → Users → 「ユーザーを追加」
   *    メール: demo@ration-app.com
   *    パスワード: RationDemo2024!
   * 3. そのユーザーの UID で Firestore にデモデータを投入
   *    （下の SAMPLE_TRANSACTIONS が自動で使われる）
   *
   * ── セキュリティ注意 ──
   * このアカウントのデータは誰でも見られる・編集できる前提。
   * 個人情報は入れないこと。Firestore のルールで書き込みを
   * 制限したい場合は read-only ルールに変更することもできる。
   */
  const GUEST_EMAIL    = "demo@ration-app.com";
  const GUEST_PASSWORD = "RationDemo2024!";

  const handleGuestLogin = async () => {
    setAuthError("");
    if (!hasFirebaseConfig || !auth) {
      setAuthError("Firebase設定が見つかりません。.env を確認してください。"); return;
    }
    try {
      await signInWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        setAuthError("デモアカウントが未作成です。Firebase コンソールで作成してください。");
      } else {
        setAuthError("ゲストログインに失敗しました。");
      }
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setTab("home");
    hasLoaded.current = false;
  };

  const handleAdd = (itemLines?: import("./types").ItemLine[]) => {
    if (!form.amount || (form.type === "expense" && !form.item)) return;

    const now = Date.now();

    if (form.type === "expense" && itemLines && itemLines.length > 0) {
      // ── 内訳ありの場合 ──────────────────────────────────────────
      // mainTx は「表示専用の親行」として isReceiptMeta: true を付ける。
      // 集計・グラフには使わず、カレンダーやホームの一覧で
      // 「まとめて1件」として見せるためだけに保存する。
      // 実際の金額集計は _line* の内訳行だけで行う。
      const mainTx: Transaction = {
        id:              `${now}_main`,
        date:            form.date,
        amount:          parseInt(form.amount, 10), // 表示用の合計金額（集計には使わない）
        item:            form.item,
        store:           form.store,
        category:        "",           // カテゴリーは内訳行に任せるため空
        subcategory:     "",
        paymentMethod:   form.paymentMethod,
        isEssential:     form.isEssential,
        type:            "expense",
        isReceiptMeta:   true,         // ← 集計除外フラグ
      };
      const lineTxs: Transaction[] = itemLines
        .filter((l) => l.item.trim() && Number(l.amount) > 0)
        .map((l, i) => ({
          id:            `${now}_line${i}`,
          date:          form.date,
          amount:        parseInt(l.amount, 10),
          item:          l.item.trim(),
          store:         form.store,
          category:      l.category || form.category,
          subcategory:   "",
          paymentMethod: form.paymentMethod,
          isEssential:   l.isEssential,
          type:          "expense" as const,
        }));
      setTransactions([mainTx, ...lineTxs, ...transactions]);
    } else {
      // ── 通常（内訳なし） ──
      const newTx: Transaction = {
        id:            String(now),
        date:          form.date,
        amount:        parseInt(form.amount, 10),
        item:          form.type === "expense" ? form.item : form.incomeCategory,
        store:         form.store,
        category:      form.type === "expense" ? form.category : form.incomeCategory,
        subcategory:   "",
        paymentMethod: form.paymentMethod,
        isEssential:   form.isEssential,
        type:          form.type,
      };
      setTransactions([newTx, ...transactions]);
    }

    setForm({
      type: form.type, date: formatLocalDate(), amount: "", item: "", store: "",
      category: form.category, paymentMethod: form.paymentMethod,
      isEssential: true, incomeCategory: "給与",
    });
    setRecordSuccess(true);
    setTimeout(() => setRecordSuccess(false), 2200);
  };

  const applyFavorite = (fav: FavoriteItem) => {
    setForm((f) => ({
      ...f,
      item: fav.item, store: fav.store, category: fav.category,
      paymentMethod: fav.paymentMethod, isEssential: fav.isEssential,
      ...(fav.amount != null ? { amount: String(fav.amount) } : {}),
    }));
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 一覧表示用：_line*（内訳子行）を除外して親行・通常行だけ表示する
  // useMemoはreturn文より前に置く必要がある（Reactのルール）
  const displayTransactions = useMemo(
    () => visibleTransactions.filter((t) => !t.id.match(/_line\d+$/)),
    [visibleTransactions],
  );
  const byDate = groupByDate(displayTransactions);

  // ホームの最近の支出も _line* を除外し、親行（_main）を優先表示
  const recentExpenses = displayTransactions
    .filter((t) => t.type === "expense")
    .slice(0, 5);

  // ── 画面振り分け ────────────────────────────────────────
  if (booting) {
    return <SplashScreen onFinished={() => setBooting(false)} />;
  }
  if (!authReady) {
    // アニメーション完了・Firebase確認中 → 静止ロゴで待機（白画面にしない）
    return <SplashScreen onFinished={undefined} />;
  }
  if (!user) return <LoginScreen onLogin={handleGoogleLogin} onGuestLogin={handleGuestLogin} error={authError} />;

  return (
    <div className={dark ? "dark" : ""} style={{ height: "100dvh" }}>
      <div className="size-full bg-background text-foreground flex flex-col overflow-hidden" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {tab === "home" && (
            <HomeScreen
              monthLabel={getMonthLabel(monthKey)}
              total={total} essential={essential} leisure={total - essential}
              pieData={buildPieData(visibleTransactions)}
              dailyData={buildDailyData(visibleTransactions, monthKey)}
              monthlyData={buildMonthlyData(transactions, monthOptions)}
              recentTxs={recentExpenses}
              categoryColorMap={categoryColorMap}
              categoryIconMap={categoryIconMap}
              allTransactions={transactions}
              dark={dark} user={user}
              onLogout={handleLogout} onDelete={handleDelete}
              monthKey={monthKey} monthOptions={monthOptions} onChangeMonth={setMonthKey}
            />
          )}
          {tab === "history" && (
            <HistoryScreen
              monthKey={monthKey} monthOptions={monthOptions} onChangeMonth={setMonthKey}
              byDate={byDate} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              onDelete={handleDelete}
              categoryColorMap={categoryColorMap} categoryIconMap={categoryIconMap}
              allTransactions={transactions}
            />
          )}
          {tab === "record" && (
            <RecordScreen
              form={form} setForm={setForm} onSubmit={handleAdd} success={recordSuccess}
              favorites={favorites} applyFavorite={applyFavorite}
              paymentMethods={paymentMethods} categories={categories}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              dark={dark} setDark={setDark}
              favorites={favorites} setFavorites={setFavorites}
              paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
              categories={categories} setCategories={setCategories}
              fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses}
              syncMessage={syncMessage}
            />
          )}
        </main>

        <nav className="flex-shrink-0 bg-card border-t border-border">
          <div className="flex">
            {([
              { id: "home",     label: "ホーム", Icon: Home       },
              { id: "history",  label: "分析",   Icon: BarChart2  },
              { id: "record",   label: "記録",   Icon: PlusCircle },
              { id: "settings", label: "設定",   Icon: Settings   },
            ] as const).map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon size={22} strokeWidth={tab === id ? 2.2 : 1.5} />
                <span className="text-[10px] tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
