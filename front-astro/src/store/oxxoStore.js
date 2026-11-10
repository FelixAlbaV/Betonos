// guarda la ficha oxxo en localStorage para no perderla al recargar
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
