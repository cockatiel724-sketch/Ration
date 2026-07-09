// ============================================================
// src/app/screens/AuthScreens.tsx
// スプラッシュ画面 & ログイン画面
//
// ロゴは public/images/ration_logo.png を使用（画像ファイル）
// アニメーションシーケンス（JS制御）:
//   1. 表示（静止）    ← 0.5秒
//   2. ピンチイン      ← 0.3秒（縮小）
//   3. ピンチアウト    ← 0.4秒（元のサイズに戻る）
//   4. 静止            ← 0.5秒
//   5. onFinished() を呼んで画面遷移
// ============================================================

import { useEffect, useRef, useState } from "react";

// ─── ロゴ画像コンポーネント ──────────────────────────────────

function RationLogo({ width = 240 }: { width?: number }) {
  return (
    <img
      src="/images/ration_logo.png"
      alt="Ration"
      width={width}
      style={{ imageRendering: "auto", userSelect: "none", pointerEvents: "none" }}
      draggable={false}
    />
  );
}

// ─── スプラッシュ画面 ─────────────────────────────────────────

interface SplashScreenProps {
  onFinished?: () => void;
}

type AnimPhase = "waiting" | "pinch-in" | "pinch-out" | "done-wait";

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [phase, setPhase] = useState<AnimPhase>("waiting");
  const calledRef    = useRef(false);
  // onFinished を ref で保持することで useEffect の依存配列から外す
  // → onFinished が undefined に変わってもアニメーションが再起動しない
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    // アニメーションは初回マウント時の1回だけ実行する
    const t1 = window.setTimeout(() => setPhase("pinch-in"),   500);
    const t2 = window.setTimeout(() => setPhase("pinch-out"),  800);
    const t3 = window.setTimeout(() => setPhase("done-wait"), 1200);
    const t4 = window.setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onFinishedRef.current?.();
      }
    }, 1700);

    return () => { [t1,t2,t3,t4].forEach(window.clearTimeout); };
  }, []); // 空配列 = マウント時1回だけ実行

  // フェーズごとのスケール・トランジション
  const scaleMap: Record<AnimPhase, number> = {
    "waiting":   1,
    "pinch-in":  0.72,
    "pinch-out": 1.08,
    "done-wait": 1,
  };
  const transMap: Record<AnimPhase, string> = {
    "waiting":   "transform 0.1s ease",
    "pinch-in":  "transform 0.30s cubic-bezier(0.4, 0, 0.6, 1)",
    "pinch-out": "transform 0.40s cubic-bezier(0.34, 1.56, 0.64, 1)",
    "done-wait": "transform 0.15s ease",
  };

  return (
    <div style={{
      height: "100dvh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>
      <div style={{
        transform: `scale(${scaleMap[phase]})`,
        transition: transMap[phase],
        willChange: "transform",
      }}>
        <RationLogo width={220} />
      </div>
      <h1 style={{
        fontSize: 28,
        fontWeight: 600,
        color: "#111",
        margin: 0,
        letterSpacing: "0.05em",
      }}>
        Ration
      </h1>
    </div>
  );
}

// ─── ログイン画面 ─────────────────────────────────────────────

interface LoginScreenProps {
  onLogin: () => void;
  onGuestLogin: () => void;
  error: string;
}

export function LoginScreen({ onLogin, onGuestLogin, error }: LoginScreenProps) {
  return (
    <div style={{
      height: "100dvh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        {/* ロゴ（中央） */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <RationLogo width={180} />
          <p style={{ marginTop: 16, fontSize: 11, color: "#8b949e", letterSpacing: "0.15em" }}>
            家計簿アプリ
          </p>
          <h1 style={{ marginTop: 4, fontSize: 28, fontWeight: 600, color: "#111", margin: "4px 0 0" }}>
            Ration
          </h1>
        </div>

        {/* Googleログインボタン */}
        <button
          onClick={onLogin}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            color: "#111",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Googleでログイン
        </button>

        {/* 区切り線 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>または</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        {/* ゲストログインボタン */}
        <button
          onClick={onGuestLogin}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            border: "1.5px dashed #d1d5db",
            background: "#f9fafb",
            fontSize: 14,
            fontWeight: 600,
            color: "#6b7280",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ゲストとして試す
        </button>
        <p style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
          ゲストのデータは端末ごとに保存されます
        </p>

        {/* エラー */}
        {error && (
          <p style={{
            marginTop: 16,
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)",
            fontSize: 12,
            color: "#ef4444",
            textAlign: "left",
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
