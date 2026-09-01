type Punto = { nombre: string; valor: number; color: string }

/** Radar pentagonal en SVG puro. Sin librerías: pesa 0 KB extra. */
export function Radar({ datos, max = 100 }: { datos: Punto[]; max?: number }) {
  const N = datos.length
  const R = 78
  const cx = 110, cy = 100

  const punto = (i: number, r: number) => {
    const ang = (Math.PI * 2 * i) / N - Math.PI / 2
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r] as const
  }

  const anillos = [0.25, 0.5, 0.75, 1].map(f =>
    datos.map((_, i) => punto(i, R * f).join(',')).join(' ')
  )

  const forma = datos
    .map((d, i) => punto(i, R * Math.min(d.valor / max, 1)).join(','))
    .join(' ')

  return (
    <svg viewBox="0 0 220 200" className="radar">
      {anillos.map((p, i) => (
        <polygon key={i} points={p} fill="none" stroke="rgba(234,240,246,0.09)" strokeWidth="1" />
      ))}
      {datos.map((_, i) => {
        const [x, y] = punto(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(234,240,246,0.09)" strokeWidth="1" />
      })}

      <polygon points={forma} fill="rgba(163,190,76,0.18)" stroke="#A3BE4C" strokeWidth="2"
               strokeLinejoin="round" />

      {datos.map((d, i) => {
        const [x, y] = punto(i, R * Math.min(d.valor / max, 1))
        return <circle key={i} cx={x} cy={y} r="3.5" fill={d.valor === 0 ? '#E85D5D' : d.color} />
      })}

      {datos.map((d, i) => {
        const [x, y] = punto(i, R + 20)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="rgba(234,240,246,0.6)"
                style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {d.nombre}
          </text>
        )
      })}
    </svg>
  )
}
