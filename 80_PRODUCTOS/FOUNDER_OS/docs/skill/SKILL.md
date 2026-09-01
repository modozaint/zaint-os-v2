---
name: founderos
description: Lee el FounderOS de Santiago (la app "Mi Vida") para responder sobre su día, sus hábitos, sus tareas por cuenta y su dinero personal — bolsillos, presupuesto y el diagnóstico de la asesoría. Úsala siempre que la pregunta toque cuánto lleva gastado, qué le falta hoy, cómo va una cuenta de ZAINT, si le alcanza para algo, o cualquier dato que viva en la app en vez de en el vault. Requiere el conector de Supabase.
---

# FounderOS — cómo leer la app

La app se llama **Mi Vida** (carpeta `_LABS/videojuego-vida`, repo `modozaint/founderos`).
Está en vivo en **https://founderos-six.vercel.app** — se entra con correo y contraseña.
Es la única fuente de verdad de dos cosas: **el día de Santiago** (turno, hábitos, tareas) y
**su dinero personal** (bolsillos, presupuesto, diagnóstico).

**Los datos NO están en el vault ni en este archivo. Están en Supabase, en vivo.**
Este documento solo te dice dónde mirar y cómo interpretarlo.

## Cómo consultar

Usa el conector de **Supabase**, proyecto `ubhdwijnqgzzpqiyinqc` (nombre: "modozaint's Project").
Consulta con SQL de solo lectura. Todas las tablas están en el esquema `public`.

> Si el conector no está disponible, **dilo** — no respondas de memoria ni estimes cifras.
> Un número inventado sobre su plata es peor que no responder.

## Las tres reglas de este dato

1. **Nunca sumes dinero personal con dinero de negocio.** `bancos`, `bolsillos` y `movimientos`
   son plata personal. `cuentas` **no es plata**: son las unidades de ZAINT (Dermatinta,
   House of Kaizen…) y miden **horas**, no pesos. No comparten ni una llave foránea, y es a
   propósito. Si una pregunta cruza los dos mundos, sepáralos en la respuesta.

2. **El presupuesto tiene DOS escenarios y confundirlos invierte la conclusión.**
   `antes` = como estaba antes de la asesoría (déficit de −$78.050/mes).
   `despues` = el plan vigente (superávit de +$265.167/mes). **Salvo que pregunte por el pasado,
   el escenario correcto es `despues`.**

3. **Todo lo que veas es de un solo usuario y está protegido por RLS.** No propongas escrituras
   sin que Santiago las pida explícitamente. Leer es libre; escribir se pregunta.

## Mapa de tablas

### El día
| Tabla | Para qué |
|---|---|
| `dias` | Un registro por día: `fecha`, `turno_id`, `energia`, `agradezco_por`, `apunte`, `meta_cumplida` |
| `registros` | Qué hábito cumplió y a qué nivel: `fecha`, `habito_id`, `nivel` (`minimo`/`normal`/`super`), `xp`, `nota` |
| `habitos` | Catálogo: `id`, `nombre`, `area_id`, y qué significa cada nivel (`minimo`, `normal`, `super`) |
| `areas` | Las 5 áreas de la Brújula, con su definición de "ganar" |
| `turnos` | El turno decide la exigencia del día: `horas_clinica`, `meta_nivel`, `meta_habitos` |
| `avatar` | `vida` y `vida_maxima` — la vida baja al incumplir |
| `niveles_por_area` | Vista: nivel y XP acumulado por área |

**La regla que hace justo el sistema:** la exigencia depende del turno. En un turno de 12 h en la
clínica, cumplir el mínimo **es** cumplir. No juzgues un día flojo sin mirar `dias.turno_id`.

### Las tareas y las cuentas de ZAINT
| Tabla | Para qué |
|---|---|
| `tareas` | `texto`, `peldano` (1-4), `minutos`, `estado`, `cuenta_id`, `origen` (`mano`/`voz`), `hecha` |
| `cuentas` | Las unidades: `nombre`, `estado` (`activa`/`mantenimiento`/`dormida`), `horas_mes`, `gatillo`, `nota` |
| `peldanos` | La escalera de prioridad: 1 = "levanta la mano" (alguien quiere comprar) … 4 = "construye" |

🔒 **Máximo 2 cuentas activas.** El candado vive en la base (trigger `limite_de_foco`), no en la
pantalla. Si Santiago quiere activar una tercera, otra tiene que salir — y hay que decir cuál.

### El dinero personal
| Tabla | Para qué |
|---|---|
| `bancos` | Dónde está la plata: `nombre`, `saldo_total` (se actualiza a mano, como en Parcero) |
| `bolsillos` | Los sobres: `nombre`, `banco_id`, `asignacion_mes`, `meta`, `ritmo` |
| `movimientos` | `bolsillo_id`, `tipo` (`cargar`/`descargar`), `monto`, `nota`, `fecha` |
| `bolsillos_con_saldo` | **Vista — úsala para saldos.** El saldo no se guarda: se calcula de los movimientos |
| `bancos_con_disponible` | Vista: cuánto hay en el banco que aún no está repartido en bolsillos |
| `presupuesto` | Por escenario: `ingresos`, `ahorro` |
| `categorias_gasto` | Las 6 categorías con su `ideal_pct` y `mas_es_mejor` (pasarse en Ahorro es bueno) |
| `presupuesto_lineas` | Cuánto va a cada categoría, por escenario |
| `presupuesto_conceptos` | El plan línea por línea: `concepto`, `detalle`, `monto_mes`, `activo` |
| `diagnostico` + `diagnostico_bloques` | El informe de la asesoría del 30-jun-2026 |

**`presupuesto_conceptos.activo = false`** son los cancelados (ChatGPT, Parcero Financiero).
Se guardan en vez de borrarse porque son la prueba del ahorro — no los sumes al gasto vigente.

**La plata entra DOS veces al mes, no una.** `bolsillos.ritmo` dice cuándo se llena cada uno:
`quincenal` (mitad y mitad), `q1` (completo con la primera quincena, 1-15), `q2` (con la
segunda). `asignacion_mes` sigue siendo la verdad del mes; el ritmo solo dice cómo se reparte.
La vista trae `cargado_quincena`: lo que YA se cargó en la quincena en curso — con eso se
responde «¿qué me falta meter?» sin abrir los movimientos uno por uno.

**Los 8 bolsillos salieron del presupuesto, no de la mano** (migración 010, aplicada el
15-ago): cada grupo real de `presupuesto_conceptos` es un bolsillo, con la suma de sus
conceptos activos. Suman **$1.953.800/mes**. Si un monto no cuadra, la fuente es el
presupuesto — se corrige allá, no en el bolsillo.

## Consultas que vas a necesitar

```sql
-- Saldo de cada bolsillo, ahora
select nombre, saldo, asignacion_mes from bolsillos_con_saldo order by orden;

-- Cuánto lleva gastado este mes, y en qué
select b.nombre, sum(m.monto) as gastado
from movimientos m join bolsillos b on b.id = m.bolsillo_id
where m.tipo = 'descargar' and date_trunc('month', m.fecha) = date_trunc('month', current_date)
group by b.nombre order by gastado desc;

-- El presupuesto vigente, por categoría
select c.nombre, c.ideal_pct, l.monto
from presupuesto_lineas l join categorias_gasto c on c.id = l.categoria_id
where l.escenario = 'despues' order by c.orden;

-- En qué se va la plata, concepto por concepto
select c.nombre as categoria, p.grupo, p.concepto, p.detalle, p.monto_mes
from presupuesto_conceptos p join categorias_gasto c on c.id = p.categoria_id
where p.activo order by c.orden, p.orden;

-- Cómo va la semana de hábitos
select d.fecha, d.turno_id, d.meta_cumplida, count(r.habito_id) as cumplidos
from dias d left join registros r on r.fecha = d.fecha
where d.fecha >= current_date - 7 group by d.fecha, d.turno_id, d.meta_cumplida order by d.fecha desc;

-- Qué hay pendiente, por cuenta y prioridad
select t.texto, t.peldano, t.minutos, c.nombre as cuenta, c.estado
from tareas t left join cuentas c on c.id = t.cuenta_id
where t.estado = 'pendiente' order by t.peldano, t.creada_en;
```

## Cómo responder

- **Con la cifra y su fecha.** "Llevas $X gastados en Diversión este mes" vale; "vas bien" no.
- **En pesos colombianos, sin decimales**: `$ 1.588.985`.
- **Si el dato no está, dilo.** Bolsillos vacíos significa que aún no ha creado ninguno, no que
  no tenga plata.
- **No conviertas una consulta en un sistema.** Si pregunta cuánto gastó, responde eso; no
  propongas un tablero nuevo ni le reorganices el presupuesto salvo que lo pida.

## Lo que esta skill no cubre

La estrategia de las marcas, la identidad de Dermatinta/House of Kaizen/MODOZAINT, los planes y
los aprendizajes **viven en el vault de Obsidian**, no en la app. Si la pregunta es de negocio y
no de datos del día o de plata personal, esta skill no es la fuente.

---
*Esquema verificado contra la base el 2026-08-14, tras aplicar las migraciones 003–008.*
