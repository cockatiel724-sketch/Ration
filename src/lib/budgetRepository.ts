import { doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";

export interface BudgetData {
  user?: {
    uid: string;
    name: string;
    email: string;
    photoURL: string;
  };
  transactions: unknown[];
  favorites: unknown[];
  paymentMethods: string[];
  dark: boolean;
  updatedAt: string;
}

const budgetId = import.meta.env.VITE_FIREBASE_BUDGET_ID || "default-budget";

const storageKey = (userId: string) => `ration:data:${userId}`;

const readLocal = (userId: string): BudgetData | null => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeLocal = (userId: string, data: BudgetData) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(data));
};

export const getStorageMode = () => (hasFirebaseConfig ? "Firestore" : "ブラウザ保存");

export const subscribeBudgetData = (
  userId: string,
  onData: (data: BudgetData | null) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  if (!db) {
    onData(readLocal(userId));
    return () => {};
  }

  return onSnapshot(
    doc(db, "users", userId, "budgets", budgetId),
    (snapshot) => onData(snapshot.exists() ? (snapshot.data() as BudgetData) : null),
    onError,
  );
};

export const saveBudgetData = async (userId: string, data: BudgetData) => {
  writeLocal(userId, data);

  if (!db) return;

  await setDoc(doc(db, "users", userId, "budgets", budgetId), data, { merge: true });
};
