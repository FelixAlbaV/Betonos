import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import { createHmac } from 'node:crypto'
import { consultarBackend, CONSULTAR_PEDIDO } from '../../../lib/betonosServer'

// Checkout API via Orders, NO Payments.create() (/v1/payments).
// El CardPayment Brick tokeniza los datos; este endpoint NUNCA recibe PAN ni CVV.
const VALID_ORDER_ID = /^[A-Z0-9][A-Z0-9_-]{9,99}$/
const dinero = (valor: number) => valor.toFixed(2)

async function obtenerOrder(id: string, token: string) {
  if (!VALID_ORDER_ID.test(id)) throw new Error('ID de order inválido')
  const r = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`No se pudo verificar la order en Mercado Pago (${r.status}).`)
  return r.json()
}

// No usamos la respuesta del navegador para declarar una venta pagada.
function acreditada(order: any, pedidoId: string, total: number) {
  const pagos = order?.transactions?.payments
  const monedaCompatible = (!order.currency_id || order.currency_id === 'MXN') &&
    (!order.country_code || order.country_code === 'MEX')
  return VALID_ORDER_ID.test(String(order?.id ?? '')) &&
    String(order.external_reference) === pedidoId &&
    monedaCompatible &&
    order.status === 'processed' && order.status_detail === 'accredited' &&
    Math.round(Number(order.total_amount) * 100) === Math.round(total * 100) &&
    Math.round(Number(order.total_paid_amount) * 100) === Math.round(total * 100) &&
    Array.isArray(pagos) && pagos.length === 1 &&
    pagos[0].status === 'processed' && pagos[0].status_detail === 'accredited' &&
    Math.round(Number(pagos[0].amount) * 100) === Math.round(total * 100)
}

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)
  if (!sesion?.user?.email) return Response.json({ error: 'Inicia sesión.' }, { status: 401 })
  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 })

  try {
    const { pedidoId, datosTarjeta, tipoPago } = await request.json()
    const id = String(pedidoId)
    if (!/^\d+$/.test(id) || !datosTarjeta ||
        typeof datosTarjeta.token !== 'string' || !datosTarjeta.token ||
        !Number.isSafeInteger(datosTarjeta.installments) ||
        datosTarjeta.installments < 1 || datosTarjeta.installments > 48 ||
        !/^[a-z0-9_-]{2,40}$/i.test(String(datosTarjeta.payment_method_id || '')) ||
        !['credit_card', 'debit_card'].includes(tipoPago)) {
      return Response.json({ error: 'Datos de pago inválidos o falta el tipo de tarjeta.' }, { status: 400 })
    }

    const token = import.meta.env.MP_ACCESS_TOKEN
    const clave = import.meta.env.BETONOS_INTERNAL_KEY
    if (!token || !clave) throw new Error('Falta configurar el token privado de MP o la clave interna.')

    const { pedido } = await consultarBackend(CONSULTAR_PEDIDO, { id })
    if (!pedido || pedido.clienteEmail.toLowerCase() !== sesion.user.email.toLowerCase()) {
      return Response.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }
    if (pedido.estado !== 'PENDIENTE' || !Number.isFinite(pedido.total) || pedido.total <= 0) {
      return Response.json({ error: 'Pedido procesado o con monto inválido.' }, { status: 409 })
    }

    const total = dinero(pedido.total)
    // Llave fija por pedido: no duplicar cargos en reintentos / caídas de red.
    const idempotencyKey = createHmac('sha256', clave).update(`mp-orders:${id}`).digest('hex')
    const r = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        type: 'online',
        processing_mode: 'automatic',
        external_reference: id,
        total_amount: total,
        payer: { email: sesion.user.email },
        transactions: { payments: [{
          amount: total,
          payment_method: {
            id: datosTarjeta.payment_method_id,
            type: tipoPago,
            token: datosTarjeta.token,
            installments: datosTarjeta.installments,
          },
        }] },
      }),
    })
    const respuesta = await r.json().catch(() => ({}))
    if (!r.ok) {
      // No registrar datos de la tarjeta ni secretos en consola. Si hay duda, no reintentar.
      const codigos = (respuesta.errors || respuesta.cause || []).map?.((e: any) => e.code)?.join(', ') || ''
      console.error('[MP Orders create]', { status: r.status, error: respuesta.error, code: codigos })
      return Response.json({ error: `Mercado Pago rechazó la solicitud (HTTP ${r.status}${codigos ? ', ' + codigos : ''}). Revisa la terminal.` }, { status: 502 })
    }

    const idOrder = String(respuesta.id || '')
    if (!VALID_ORDER_ID.test(idOrder)) {
      // Puede haberse creado la order, nunca repetir a ciegas.
      console.error('[MP Orders create] No se recibió ID de order verificable')
      return Response.json({ error: 'MP respondió sin ID verificable. Consulta el pedido antes de reintentar.' }, { status: 502 })
    }

    // Segunda consulta a MP: solo confirmamos pagos acreditados y verificados en servidor.
    const order = await obtenerOrder(idOrder, token)
    if (acreditada(order, id, pedido.total)) {
      try {
        await consultarBackend(`
          mutation ($pedidoId: ID!, $paymentId: String!, $monto: Float!, $moneda: String!) {
            confirmarPagoMercadoPago(pedidoId: $pedidoId, paymentId: $paymentId,
              monto: $monto, moneda: $moneda) { id estado }
          }
        `, { pedidoId: id, paymentId: idOrder, monto: pedido.total, moneda: 'MXN' })
      } catch (error) {
        console.error('[MP order acreditada: revisión de pedido requerida]', error)
      }
    }
    return Response.json({ pedidoId: id, estado: order.status, orderId: idOrder })
  } catch (error) {
    console.error('[MP Orders: error durante procesamiento]', error instanceof Error ? error.message : error)
    return Response.json({ error: 'No se pudo verificar el resultado del pago. Consulta el estado antes de reintentar.' }, { status: 502 })
  }
}
