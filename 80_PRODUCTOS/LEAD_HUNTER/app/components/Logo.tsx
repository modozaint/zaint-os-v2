/**
 * Lockup "in" recreado como SVG tipográfico — NO es el logo oficial de
 * LinkedIn, es una marca propia que vive en la misma familia visual.
 */
export function MarcaIn({ size = 32 }: { size?: number }) {
  const r = size * 0.22;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx={(r / size) * 32} fill="var(--color-li-blue)" />
      {/* punto de la i */}
      <circle cx="9.4" cy="9.2" r="2.15" fill="#fff" />
      {/* asta de la i */}
      <rect x="7.5" y="13" width="3.8" height="11.5" rx="0.6" fill="#fff" />
      {/* n */}
      <path
        d="M14.2 13h3.6v1.6c.62-1.15 1.85-1.9 3.5-1.9 2.6 0 4.2 1.7 4.2 4.6v7.2h-3.8v-6.5c0-1.5-.72-2.35-2-2.35-1.32 0-2.1.9-2.1 2.4v6.45h-3.4V13Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <MarcaIn size={32} />
      <span className="text-[19px] font-semibold tracking-tight text-li-text">
        LeadHunter
      </span>
    </div>
  );
}

/** Sello chico del footer del sidebar: refuerza la estética "validado". */
export function SelloDatos() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-li-text-2">
      <MarcaIn size={16} />
      <span>Datos vía LinkedIn</span>
    </div>
  );
}
