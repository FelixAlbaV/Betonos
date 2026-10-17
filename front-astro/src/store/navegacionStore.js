// src/store/navegacionStore.js
//
// ¿Por qué existe este archivo?
// Antes toda la navegación (qué "vista" se muestra: inicio, categoría,
// carrito, checkout...) vivía dentro de un solo componente React gigante
// (App.jsx) con un useReducer local. Eso obligaba a montar TODO junto en
// una sola isla de Astro, porque solo un componente conocía el estado.
//
// Ahora la navegación vive en un store de Zustand (igual que ya se hacía
// con el carrito en cartStore.js). Así, cada isla de Astro puede montarse
// por separado, "escuchar" solo el pedazo de estado que le interesa, y
// mostrarse u ocultarse sola, sin depender de un componente padre común.
import { create } from 'zustand'

// Las "vistas" posibles del flujo de compra. No usamos react-router ni
// cambiamos la URL: es navegación 100% por estado, igual que antes.
export const VISTAS = {
  HOME: 'home',
  CATEGORIA: 'categoria',
  CARRITO: 'carrito',
  CHECKOUT: 'checkout',
  CONFIRMACION: 'confirmacion',
}

export const useNavegacionStore = create((set) => ({
  vista: VISTAS.HOME,
  categoriaId: null,
  categoriaNombre: null,
  productoId: null, // si no es null, el modal de detalle de producto está abierto
  ultimoPedido: null,

  irAHome: () =>
    set({
      vista: VISTAS.HOME,
      categoriaId: null,
      categoriaNombre: null,
      productoId: null,
      ultimoPedido: null,
    }),

  irACategoria: (categoriaId, categoriaNombre) =>
    set({ vista: VISTAS.CATEGORIA, categoriaId, categoriaNombre }),

  abrirProducto: (productoId) => set({ productoId }),
  cerrarProducto: () => set({ productoId: null }),

  irACarrito: () => set({ vista: VISTAS.CARRITO, productoId: null }),
  irACheckout: () => set({ vista: VISTAS.CHECKOUT }),

  confirmarPedido: (pedido) => set({ vista: VISTAS.CONFIRMACION, ultimoPedido: pedido }),
}))
