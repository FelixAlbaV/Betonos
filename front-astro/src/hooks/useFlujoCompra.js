// src/hooks/useFlujoCompra.js
import { useReducer } from 'react'

// Vistas posibles del flujo. La navegación se controla 100% con estado
// (useReducer) y eventos de la UI, sin usar react-router ni cambiar la URL.
const VISTAS = {
  HOME: 'home',
  CATEGORIA: 'categoria',
  CARRITO: 'carrito',
  CHECKOUT: 'checkout',
  CONFIRMACION: 'confirmacion',
}

const estadoInicial = {
  vista: VISTAS.HOME,
  categoriaId: null,
  categoriaNombre: null,
  productoId: null, // si no es null, el modal de detalle de producto está abierto
  ultimoPedido: null,
}

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'IR_A_HOME':
      return { ...estadoInicial }
    case 'IR_A_CATEGORIA':
      return {
        ...estado,
        vista: VISTAS.CATEGORIA,
        categoriaId: accion.categoriaId,
        categoriaNombre: accion.categoriaNombre,
      }
    case 'ABRIR_PRODUCTO':
      return { ...estado, productoId: accion.productoId }
    case 'CERRAR_PRODUCTO':
      return { ...estado, productoId: null }
    case 'IR_A_CARRITO':
      return { ...estado, vista: VISTAS.CARRITO, productoId: null }
    case 'IR_A_CHECKOUT':
      return { ...estado, vista: VISTAS.CHECKOUT }
    case 'CONFIRMAR_PEDIDO':
      return { ...estado, vista: VISTAS.CONFIRMACION, ultimoPedido: accion.pedido }
    default:
      return estado
  }
}

export function useFlujoCompra() {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)

  return {
    ...estado,
    VISTAS,
    irAHome: () => dispatch({ tipo: 'IR_A_HOME' }),
    irACategoria: (categoriaId, categoriaNombre) =>
      dispatch({ tipo: 'IR_A_CATEGORIA', categoriaId, categoriaNombre }),
    abrirProducto: (productoId) => dispatch({ tipo: 'ABRIR_PRODUCTO', productoId }),
    cerrarProducto: () => dispatch({ tipo: 'CERRAR_PRODUCTO' }),
    irACarrito: () => dispatch({ tipo: 'IR_A_CARRITO' }),
    irACheckout: () => dispatch({ tipo: 'IR_A_CHECKOUT' }),
    confirmarPedido: (pedido) => dispatch({ tipo: 'CONFIRMAR_PEDIDO', pedido }),
  }
}
