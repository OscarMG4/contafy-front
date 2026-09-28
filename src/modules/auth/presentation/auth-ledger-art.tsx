/** Ilustración lineal grande: libro diario + factura + tendencia. */
export function AuthLedgerArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="cfLedgerGlow" x1="40" y1="20" x2="600" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" stopOpacity="0.4" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="cfBar" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#C4B5FD" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect x="12" y="36" width="616" height="268" rx="24" fill="url(#cfLedgerGlow)" opacity="0.5" />

      {/* Open ledger */}
      <g stroke="rgba(255,255,255,0.58)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M56 64h186c28 0 44 12 68 34v156c-24-18-42-28-68-28H56V64Z" fill="rgba(255,255,255,0.05)" />
        <path d="M396 64H254c28 0 44 12 68 34v156c24-18 42-28 68-28h6V64Z" fill="rgba(167,139,250,0.1)" />
        <path d="M322 98v156" stroke="#A78BFA" strokeOpacity="0.65" strokeWidth="2.2" />
        <path
          d="M78 118h120M78 142h108M78 166h128M78 190h100M78 214h116"
          stroke="rgba(255,255,255,0.24)"
          strokeWidth="1.8"
        />
        <path
          d="M356 118h132M356 142h120M356 166h140M356 190h110M356 214h128"
          stroke="rgba(196,181,253,0.32)"
          strokeWidth="1.8"
        />
        <path d="M78 118h16M78 166h16" stroke="#A78BFA" strokeOpacity="0.85" strokeWidth="3" />
        <path d="M472 142h16M472 190h16" stroke="#C4B5FD" strokeOpacity="0.9" strokeWidth="3" />
      </g>

      {/* Invoice card */}
      <g transform="translate(468 56)">
        <rect
          x="0"
          y="0"
          width="132"
          height="168"
          rx="14"
          fill="rgba(18,21,26,0.78)"
          stroke="rgba(167,139,250,0.5)"
          strokeWidth="2"
        />
        <path d="M22 34h88M22 56h70M22 78h80" stroke="rgba(255,255,255,0.38)" strokeWidth="2" strokeLinecap="round" />
        <rect x="22" y="106" width="62" height="12" rx="3" fill="#7C3AED" fillOpacity="0.6" />
        <path d="M22 136h44" stroke="#C4B5FD" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="106" cy="138" r="12" fill="rgba(124,58,237,0.28)" stroke="#A78BFA" strokeWidth="1.8" />
        <path d="M100 138l4.5 4.5 9-10" stroke="#E9E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Chart */}
      <g transform="translate(64 268)" strokeLinecap="round">
        <path d="M0 0v-56M0 0h140" stroke="rgba(255,255,255,0.22)" strokeWidth="1.8" />
        <rect x="16" y="-22" width="16" height="22" rx="3" fill="url(#cfBar)" opacity="0.85" />
        <rect x="44" y="-38" width="16" height="38" rx="3" fill="url(#cfBar)" />
        <rect x="72" y="-28" width="16" height="28" rx="3" fill="url(#cfBar)" opacity="0.75" />
        <rect x="100" y="-50" width="16" height="50" rx="3" fill="#C4B5FD" fillOpacity="0.92" />
        <path d="M24 -28 L52 -44 L80 -34 L108 -56" stroke="#E9E5FF" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
        <circle cx="108" cy="-56" r="4.5" fill="#A78BFA" />
      </g>

      <g
        transform="translate(250 286)"
        fill="rgba(255,255,255,0.42)"
        fontFamily="var(--font-sans), ui-sans-serif, sans-serif"
        fontSize="13"
        fontWeight="600"
        letterSpacing="0.12em"
      >
        <text>DEBE</text>
        <text x="78" fill="#C4B5FD">
          HABER
        </text>
        <path d="M54 5h14" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
