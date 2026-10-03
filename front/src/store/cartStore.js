// src/store/cartStore.js
import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [], // { id, nombre, precio, imagen, cantidad, stock }

  agregarItem: (producto) => {
    const items = get().items
    const existente = items.find((i) => i.id === producto.id)

    if (existente) {
      set({
        items: items.map((i) =>
          i.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
            : i
        ),
      })
    } else {
      set({ items: [...items, { ...producto, cantidad: 1 }] })
    }
  },

  cambiarCantidad: (id, cantidad) => {
    set({
      items: get()
        .items.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) } : i)),
    })
  },

  quitarItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) })
  },

  vaciarCarrito: () => set({ items: [] }),

  // Selectores derivados
  totalItems: () => get().items.reduce((suma, i) => suma + i.cantidad, 0),
  totalPrecio: () => get().items.reduce((suma, i) => suma + i.cantidad * i.precio, 0),
}))
