// src/components/Skeleton/Skeleton.jsx
import estilos from './Skeleton.module.css'

export function Skeleton({ width = '100%', height = '16px', style }) {
  return <div className={estilos.bloque} style={{ width, height, ...style }} />
}

export function SkeletonTarjetaProducto() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height="180px" />
      <Skeleton height="18px" width="80%" />
      <Skeleton height="14px" width="50%" />
    </div>
  )
}
