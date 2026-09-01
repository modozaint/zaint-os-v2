/**
 * ⭐ QUE LAS PANTALLAS NO SE RECARGUEN DESDE CERO.
 *
 * Santiago (2026-08-26): *«me parece que es mejor que las interfaces no se
 * tengan que volver a cargar desde cero, sino que con solo una entrada ya
 * queden cargadas y así todo es más rápido»*.
 *
 * `staleTimes` le dice al router del navegador cuánto puede reusar una
 * pantalla ya visitada. Con 60 s, volver a una que abriste hace un momento es
 * INSTANTÁNEO: no hay viaje a Canadá, no hay render, aparece.
 *
 * 🔴 POR QUÉ NO SE ACTIVÓ ANTES, y qué cambió: el riesgo era mostrar el HUD
 * con la vida vieja justo después de marcar un hábito — la cicatriz del 18-ago,
 * cuando la vida no se movía. Se puede activar AHORA porque las acciones ya
 * invalidan de verdad lo que cambian: `refrescar()` en `acciones.ts` cubre `/`
 * y `/habitos`, que comparten los mismos datos y hasta hoy solo se refrescaba
 * una de las dos. Sin ese arreglo, esto habría sido un bug garantizado.
 */
module.exports = {
  reactStrictMode: true,
  experimental: {
    staleTimes: {
      // Una pantalla con datos: se reusa un minuto. Marcar algo la invalida
      // igualmente, así que el minuto solo aplica a lo que nadie tocó.
      dynamic: 60,
      // Lo que no cambia casi nunca.
      static: 300,
    },
  },
}
