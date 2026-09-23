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
        <defs>
          <linearGradient id="cf-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#4C1D95" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#cf-logo)" />
        <path d="M42 22.5a13 13 0 1 0 0 19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="44" cy="32" r="3.5" fill="#fff" />
      </svg>
      {showText && (
        <span style={{ fontSize: size * 0.62, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
          Contafy
        </span>
      )}
    </span>
  );
}
