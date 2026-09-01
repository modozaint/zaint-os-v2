import { NextResponse } from "next/server";
import { enviarRecordatorio, recordatoriosParaEnviar, textoRecordatorio } from "@/lib/motor-pasos";
import { unipileConfigurado } from "@/lib/unipile";

export const maxDuration = 280;

/** Un solo ciclo a la vez, para no mandarle dos recordatorios al mismo lead. */
let cicloEnCurso = false;

/**
 * RECORDATORIO DE LA REUNIÓN — por LinkedIn, no por correo.
 *
 * Cal.com ya manda su recordatorio por email. Este sale por el MISMO hilo donde
 * el lead venía conversando con el setter, que es donde de verdad lo lee. Y
 * cierra una promesa que el agente ya venía haciendo: `setter.ts` le dice al
 * lead que "le llegará un recordatorio antes de la llamada" — hasta hoy esa
 * frase no la cumplía nadie.
 *
 * Body opcional:
 *   { adelantar?: boolean, cuantos?: number, soloRedactar?: boolean }
 *   - adelantar: ignora la ventana de 2 h (para probar sin esperar).
 *   - soloRedactar: devuelve el texto sin enviarlo. Para revisar antes.
 */
export async function POST(req: Request) {
  if (!unipileConfigurado()) {
    return NextResponse.json({ ok: false, motivo: "unipile-no-configurado" }, { status: 400 });
  }
  if (cicloEnCurso) {
    return NextResponse.json({ ok: true, motivo: "ciclo-en-curso", resultados: [] });
  }

  const { adelantar, cuantos, soloRedactar } = (await req.json().catch(() => ({}))) as {
    adelantar?: boolean;
    cuantos?: number;
    soloRedactar?: boolean;
  };

  cicloEnCurso = true;
  try {
    const cola = recordatoriosParaEnviar(Boolean(adelantar), cuantos ?? 5);
    const resultados: Record<string, unknown>[] = [];

    for (const p of cola) {
      try {
        if (soloRedactar) {
          resultados.push({
            ...p,
            enviado: false,
            borrador: textoRecordatorio(p.nombre, p.citaEn),
            motivo: "Solo redactado, no enviado.",
          });
          continue;
        }
        const envio = await enviarRecordatorio(p.leadId);
        resultados.push({ ...p, ...envio });
      } catch (e) {
        resultados.push({
          ...p,
          enviado: false,
          motivo: e instanceof Error ? e.message : "error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      enCola: cola.length,
      enviados: resultados.filter((r) => r.enviado).length,
      resultados,
    });
  } finally {
    cicloEnCurso = false;
  }
}

/** A quién le toca recordatorio ahora mismo (solo lectura, no envía nada). */
export async function GET() {
  const vencidos = recordatoriosParaEnviar(false, 50);
  const proximos = recordatoriosParaEnviar(true, 50);
  return NextResponse.json({
    ok: true,
    horasAntes: 2,
    // Los que saldrían en este ciclo.
    vencidos: vencidos.map((v) => ({ ...v, borrador: textoRecordatorio(v.nombre, v.citaEn) })),
    // Todas las reuniones futuras con recordatorio pendiente, estén o no en ventana.
    proximos,
  });
}
