import { Plug } from "lucide-react"
import { marcaPorId, type MarcaId } from "@/lib/marcas"

/**
 * Lo que se ve cuando una marca todavía no tiene token.
 *
 * Existe porque la alternativa era peor: sin credenciales el cliente devuelve
 * listas vacías y ceros, y una pantalla llena de ceros se lee como "esta marca
 * no tuvo alcance". Es un dato falso. Aquí se dice qué falta y dónde va.
 */
export function MarcaSinConectar({ marca }: { marca: MarcaId }) {
  const sufijo = marca.toUpperCase()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <Plug size={17} style={{ color: marcaPorId(marca).color }} />
      </div>

      <h2 className="font-display text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
        {marcaPorId(marca).nombre} todavía no está conectada
      </h2>

      <p className="max-w-md text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        No hay datos que mostrar — y no es que la cuenta esté en cero, es que
        falta el acceso. Para conectarla van dos variables en{" "}
        <code className="text-[12px]">.env.local</code>:
      </p>

      <pre
        className="rounded-lg px-4 py-3 text-left text-[12px] leading-relaxed"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        {`IG_${sufijo}_TOKEN=…\nIG_${sufijo}_USER_ID=…`}
      </pre>

      <p className="max-w-md text-[11px]" style={{ color: "var(--text-faint)" }}>
        Se sacan con la app de Meta que ya existe. El paso a paso está en{" "}
        <code className="text-[11px]">referencia/ig-api-guide.md</code>.
      </p>
    </div>
  )
}
