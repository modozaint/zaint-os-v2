import { NextResponse } from "next/server";
import { analizarPerfil, analizarEnLote } from "@/lib/claude";
import { actualizarLead, ajustesDeLead, listarLeads } from "@/lib/store";
import { pareceEmpresa } from "@/lib/tipo-perfil";
import type { Lead } from "@/lib/types";

export const maxDuration = 300;

/** Un solo lote a la vez: dos corridas en paralelo se pisarían los mensajes. */
let loteEnCurso = false;

/**
 * REGENERAR MENSAJES EN LOTE.
 *
 * Por qué existe: el mensaje de cada lead se escribe UNA vez, cuando entra por
 * la búsqueda, y queda guardado. Así que arreglar el generador no arregla lo ya
 * escrito. El 03-08 se corrigió el trato a las cuentas de empresa (antes las
 * saludaba por "nombre de pila": "Hola Agencia") y quedaron 17 leads en cola con
 * el texto viejo. Regenerarlos de a uno son 17 clics.
 *
 * Candado importante: NUNCA toca un lead ya contactado. Su mensaje ya salió a
 * LinkedIn; reescribirlo solo haría que el tablero mienta sobre lo que se envió.
 *
 * Body (todo opcional):
 *   { filtro?: "sin-nota" | "empresas" | "todos", ids?, soloRedactar? }
 *   - filtro (default "sin-nota"): a quiénes rehacerles los textos.
 *     · sin-nota: los que no tienen `notaInvitacion` — o sea, todos los
 *       generados antes del 03-08, cuya solicitud saldría pelada.
 *     · empresas: solo las cuentas de empresa.
 *     · todos: todos los pendientes.
 *   - ids: limita a estos leads (gana sobre el filtro).
 *   - soloRedactar: devuelve los textos nuevos SIN guardarlos, para revisar.
 */
export async function POST(req: Request) {
  if (loteEnCurso) {
    return NextResponse.json({ ok: true, motivo: "lote-en-curso", resultados: [] });
  }

  const {
    filtro = "sin-nota",
    ids,
    soloRedactar,
  } = (await req.json().catch(() => ({}))) as {
    filtro?: "sin-nota" | "empresas" | "todos";
    ids?: string[];
    soloRedactar?: boolean;
  };

  loteEnCurso = true;
  try {
    const esEmpresa = (l: Lead) =>
      l.esEmpresa ?? pareceEmpresa(l.nombre, l.headline ?? "");

    // El mensaje de un lead ya contactado NO se toca: ese texto ya se envió.
    const pendientes = listarLeads().filter(
      (l) => !l.contactadoEn && !l.chatId && l.estado === "nuevos",
    );

    const cola = ids?.length
      ? pendientes.filter((l) => ids.includes(l.id))
      : filtro === "empresas"
        ? pendientes.filter(esEmpresa)
        : filtro === "todos"
          ? pendientes
          : pendientes.filter((l) => !l.notaInvitacion?.trim());

    if (!cola.length) {
      return NextResponse.json({
        ok: true,
        motivo: "nada-que-regenerar",
        revisados: pendientes.length,
        regenerados: 0,
        resultados: [],
      });
    }

    const resultados: Record<string, unknown>[] = [];

    await analizarEnLote(cola, 5, async (lead) => {
      try {
        const analisis = await analizarPerfil(
          {
            perfilUrl: lead.perfilUrl,
            nombre: lead.nombre,
            cargo: lead.cargo,
            empresa: lead.empresa,
            ubicacion: lead.ubicacion,
            fotoUrl: lead.fotoUrl,
            headline: lead.headline,
          },
          lead.ultimoPost,
          ajustesDeLead(lead),
        );

        if (!analisis.mensaje.trim()) {
          resultados.push({
            id: lead.id,
            nombre: lead.nombre,
            ok: false,
            motivo: "el modelo devolvió un mensaje vacío",
          });
          return;
        }

        // Se reescriben los dos textos del primer contacto: la nota que viaja en
        // la solicitud y el mensaje que sale al aceptar. `resumen` y
        // `porQueBuenLead` no cambian con esto.
        if (!soloRedactar) {
          actualizarLead(lead.id, {
            mensaje: analisis.mensaje,
            notaInvitacion: analisis.notaInvitacion,
            encaje: analisis.encaje,
            porQueEncaje: analisis.porQueEncaje,
          });
        }

        resultados.push({
          id: lead.id,
          nombre: lead.nombre,
          esEmpresa: esEmpresa(lead),
          ok: true,
          encaje: analisis.encaje,
          porQueEncaje: analisis.porQueEncaje,
          antes: lead.mensaje,
          ahora: analisis.mensaje,
          nota: analisis.notaInvitacion,
          largoNota: analisis.notaInvitacion.length,
        });
      } catch (e) {
        resultados.push({
          id: lead.id,
          nombre: lead.nombre,
          ok: false,
          motivo: e instanceof Error ? e.message : "error",
        });
      }
    });

    return NextResponse.json({
      ok: true,
      revisados: pendientes.length,
      enCola: cola.length,
      regenerados: resultados.filter((r) => r.ok).length,
      guardados: !soloRedactar,
      resultados,
    });
  } catch (e) {
    console.error("[regenerar-lote]", e);
    return NextResponse.json(
      { error: (e as Error).message || "No se pudo regenerar el lote." },
      { status: 500 },
    );
  } finally {
    loteEnCurso = false;
  }
}

/** Cuántos hay para regenerar, sin tocar nada. Alimenta el aviso de la app. */
export function GET() {
  const pendientes = listarLeads().filter(
    (l) => !l.contactadoEn && !l.chatId && l.estado === "nuevos",
  );
  const empresas = pendientes.filter(
    (l) => l.esEmpresa ?? pareceEmpresa(l.nombre, l.headline ?? ""),
  );
  // Sin nota, la solicitud sale pelada: el lead decide si acepta viendo solo
  // una foto y un nombre.
  const sinNota = pendientes.filter((l) => !l.notaInvitacion?.trim());
  return NextResponse.json({
    ok: true,
    pendientes: pendientes.length,
    empresas: empresas.length,
    sinNota: sinNota.length,
    nombres: sinNota.map((l) => l.nombre),
  });
}
