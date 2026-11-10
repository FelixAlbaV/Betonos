// store de zustand para la navegación, así cada isla puede montarse
// por separado sin depender de un componente padre
import { create } from 'zustand'

// no usamos react-router, la navegación es solo por estado
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
  productoId: null, // si tiene valor, el modal de producto está abierto
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
