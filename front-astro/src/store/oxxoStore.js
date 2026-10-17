// src/store/oxxoStore.js
// Guarda la ficha de pago OXXO en localStorage (mismo patrón que cartStore),
// para poder volver a verla después de cerrar o recargar la página, sin
// tener que generar otra ficha ni volver a llamar a Mercado Pago.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useOxxoStore = create(persist((set, get) => ({
  fichas: {}, // { [pedidoId]: { referencia, codigoBarras, orderId } }

  guardarFicha: (pedidoId, ficha) => {
    set({ fichas: { ...get().fichas, [pedidoId]: ficha } })
  },

  obtenerFicha: (pedidoId) => get().fichas[pedidoId] ?? null,
}), {
  name: 'betonos-oxxo-fichas',
}))
