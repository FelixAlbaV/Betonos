// src/components/Hero/Hero.jsx
import estilos from './Hero.module.css'

export function Hero() {
  return (
    <section className={estilos.hero}>
      <div className={estilos.franja} />
      <h2 className={estilos.titulo}>Tu sonido. Tu marca. Tu experiencia.</h2>
      <p className={estilos.subtitulo}>
        Audífonos gamer, de música, diario y más, seleccionados para cada
        estilo de vida. Elige una categoría del menú para ver el catálogo completo.
      </p>
    </section>
  )
}
