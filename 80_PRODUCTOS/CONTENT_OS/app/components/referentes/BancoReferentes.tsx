"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { MARCAS, MARCA_DEFAULT, esMarca, type MarcaId } from "@/lib/marcas"

type Plataforma = "ig" | "tiktok" | "yt"

interface Referente {
  id: string
  handle: string
  plataforma: Plataforma
  marca_id: MarcaId | null
  que_tomar: string
  por_que: string | null
  categoria: string | null
  url: string | null
  created_at: string
}

const CATEGORIAS = ["hook", "edicion", "formato", "posicionamiento", "arte", "oferta"]

export function BancoReferentes() {
  const [referentes, setReferentes] = useState<Referente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const desdeUrl = useSearchParams().get("marca")
  const marcaActiva: MarcaId = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT

  const [filtro, setFiltro] = useState<MarcaId | "todas">("todas")
  const [abierto, setAbierto] = useState(false)

  const [handle, setHandle] = useState("")
  const [queTomar, setQueTomar] = useState("")
  const [porQue, setPorQue] = useState("")
  const [marca, setMarca] = useState<MarcaId>(marcaActiva)
  const [categoria, setCategoria] = useState("posicionamiento")
  const [plataforma, setPlataforma] = useState<Plataforma>("ig")
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const url = filtro === "todas" ? "/api/referentes" : `/api/referentes?marca=${filtro}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar los referentes")
      setReferentes(data.referentes)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch("/api/referentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          que_tomar: queTomar,
          por_que: porQue,
          marca_id: marca,
          categoria,
          plataforma,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHandle("")
      setQueTomar("")
      setPorQue("")
      setAbierto(false)
      cargar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(id: string) {
    await fetch(`/api/referentes?id=${id}`, { method: "DELETE" })
    cargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltro("todas")}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              filtro === "todas"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {MARCAS.map((m) => (
            <button
              key={m.id}
              onClick={() => setFiltro(m.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                filtro === m.id
                  ? "text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={filtro === m.id ? { backgroundColor: m.color } : undefined}
            >
              {m.nombre}
            </button>
          ))}
        </div>
        <Button onClick={() => setAbierto(!abierto)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Añadir perfil
        </Button>
      </div>

      {abierto && (
        <Card className="p-4">
          <form onSubmit={guardar} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Perfil (@cuenta o URL)
                </label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@feelink.tatuajes"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Plataforma</label>
                  <select
                    value={plataforma}
                    onChange={(e) => setPlataforma(e.target.value as Plataforma)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="ig">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="yt">YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Para</label>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value as MarcaId)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {MARCAS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">
                ¿Qué tomar de esta cuenta?{" "}
                <span className="text-muted-foreground">(obligatorio)</span>
              </label>
              <textarea
                value={queTomar}
                onChange={(e) => setQueTomar(e.target.value)}
                placeholder="Concreto: cómo nombra el miedo del cliente en la bio"
                required
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Sin esto es un favorito, no un insumo para escribir.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Por qué lo sigo (opcional)
                </label>
                <input
                  value={porQue}
                  onChange={(e) => setPorQue(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : referentes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Todavía no hay perfiles guardados.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Un referente es una cuenta que estudias. Los videos sueltos de inspiración van a la
            Videoteca del vault, no aquí.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {referentes.map((r) => {
            const m = MARCAS.find((x) => x.id === r.marca_id)
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">@{r.handle}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {r.plataforma}
                      </Badge>
                    </div>
                    {m && (
                      <span className="text-xs" style={{ color: m.color }}>
                        {m.nombre}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => borrar(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 rounded-md bg-muted/50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Qué tomar
                  </p>
                  <p className="mt-0.5 text-sm">{r.que_tomar}</p>
                </div>

                {r.por_que && <p className="mt-2 text-xs text-muted-foreground">{r.por_que}</p>}
                {r.categoria && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {r.categoria}
                  </Badge>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
