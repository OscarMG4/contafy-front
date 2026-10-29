import { useId, type CSSProperties } from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** Color de la palabra «Conta­f». Por defecto, la tinta índigo de la marca (blanca en modo oscuro). */
  color?: string;
  style?: CSSProperties;
}

/**
 * Logo Contafy: la «C» de cinta en degradado violeta con barras ascendentes y la palabra en sans
 * geométrica, con la «y» en violeta. Los ids de los degradados son únicos por instancia.
 */
export function Logo({ size = 34, showText = true, color = "var(--cf-logo-ink)", style }: LogoProps) {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${name}${id})`;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3, color, ...style }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ flexShrink: 0 }}>
        <defs>
          <clipPath id={`c${id}`}>
            <path d="M51.5 16 A26 26 0 1 0 51.5 48 L45.2 39.2 A13 13 0 1 1 45.96 21.64 Z" />
          </clipPath>
          <linearGradient id={`b${id}`} x1="0.9" y1="0" x2="0.1" y2="0.75">
            <stop offset="0" stopColor="#CFA3FE" />
            <stop offset="0.35" stopColor="#8E4BF6" />
            <stop offset="0.75" stopColor="#4A18C4" />
            <stop offset="1" stopColor="#3812AE" />
          </linearGradient>
          <linearGradient id={`f${id}`} x1="0" y1="0.3" x2="1" y2="0.8">
            <stop offset="0" stopColor="#4B19C8" />
            <stop offset="0.5" stopColor="#8743F4" />
            <stop offset="1" stopColor="#B880FD" />
          </linearGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1E0A5C" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1E0A5C" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`i${id}`} cx="0.36" cy="0.56" r="0.32">
            <stop offset="0.55" stopColor="#1E0A5C" stopOpacity="0.6" />
            <stop offset="1" stopColor="#1E0A5C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`r${id}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#A26AFA" />
            <stop offset="1" stopColor="#5420D6" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <rect width="64" height="64" fill={ref("b")} />
          <path
            d="M2 22 C 14 26, 20 44, 44 44.5 L 64 40 L 64 64 L 0 64 Z"
            fill={ref("s")}
            transform="translate(0 -3)"
          />
          <path d="M2 22 C 14 26, 20 44, 44 44.5 L 64 40 L 64 64 L 0 64 Z" fill={ref("f")} />
          <rect width="64" height="64" fill={ref("i")} />
          <path d="M2 22 C 14 26, 20 44, 44 44.5" fill="none" stroke="#D8B8FF" strokeWidth="0.8" strokeOpacity="0.55" />
        </g>
        <g fill={ref("r")} stroke={ref("r")} strokeWidth="1.2" strokeLinejoin="round">
          <path d="M26.8 30.6 L31 28.9 L31 38 L26.8 36.6 Z" />
          <path d="M32.9 26.6 L37.1 24.9 L37.1 38.6 L32.9 38.5 Z" />
          <path d="M39 22.6 L43.2 20.9 L43.2 36.4 L39 38.2 Z" />
        </g>
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-sans), ui-sans-serif, sans-serif",
            fontSize: size * 0.66,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1,
          }}
        >
          Contaf
          <span
            style={{
              background: "linear-gradient(160deg, #B57CFD 0%, #8E4BF6 45%, #6C25F2 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            y
          </span>
        </span>
      )}
    </span>
  );
}
