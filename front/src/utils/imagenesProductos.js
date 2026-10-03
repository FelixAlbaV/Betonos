// src/utils/imagenesProductos.js
// Mapa de `producto.imagen` (nombre de archivo que ya devuelve el backend)
// hacia una URL real de imagen. Las fotos son de Pexels (uso libre, sin
// necesidad de licencia) y se eligieron por su relación con cada producto.
export const IMAGENES_PRODUCTOS = {
  'audifonos-gamer-rgb.jpg':
    'https://images.pexels.com/photos/11398246/pexels-photo-11398246.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-gamer-surround.jpg':
    'https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-estudio-hifi.jpg':
    'https://images.pexels.com/photos/5650531/pexels-photo-5650531.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-monitor-estudio.jpg':
    'https://images.pexels.com/photos/2919003/pexels-photo-2919003.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-casual-lite.jpg':
    'https://images.pexels.com/photos/7054718/pexels-photo-7054718.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-urban-comfort.jpg':
    'https://images.pexels.com/photos/4547849/pexels-photo-4547849.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-jbl-deporte.jpg':
    'https://images.pexels.com/photos/3081173/pexels-photo-3081173.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-basicos-everyday.jpg':
    'https://images.pexels.com/photos/185030/pexels-photo-185030.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-economicos-sport.jpg':
    'https://images.pexels.com/photos/17743351/pexels-photo-17743351.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-cable-studio.jpg':
    'https://images.pexels.com/photos/20385204/pexels-photo-20385204.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-cable-classic.jpg':
    'https://images.pexels.com/photos/12671308/pexels-photo-12671308.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-inalambricos-pro.jpg':
    'https://images.pexels.com/photos/7772548/pexels-photo-7772548.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-inalambricos-redbeat.jpg':
    'https://images.pexels.com/photos/5269699/pexels-photo-5269699.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-diadema-comfort.jpg':
    'https://images.pexels.com/photos/210927/pexels-photo-210927.jpeg?auto=compress&cs=tinysrgb&w=800',
  'audifonos-diadema-deluxe.jpg':
    'https://images.pexels.com/photos/210926/pexels-photo-210926.jpeg?auto=compress&cs=tinysrgb&w=800',
}

export function obtenerImagenProducto(nombreArchivo) {
  return IMAGENES_PRODUCTOS[nombreArchivo] ?? null
}
