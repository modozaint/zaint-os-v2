---
name: feedback-desplegar-sin-preguntar
description: "Desde el 2026-08-26 la IA hace push y despliega las apps de Santiago sola, sin pedir permiso. Publicar contenido a una audiencia y gastar dinero siguen siendo suyos. Con las 3 condiciones que lo mantienen reversible."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b4303dfc-63ab-4dab-a5de-4aa02064cefd
  modified: 2026-08-26T17:15:00.842Z
---

**Santiago autorizó el 2026-08-26 que la IA haga `git commit`, `git push` a sus repos y el deploy
que ese push dispare (Vercel).** Sin preguntar, sin confirmar cada vez. Textual: *«quiero que tú
puedas hacer todo esto: que tú puedas hacer push, que puedas desplegarlo en vercel y que yo solo sea
decirte lo que quiero y tú lo hagas.»*

Aplica a sus apps: `dermatinta-content-os` (Content OS), `founderos` (videojuego-vida),
`zaint-os-vault`, LeadHunter.

**Why:** la protección P4 decía «publicar y gastar dinero son de Santiago» y la palabra «publicar»
estaba tapando dos cosas que no se parecen. Desplegar una app suya lo ven **él y Víctor detrás de un
login**, y se deshace con un `git revert` + push en minutos. Sacar contenido a una audiencia no se
deshace: quien lo vio, ya lo vio. Solo la segunda necesita que el botón lo apriete él.

**How to apply:** desplegar y contarlo después, con tres condiciones que no son burocracia — son lo
que mantiene el deploy reversible:

1. **El build pasa ANTES del push.** Un deploy roto no avisa: el celular sigue mostrando la versión
   de ayer y nadie sabe por qué.
2. **Comprobar que quedó en vivo** y pegar la evidencia. Push ≠ desplegado. La buena es el
   deployment de GitHub (`gh api repos/<owner>/<repo>/deployments`): trae el SHA, el entorno y
   `state=success`. Un código HTTP de la URL no prueba que el código nuevo esté arriba, y un **307
   en una ruta con login es correcto** — es el middleware mandando a `/entrar`, no un 404.
3. **Decir qué se subió y con qué commit**, para que revertirlo sea una línea y no una búsqueda.

🔴 **Lo que NO está autorizado y suponerlo sería el error:** publicar contenido a una audiencia
(Instagram, TikTok, la tienda Shopify en vivo, mandar un mensaje a un tercero) y gastar dinero.
Si algún día lo extiende a redes, es una frase suya y se escribe en [[reference-zaint-vault-location]]
→ `SISTEMA/PROTECCIONES.md` P4.

Escrito también en el vault, que es donde manda: `SISTEMA/PROTECCIONES.md` P4 y `CLAUDE.md` §5.
Relacionado: [[feedback-zaint-governing-rules]] · [[feedback-estandar-verificacion]].
