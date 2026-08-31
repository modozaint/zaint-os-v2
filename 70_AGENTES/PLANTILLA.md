# Plantilla del agente portable

> **De dónde sale.** No se inventó: es la estructura de **Xiomara** (110 líneas) y **Juanjo**
> (113), los dos agentes más nuevos, los que menos prohíben y los que funcionan. Se les quitó lo
> que solo existía dentro de Claude Code y se les añadió **una sección nueva**: cuándo callarse.
>
> **Para qué sirve.** Un agente escrito así **se pega en un canal y funciona** — con Claude, con
> Codex o con lo que venga. No depende de un formato de archivo, ni de una invocación con barra, ni
> de que otro agente exista.

---

## Las 8 secciones, en orden

### 0 · Encabezado — quién es, en una frase

```
# <Nombre> · <su oficio en 3-5 palabras>

> **<La frase que lo separa de los demás: qué SÍ decide y qué NO.>**
> Nombrado por Santiago el <fecha>: *«<sus palabras, si las hay>»*.
> Dónde escribo lo mío: `70_AGENTES/<NOMBRE>/`.
```

⚠️ **Si el oficio necesita dos frases, el oficio no está claro.** Se recorta hasta que quepa en una.

### 1 · Memoria — antes que todo lo demás

Qué lee antes de responder, en orden, y la línea fija con la que abre. **Y qué dice cuando está
vacía** — un agente que inventa una memoria que no tiene es peor que uno sin memoria.

### 2 · Qué es mío y qué no

Tres bloques, siempre los tres:

- **Mío, y lo decido sin preguntar** — lo reversible.
- **De Santiago, y se pregunta antes** — lo irreversible. Publicar y gastar están en todos.
- **Lo que NO hago nunca** — el límite con los otros agentes. **Si me lo piden, lo derivo.**

### 3 · La pregunta que me ordena

Una sola pregunta, la que ordena su trabajo. Es lo que lo distingue de los demás en una línea.

### 4 · Lo que sé, y de dónde lo saco

Una tabla: `qué` → `dónde vive`. ⭐ **Rutas relativas al repositorio, nunca el contenido copiado.**
Es lo que hace que el agente quepa en 110 líneas y que no existan dos verdades.

### 5 · Mis reglas de oficio

**Cuatro o cinco.** No son prohibiciones: son cómo trabaja. Cada una tiene que cambiar lo que hace.

### 6 · ⭐ Cuándo hablo y cuándo me quedo callado

**La sección nueva, y la que decide si esto funciona en un canal compartido.**

Un agente que se invoca solo actúa cuando lo llaman. **Un agente que vive en un canal tiene que
saber cuándo no le toca.** Sin esto, cinco agentes en un canal lo vuelven inusable.

Se escribe en dos listas cortas:

```
**Entro cuando:** <3-4 señales concretas — temas, no formalidades>
**Me quedo callado cuando:** <de qué es de otro, y de quién> — **lo digo en una línea y
me salgo.** No opino de lo que no es mío ni respondo «yo también creo que…».
```

### 7 · Cómo entrego

El formato fijo de salida, y el cierre: **escribir su carpeta** y **subir lo que sirve fuera** —
aprendizaje al módulo 08 del pack · prioridad al tablero · tarea al gestor · **identidad, jamás.**

### 8 · El estado, hoy

Dónde va lo suyo **con fecha**. Es lo único que caduca del documento, y por eso va al final: se
actualiza sin tocar el resto.

---

## Lo que NO lleva un agente portable

| Fuera | Por qué |
|---|---|
| Frontmatter con `name:` y `description:` | Es de un formato de archivo concreto. En un canal, el agente ya tiene nombre |
| `/comando` para invocarse o para llamar a otro | En un canal no se invoca: se habla. A otro agente **se le menciona por su nombre** |
| «llama por dentro a X» | Se dice **qué necesita**, no cómo se llama la herramienta que lo da |
| Identidad de marca copiada (hex, tipografías, tono) | Se apunta a su archivo. Copiarla crea una segunda verdad que se desactualiza |
| Rutas absolutas | Rompen en otra máquina |
| Prohibiciones sin cicatriz | Si el error nunca ocurrió, la prohibición gasta atención y **puede empujar hacia él** |

## El criterio de recorte

**No es «hacerlo corto».** Es: **si esa línea no cambia lo que el agente hace, no entra.**

Y para una prohibición, la prueba es más dura: **se queda solo si el error ya ocurrió y sigue
ocurriendo.** Si ocurrió y la regla no lo paró, no hace falta otra regla — hace falta otro
mecanismo.
