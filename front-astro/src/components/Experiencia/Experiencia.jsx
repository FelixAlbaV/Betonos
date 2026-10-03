// src/components/Experiencia/Experiencia.jsx
// Sección de contexto para el Home: le da cuerpo a la página con 3 razones
// para comprar en Betonos, antes de mostrar el grid de categorías.
import estilos from './Experiencia.module.css'

const RAZONES = [
  {
    icono: '🎧',
    titulo: 'Equipo especializado',
    texto: 'Modelos pensados para gamers, músicos y uso diario, según tu estilo de vida.',
  },
  {
    icono: '🔎',
    titulo: 'Elige con claridad',
    texto: 'Consulta precio, disponibilidad y características antes de agregar algo al carrito.',
  },
  {
    icono: '📦',
    titulo: 'Compra directa',
    texto: 'Compra directamente con Betonos, sin depender de plataformas externas.',
  },
]

export function Experiencia() {
  return (
    <section className={estilos.seccion}>
      <div className={estilos.encabezado}>
        <span className={estilos.etiqueta}>EXPERIENCIA BETONOS</span>
        <h2 className={estilos.titulo}>Más que comprar equipo</h2>
        <p className={estilos.texto}>
          Una experiencia directa con la marca, pensada para ayudarte a elegir el equipo ideal
          para tu entrenamiento.
        </p>
      </div>

      <div className={estilos.grid}>
        {RAZONES.map((razon) => (
          <div key={razon.titulo} className={estilos.tarjeta}>
            <h3>
              {razon.icono} {razon.titulo}
            </h3>
            <p>{razon.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
