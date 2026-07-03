// ============================================================
// src/app/components/RationLogo.tsx
// Ration のロゴマーク（緑のトグルスイッチ + "R" モチーフ）
//
// デザイン意図:
//   ・全体が「ON」のトグルスイッチの形（左に "ON" の文字、右に丸いつまみ）
//   ・つまみ（白丸）の中に "R" を図案化した矢印的なマークを配置
//   ・「Rationは支出管理をONにする」という意味を込めて、
//     スイッチが ON 側（右）に入っている状態をロゴ化している
//
// animated=true のとき、白丸のつまみが左（OFF位置）→右（ON位置）に
// スライドするアニメーションを再生する（スプラッシュ画面で使用）
// ============================================================

interface RationLogoProps {
  size?: number;       // ロゴの幅(px)。高さは比率(出力比 200:108)で自動計算
  animated?: boolean;  // true: OFF→ONのスライドアニメーションを再生
  onAnimationEnd?: () => void; // アニメーション終了時のコールバック
}

export function RationLogo({ size = 160, animated = false, onAnimationEnd }: RationLogoProps) {
  // 画像の比率に合わせたviewBox（横長の角丸トグル）
  const width = size;
  const height = size * 0.54; // 元画像のスイッチ部分の縦横比に近似

  return (
    <div style={{ width, height }}>
      <svg
        viewBox="0 0 200 108"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onAnimationEnd={onAnimationEnd}
      >
        <style>{`
          /* つまみ（白丸）が左から右へスライドするアニメーション */
          @keyframes ration-knob-slide {
            0%   { transform: translateX(-92px); }
            60%  { transform: translateX(-92px); } /* 少し溜めてから動く */
            100% { transform: translateX(0px); }
          }
          /* トラック（背景の緑カプセル）がOFF色→ON色にフェードする演出 */
          @keyframes ration-track-fade {
            0%   { opacity: 0.55; }
            60%  { opacity: 0.55; }
            100% { opacity: 1; }
          }
          .ration-knob-animated {
            animation: ration-knob-slide 0.9s cubic-bezier(0.65, 0, 0.35, 1) forwards;
          }
          .ration-track-animated {
            animation: ration-track-fade 0.9s ease-out forwards;
          }
        `}</style>

        {/* ── トラック（緑の角丸カプセル全体） ── */}
        <rect
          className={animated ? "ration-track-animated" : undefined}
          x="0" y="0" width="200" height="108" rx="54"
          fill="#059669"
        />

        {/* ── "ON" の文字（左側） ── */}
        <text
          x="40" y="64"
          fontFamily="'DM Mono', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="700"
          fontSize="38"
          fill="#ffffff"
          textAnchor="middle"
        >
          ON
        </text>

        {/* ── つまみ（白丸 + "R" モチーフ） ── */}
        {/* グループごと右端に配置し、アニメーション時だけ左から開始させる */}
        <g
          className={animated ? "ration-knob-animated" : undefined}
          transform="translate(146, 0)"
        >
          {/* 白い円 */}
          <circle cx="0" cy="54" r="46" fill="#ffffff" />

          {/* "R" を図案化したマーク：
              縦棒 + 上のループ + 右下に向かう斜めの脚、で矢印のように
              右肩上がりに見える＝「ON / 上向き」のニュアンスを持たせている */}
          <path
            d="
              M -16 30
              L -16 78
              L -2 78
              L -2 58
              L 8 58
              L 22 78
              L 38 78
              L 21 54
              C 30 50 34 43 34 35
              C 34 21 23 12 6 12
              L -16 12
              Z
              M -2 24
              L 4 24
              C 13 24 18 27 18 34
              C 18 41 13 45 4 45
              L -2 45
              Z
            "
            fill="#059669"
          />
        </g>
      </svg>
    </div>
  );
}
