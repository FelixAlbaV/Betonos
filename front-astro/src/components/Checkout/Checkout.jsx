import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import { CodigoBarras } from '../CodigoBarras/CodigoBarras'
import { useCartStore } from '../../store/cartStore'
import { useOxxoStore } from '../../store/oxxoStore'
import { useAppContext } from '../../context/AppContext'
import estilos from './Checkout.module.css'

const stripePublica = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
const mercadoPagoPublica = import.meta.env.PUBLIC_MP_PUBLIC_KEY

async function solicitar(ruta, cuerpo) {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) throw new Error(datos.error || 'No se pudo preparar el pago.')
  return datos
}

function FormularioStripe({ clientSecret, pedidoId }) {
  const [stripe, setStripe] = useState(null)
  useEffect(() => {
    if (stripePublica) setStripe(loadStripe(stripePublica))
  }, [])
  const opciones = useMemo(() => ({
    clientSecret,
    onComplete: () => window.location.assign(`/pago?pedido=${encodeURIComponent(pedidoId)}`),
  }), [clientSecret, pedidoId])

  if (!stripe) return <p>Cargando formulario seguro de Stripe…</p>
  return (
    <div className={estilos.pasarela}>
      <EmbeddedCheckoutProvider stripe={stripe} options={opciones}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

function FormularioOxxo({ pedido, alError }) {
  const [generando, setGenerando] = useState(false)
  const [ficha, setFicha] = useState(null)
  const guardarFicha = useOxxoStore((estado) => estado.guardarFicha)
  const obtenerFicha = useOxxoStore((estado) => estado.obtenerFicha)

  // Si ya se generó la ficha antes (en esta misma sesión del navegador),
  // se muestra la guardada en vez de volver a pedirle una a Mercado Pago.
  useEffect(() => {
    const guardada = obtenerFicha(pedido.pedidoId)
    if (guardada) setFicha(guardada)
  }, [pedido.pedidoId])

  async function generarFicha() {
    setGenerando(true)
    try {
      const datos = await solicitar('/api/pagos/oxxo', { pedidoId: pedido.pedidoId })
      setFicha(datos)
      guardarFicha(pedido.pedidoId, datos)
    } catch (error) {
      alError(error instanceof Error ? error.message : 'No se pudo generar la ficha de OXXO.')
    } finally {
      setGenerando(false)
    }
  }

  if (!ficha) {
    return (
      <div className={estilos.pasarela}>
        <p>Vas a pagar en efectivo, en cualquier tienda OXXO. Primero genera tu ficha:</p>
        <button type="button" className={estilos.botonPagar} onClick={generarFicha} disabled={generando}>
          {generando ? 'Generando ficha…' : 'Generar ficha de pago OXXO'}
        </button>
      </div>
    )
  }

  return (
    <div className={estilos.pasarela}>
      <p>Tu ficha ya está lista. Preséntala (en tu celular o impresa) en cualquier OXXO.</p>
      {ficha.referencia && <p>Referencia: <strong>{ficha.referencia}</strong></p>}
      {ficha.codigoBarras && <CodigoBarras valor={ficha.codigoBarras} />}
      <p className={estilos.aclaracion}>
        El pedido se marca como pagado automáticamente en cuanto Mercado Pago nos confirme el pago
        (puede tardar unos minutos después de pagar en tienda). Puedes revisar el estado en{' '}
        <a href={`/pago?pedido=${encodeURIComponent(pedido.pedidoId)}`}>esta página</a>.
      </p>
    </div>
  )
}

function FormularioMercadoPago({ pedido, alRechazar, alError }) {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    if (mercadoPagoPublica) {
      initMercadoPago(mercadoPagoPublica, { locale: 'es-MX' })
      setListo(true)
    }
  }, [])

  const procesar = async (datosTarjeta, datosAdicionales) => {
    try {
      const resultado = await solicitar('/api/pagos/procesar', {
        pedidoId: pedido.pedidoId,
        datosTarjeta,
        // Orders exige tipo de tarjeta; el Brick lo entrega como paymentTypeId.
        tipoPago: datosAdicionales?.paymentTypeId || datosTarjeta?.payment_type_id,
      })
      if (resultado.estado === 'rejected' || resultado.estado === 'cancelled') {
        alRechazar('El pago fue rechazado. Revisa tu tarjeta e inicia un nuevo intento.')
        return
      }
      // No declarar PAGADO hasta que el servidor confirme con Mercado Pago.
      window.location.assign(`/pago?pedido=${encodeURIComponent(pedido.pedidoId)}`)
    } catch (error) {
      // Una caída de red no demuestra que el cargo haya fallado.
      alError(`No se pudo verificar el resultado. Revisa el estado del pedido #${pedido.pedidoId} antes de intentar de nuevo.`)
      throw error
    }
  }

  if (!listo) return <p>Cargando formulario seguro de Mercado Pago…</p>
  return (
    <div className={estilos.pasarela}>
      <CardPayment
        initialization={{ amount: pedido.total }}
        onSubmit={procesar}
        onError={() => alError(`Revisa el formulario o consulta el pedido #${pedido.pedidoId} antes de volver a intentar el cobro.`)}
      />
    </div>
  )
}

export function Checkout({ onVolver, user }) {
  const items = useCartStore((estado) => estado.items)
  const totalPrecio = useCartStore((estado) => estado.totalPrecio())
  const { formatearPrecio } = useAppContext()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [metodo, setMetodo] = useState('stripe')
  const [iniciando, setIniciando] = useState(false)
  const [preparado, setPreparado] = useState(null)
  const [error, setError] = useState('')

  async function comenzar(evento) {
    evento.preventDefault()
    if (iniciando || preparado || !items.length || !user?.email) return
    if (metodo === 'stripe' && !stripePublica) {
      setError('Falta PUBLIC_STRIPE_PUBLISHABLE_KEY en front-astro/.env')
      return
    }
    if (metodo === 'mercadopago' && !mercadoPagoPublica) {
      setError('Falta PUBLIC_MP_PUBLIC_KEY en front-astro/.env')
      return
    }

    setError('')
    setIniciando(true)
    try {
      // OXXO usa el mismo endpoint que Mercado Pago con tarjeta: ambos solo
      // necesitan registrar el pedido. La diferencia está en cómo se cobra.
      const ruta = metodo === 'stripe' ? '/api/pagos/stripe/crear' : '/api/pagos/crear'
      const datos = await solicitar(ruta, {
        nombre,
        items: items.map(({ id, cantidad }) => ({ productoId: id, cantidad })),
      })
      if (!datos.pedidoId || (metodo === 'stripe' ? !datos.clientSecret : !Number.isFinite(datos.total))) {
        throw new Error('Respuesta incompleta del servidor de pagos.')
      }
      localStorage.setItem('betonos-ultimo-pedido', String(datos.pedidoId))
      setPreparado({ ...datos, metodo })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible iniciar el pago.')
    } finally {
      setIniciando(false)
    }
  }

  if (!user?.email) return (
    <section>
      <h2 className={estilos.titulo}>Finalizar compra</h2>
      <p>Inicia sesión para pagar tus artículos.</p>
      <a href="/login">Iniciar sesión</a>
    </section>
  )

  return (
    <section className={estilos.checkout}>
      <button className={estilos.volver} type="button" onClick={onVolver}>
        ← Volver al carrito
      </button>
      <h2 className={estilos.titulo}>Finalizar compra</h2>

      <form className={estilos.formulario} onSubmit={comenzar}>
        <div className={estilos.campo}>
          <label htmlFor="nombre">Nombre completo</label>
          <input id="nombre" value={nombre} required maxLength={120}
            onChange={(e) => setNombre(e.target.value)} disabled={!!preparado || iniciando}/>
        </div>
        <div className={estilos.campo}>
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" type="email" value={user.email} readOnly />
        </div>
        <fieldset className={estilos.metodos} disabled={!!preparado || iniciando}>
          <legend>Elige cómo pagar</legend>
          <label><input type="radio" name="metodo" checked={metodo === 'stripe'}
            onChange={() => setMetodo('stripe')}/> Stripe</label>
          <label><input type="radio" name="metodo" checked={metodo === 'mercadopago'}
            onChange={() => setMetodo('mercadopago')}/> Mercado Pago </label>
          <label><input type="radio" name="metodo" checked={metodo === 'oxxo'}
            onChange={() => setMetodo('oxxo')}/> OXXO Pay (Pago en sucursal Oxxo)</label>
        </fieldset>
        <div className={estilos.resumen}>
          <span>{items.length} producto(s)</span>
          <strong>{formatearPrecio(totalPrecio)}</strong>
        </div>
        {error && <p className={estilos.errorTexto} role="alert">{error}</p>}
        {!preparado && (
          <button type="submit" className={estilos.botonPagar}
            disabled={iniciando || items.length === 0}>
            {iniciando ? 'Preparando pago…' : `Continuar con ${
              metodo === 'stripe' ? 'Stripe' : metodo === 'mercadopago' ? 'Mercado Pago' : 'OXXO Pay'
            }`}
          </button>
        )}
      </form>

      {preparado && (
        <div className={estilos.pagoIntegrado}>
          <h3>Pago seguro con {
            preparado.metodo === 'stripe' ? 'Stripe' : preparado.metodo === 'mercadopago' ? 'Mercado Pago' : 'OXXO Pay'
          }</h3>
          <p className={estilos.aclaracion}>
            Pedido #{preparado.pedidoId}. Los datos bancarios se capturan únicamente en el formulario oficial del proveedor.
          </p>
          {preparado.metodo === 'stripe' ? (
            <FormularioStripe key={preparado.pedidoId} clientSecret={preparado.clientSecret}
              pedidoId={preparado.pedidoId} />
          ) : preparado.metodo === 'oxxo' ? (
            <FormularioOxxo key={preparado.pedidoId} pedido={preparado} alError={setError} />
          ) : (
            <FormularioMercadoPago key={preparado.pedidoId} pedido={preparado}
              alError={setError}
              alRechazar={(mensaje) => { setError(mensaje); setPreparado(null) }} />
          )}
        </div>
      )}
    </section>
  )
}
