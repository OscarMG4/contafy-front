import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** Color del texto. Por defecto hereda del contenedor. */
  color?: string;
  style?: CSSProperties;
}

export function Logo({ size = 34, showText = true, color, style }: LogoProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color, ...style }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="8" fill="#7C3AED" />
        <path d="M42 22.5a13 13 0 1 0 0 19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="44" cy="32" r="3.5" fill="#fff" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: size * 0.58,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Contafy
        </span>
      )}
    </span>
  );
}
