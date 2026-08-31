---
name: user_pablo_financiero
description: "Finanzas personales de Santiago — hay DOS escenarios y confundirlos cambia toda conclusión: ANTES de la asesoría −$78.050/mes, DESPUÉS +$265.167/mes. El vigente es DESPUÉS."
metadata: 
  node_type: memory
  type: user
  originSessionId: 8fccf98e-8609-449c-a986-70c72fb7061b
  modified: 2026-08-14T22:22:24.415Z
---

🔑 **La única cosa que hay que entender: hay DOS escenarios en su app, y confundirlos invierte
cualquier conclusión.** Verificado en capturas del 2026-08-14.

| | ANTES (sin asesoría) | **DESPUÉS (vigente)** |
|---|---|---|
| Ingresos | $2.219.333 | **$2.302.667** |
| Gastos | $2.297.383 | **$1.847.500** |
| Ahorro | $0 | **$190.000** |
| **Excedente** | **−$78.050** | **+$265.167** |
| Al año | −$936.600 | **+$3.182.000** |
| Usa en gastos | 103,5 % | **80,2 %** |
| Capacidad de ahorro | −3,5 % | **19,8 %** |

**El vigente es DESPUÉS: superávit de $265.167/mes.** El «antes» solo sirve para mostrar el cambio.

### Detalle por categoría (escenario DESPUÉS)

| Categoría | Monto | Va en | Ideal |
|---|---|---|---|
| Gastos del hogar | $500.000 | 22 % | 30 % |
| Necesidades básicas | $364.000 | 16 % | 25 % |
| Ahorro con propósito | $190.000 | 8 % | 10 % |
| Diversión y gastos | $380.000 | 17 % | 20 % |
| Educación y negocio | $230.500 | 10 % | 10 % |
| Deudas | $373.000 | 16 % | 10 % 🔴 |

Gastos fijos (hogar + necesidades) = 38 %, ideal 50-60 %.

### Bolsillos reales (Bancolombia · disponible fuera de bolsillos $884.434)

Hogar $500.000/mes · Obligaciones financieras $373.000/mes · Ropa y belleza $220.000/mes ·
Gasolina $144.000/mes · Anuales de la moto $100.000/mes. Tarjeta Nu: corte día 21, pago día 10.

### Cómo aplicar

- **La app propia (pestaña Dinero del FounderOS) es la fuente de verdad** desde el 2026-08-14.
  Reemplaza a Parcero Financiero, que costaba **$25.000/mes = $300.000/año**.
- **Nunca citar un solo número sin decir de qué escenario es.**
- La cuota de Nexum ($1.588.985) es **6 veces su excedente mensual** — no cabe, y esa conclusión
  se sostiene con el número correcto. Ver [[project_nexum_entrega]].
- ⚠️ Sigue vigente **no mezclar dinero personal y de negocio**, garantizado por esquema: las tablas
  `bancos/bolsillos/movimientos/presupuesto` no comparten llave con `cuentas` (ZAINT).

> 🔴 **Cicatriz doble (2026-08-14).** Esta memoria decía «excedente $243.167» (30-jun). Al ver una
> captura del escenario ANTES la «corregí» a «está en déficit» — y la propagué a la memoria, su
> índice, el CLAUDE.md y `_ARCHIVO/`. **Estaba peor que antes: el dato viejo era casi correcto.**
> El error fue mirar 4 de 17 capturas y no investigar el botón «con ahorro» que estaba a la vista.
> **Leer la evidencia completa antes de corregir un dato — una corrección equivocada se propaga
> igual que el dato falso, y con más confianza.**

### Cómo leerla en vivo (verificado 2026-08-15)

Conector **Supabase** de claude.ai. Proyecto: **`ubhdwijnqgzzpqiyinqc`** ("modozaint's Project",
ACTIVE_HEALTHY). El otro proyecto, `hlhidbmdoaasvfdgbagz` (Dermatinta Labs), está INACTIVE y no
tiene nada de esto.

Tablas de plata personal: `bancos` · `bolsillos` · `movimientos` · `presupuesto` (2 filas:
escenario `antes` id=1 y `despues` id=2) · `categorias_gasto` · `presupuesto_lineas` ·
`presupuesto_conceptos` · `diagnostico` · `diagnostico_bloques`.
⚠️ `cuentas` es de ZAINT (negocio) y **no se toca ni se suma** con estas.

🔴 **Estado real de los datos al 2026-08-15:** la app está construida pero **casi vacía**.
`bolsillos` tiene **1 de 5** (solo Hogar $500.000) y `movimientos` tiene **0 filas**. El saldo de
Bancolombia registrado es **$854.000**. Los cinco bolsillos que aparecen en el análisis salen de
las capturas de Parcero Financiero, **no de su app**. Hasta que se carguen, cualquier asistente
conectado responde sobre datos incompletos.

Relacionado: [[user_santiago_dinero]] · [[project_nexum_entrega]]
