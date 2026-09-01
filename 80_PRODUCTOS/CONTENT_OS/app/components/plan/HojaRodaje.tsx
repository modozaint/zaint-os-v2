import Link from "next/link"
import { ArrowLeft, Clock } from "lucide-react"
import { marcaPorId } from "@/lib/marcas"
import { ESTADOS, TIPOS, type Escena, type HookCompleto, type Pieza } from "@/lib/piezasTipos"

/**
 * LA HOJA DE RODAJE — el PDF del plan de rodaje, en pantalla.
 *
 * Santiago (2026-08-23): *«que tengamos una plantilla en una interfaz y que ahí
 * sea donde podamos ver el guion para grabar o para editarlo, así como
 * separamos ese pdf del plan de rodaje»*.
 *
 * 🔑 LAS TRES REGLAS DE ESTA PANTALLA (plan §3.3), que mandan sobre el diseño:
 *
 * 1. **`se_dice` manda.** Es lo único que se lee en voz alta: grande, alto
 *    contraste, y NUNCA dentro de un scroll anidado. Lo demás es apoyo.
 * 2. **Legible con el celular apoyado y las manos ocupadas.** Una columna, sin
 *    scroll horizontal, sin hover como único afordance.
 * 3. Editable en el sitio — **eso es el paso 4 del plan, no este.** Esta versión
 *    es de solo lectura a propósito: primero que grabe una pieza leyendo de
 *    aquí en vez del PDF, y después se le mete edición.
 *
 * ⚠️ QUÉ GUARDA `brief` DE VERDAD, porque los nombres engañan y costó un rato
 * averiguarlo (verificado contra la base el 2026-08-26):
 *
 *   · `setup`    → el **B-ROLL** necesario. Viene de la columna «B-roll
 *                  necesario» del xlsx. NO es el encuadre.
 *   · `marcador` → la **NOTA DE RODAJE**: encuadre, luz, cuándo grabar, con
 *                  quién coordinar. Viene de «Nota de grabacion».
 *   · `candados` → lo que no se puede decir. Ese sí es lo que su nombre dice.
 *
 * El plan (§3.2) esperaba `setup` = «cómo se graba» y `marcador` = «contra qué
 * se compara». **No se renombraron las claves en la base**: 32 filas migradas
 * para cambiar una etiqueta es riesgo sin ganancia. Lo que se hizo es poner
 * cada cosa bajo el título que de verdad le corresponde. Y «contra qué se
 * compara» no existe en los datos, así que **no se pinta** — la regla de §4 es
 * que la vista muestre lo que haya y omita en silencio lo que falte.
 */

const XP_VACIO = "—"

/** Suma la duración leyendo el final de la última escena: "12-18" → 18 s. */
function duracionDe(escenas: Escena[]): string | null {
  let max = 0
  for (const e of escenas) {
    const fin = Number(String(e.segundos ?? "").split(/[-–]/).pop()?.trim())
    if (Number.isFinite(fin)) max = Math.max(max, fin)
  }
  return max > 0 ? `${max} s` : null
}

function Seccion({
  titulo, children, nota,
}: {
  titulo: string; children: React.ReactNode; nota?: string
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h2
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--text-faint)" }}
        >
          {titulo}
        </h2>
        {nota && (
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {nota}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * Las claves del brief que tienen nombre propio en pantalla.
 *
 * Las tres de abajo son las respuestas a las preguntas de §4.4: guardadas con
 * la clave corta, se leen con la pregunta entera. `publico` a secas sobre el
 * texto no dice nada; «a quién le habla» sí.
 */
const ROTULOS: Record<string, string> = {
  publico: "a quién le habla",
  verdad: "qué es verdad acá",
  material: "qué hay para mostrar",
  que_es: "qué es",
  para_que_cuenta: "para qué cuenta",
  como_sabremos: "cómo sabremos que quedó",
}

export function HojaRodaje({ pieza, volverA }: { pieza: Pieza; volverA: string }) {
  const marca = marcaPorId(pieza.marca_id)
  const escenas = Array.isArray(pieza.escenas) ? pieza.escenas : []
  const hooks = (Array.isArray(pieza.hooks) ? pieza.hooks : []) as HookCompleto[]
  const brief = (pieza.brief ?? {}) as Record<string, unknown>
  const duracion = duracionDe(escenas)

  const broll = typeof brief.setup === "string" ? brief.setup.trim() : ""
  const nota = typeof brief.marcador === "string" ? brief.marcador.trim() : ""
  const candados = Array.isArray(brief.candados) ? (brief.candados as string[]) : []

  // Lo que el brief traiga y esta vista no conozca. Se pinta igual: un dato
  // guardado que la pantalla esconde es un dato que nadie va a volver a ver.
  const otros = Object.entries(brief).filter(
    ([k, v]) => !["setup", "marcador", "candados"].includes(k) && typeof v === "string" && v.trim()
  ) as [string, string][]

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7 px-4 py-5 md:px-6">
      {/* ---- Cabecera ---- */}
      <header className="flex flex-col gap-3">
        <Link
          href={volverA}
          className="flex w-fit items-center gap-1.5 text-[12px]"
          style={{ color: "var(--text-faint)" }}
        >
          <ArrowLeft size={13} />
          Volver al plan
        </Link>

        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${marca.color}22, var(--bg-elevated) 70%)`,
            border: `1px solid ${marca.color}44`,
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ background: marca.color + "33", color: "var(--text-primary)" }}
            >
              {marca.nombre}
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {TIPOS.find((t) => t.id === pieza.tipo)?.label ?? pieza.tipo}
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {ESTADOS.find((e) => e.id === pieza.estado)?.label ?? pieza.estado}
            </span>
            {duracion && (
              <span
                className="flex items-center gap-1 text-[11px] tabular-nums"
                style={{ color: "var(--text-faint)" }}
              >
                <Clock size={11} />
                {duracion}
              </span>
            )}
            {pieza.fecha_objetivo && (
              <span className="text-[11px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                {new Date(pieza.fecha_objetivo + "T00:00:00").toLocaleDateString("es-CO", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </span>
            )}
          </div>

          <h1
            className="text-[26px] font-semibold leading-tight md:text-[30px]"
            style={{ color: "var(--text-primary)", fontFamily: marca.fuente }}
          >
            {pieza.titulo}
          </h1>

          {pieza.idea && pieza.idea.trim() !== pieza.titulo.trim() && (
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {pieza.idea}
            </p>
          )}

          {pieza.eje && (
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              eje · {pieza.eje}
            </span>
          )}
        </div>
      </header>

      {/* ---- Cómo se graba ---- */}
      {(nota || broll) && (
        <Seccion titulo="Cómo se graba">
          <div
            className="flex flex-col gap-3 rounded-xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {nota && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  Encuadre, luz y nota de rodaje
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {nota}
                </p>
              </div>
            )}
            {broll && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  B-roll necesario
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {broll}
                </p>
              </div>
            )}
          </div>
        </Seccion>
      )}

      {/* El brief de la IA es otra cosa: qué es la pieza, para qué cuenta, horas.
          Es un brief de PROYECTO, no de rodaje — meterlo bajo «cómo se graba»
          ponía «horas · 8» donde debería decir con qué luz. Va en su sección. */}
      {otros.length > 0 && (
        <Seccion titulo="El brief de la pieza">
          <div
            className="flex flex-col gap-3 rounded-xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {otros.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  {ROTULOS[k] ?? k.replace(/_/g, " ")}
                </span>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
        </Seccion>
      )}

      {/* ---- LAS ESCENAS. Es la razón de existir de esta pantalla ---- */}
      <Seccion
        titulo="El guion, escena por escena"
        nota={escenas.length > 0 ? `${escenas.length} escenas` : undefined}
      >
        {escenas.length === 0 ? (
          <p
            className="rounded-xl p-4 text-[13px] leading-relaxed"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Esta pieza todavía no tiene escenas guardadas. Las tres de ESTRATEGIA 01 se grabaron
            antes de que existiera el Content OS: su guion vive en el vault, en
            <span className="mx-1 font-mono text-[12px]">BRANDS/DERMATINTA/ESTRATEGIA_01.md</span>.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {escenas.map((e, i) => (
              <article
                key={i}
                className="flex flex-col gap-2.5 rounded-xl p-4"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{ background: marca.color + "26", color: "var(--text-primary)" }}
                  >
                    {e.segundos || i + 1}
                  </span>
                </div>

                {/* 🔑 Lo único que se lee en voz alta. Grande y sin scroll propio. */}
                <p
                  className="text-[19px] font-medium leading-[1.45] md:text-[21px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {e.se_dice || XP_VACIO}
                </p>

                <div className="flex flex-col gap-1.5 border-t pt-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                  {e.se_ve && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>ve · </span>
                      {e.se_ve}
                    </p>
                  )}
                  {e.texto_pantalla && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>pantalla · </span>
                      <span style={{ color: marca.color }}>{e.texto_pantalla}</span>
                    </p>
                  )}
                  {e.sonido && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>oye · </span>
                      {e.sonido}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Seccion>

      {/* ---- Hooks alternativos ---- */}
      {hooks.length > 0 && (
        <Seccion titulo="Otros arranques que se pueden probar" nota={`${hooks.length} opciones`}>
          <div className="flex flex-col gap-3">
            {hooks.map((hk, i) => (
              <article
                key={i}
                className="flex flex-col gap-2 rounded-xl p-4"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                {hk.arquetipo && (
                  <span
                    className="w-fit rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                    style={{ background: marca.color + "1f", color: "var(--text-secondary)" }}
                  >
                    {hk.arquetipo}
                  </span>
                )}
                <p className="text-[16px] font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                  {hk.verbal}
                </p>
                <div className="flex flex-col gap-1">
                  {hk.visual && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>ve · </span>{hk.visual}
                    </p>
                  )}
                  {hk.textual && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>pantalla · </span>
                      <span style={{ color: marca.color }}>{hk.textual}</span>
                    </p>
                  )}
                  {hk.auditivo && (
                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>oye · </span>{hk.auditivo}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Seccion>
      )}

      {/* ---- Lo que NO se dice ---- */}
      {candados.length > 0 && (
        <Seccion titulo="Lo que no se dice">
          <ul
            className="flex flex-col gap-2 rounded-xl p-4"
            style={{
              background: "var(--color-negative-bg)",
              border: "1px solid var(--color-negative)33",
            }}
          >
            {candados.map((c, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--color-negative)" }}>·</span>
                {c}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <p className="pb-6 text-[11px]" style={{ color: "var(--text-faint)" }}>
        Solo lectura por ahora. Editar en el sitio es el paso siguiente del plan —
        primero hay que grabar una pieza leyendo de aquí.
      </p>
    </div>
  )
}
