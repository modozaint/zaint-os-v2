-- ================================================================
-- Content OS — Migración 006: el autor de cada pieza
--
-- El banco de ideas es compartido entre Santiago y Víctor. Una idea
-- sin autor pierde justo lo que la hace útil: poder volver a
-- preguntarle a quien la propuso qué tenía en la cabeza.
--
-- NO se crea una tabla `ideas`. Una idea ES una pieza en estado
-- `idea` — el mismo ciclo que ya describe 003. Dos tablas para lo
-- mismo significan dos títulos que dejan de coincidir en cuanto
-- alguien edita uno.
--
-- Idempotente: se puede correr varias veces sin romper nada.
-- ================================================================

alter table piezas add column if not exists autor text;

-- Se consulta "las ideas sin procesar, la más nueva primero" en cada
-- carga de la pantalla de Plan. Sin este índice es un scan de tabla.
create index if not exists piezas_autor_idx on piezas (autor);

-- ⚠️ A propósito SIN constraint de lista cerrada.
--
-- Los estados sí la tienen porque inventarse uno rompe el tablero.
-- Los autores no: el día que entre una tercera persona, agregarla
-- tiene que costar una línea en `lib/usuarios.ts` y no una migración
-- en producción. La lista cerrada vive en el código, donde se lee.

-- Las 8 piezas que ya existían quedan con autor NULL, y está bien:
-- se escribieron antes de que hubiera usuarios. Ponerles "Santiago"
-- sería inventar un dato — probablemente cierto, pero inventado.
