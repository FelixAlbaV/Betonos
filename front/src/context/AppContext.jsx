// src/context/AppContext.jsx
import { createContext, useContext, useMemo } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const valor = useMemo(
    () => ({
      formatearPrecio: (numero) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numero),
      envioGratisDesde: 999,
      mensajeSitio: 'Envío gratis en pedidos mayores a $999 MXN.',
    }),
    []
  )

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const contexto = useContext(AppContext)
  if (!contexto) {
    throw new Error('useAppContext debe usarse dentro de un <AppProvider>')
  }
  return contexto
}
