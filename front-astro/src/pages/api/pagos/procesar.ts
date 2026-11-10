import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import { createHmac } from 'node:crypto'
import { consultarBackend, CONSULTAR_PEDIDO } from '../../../lib/betonosServer'

// con tarjeta no existe "pendiente", si no se acredita se borra el pedido
async function eliminarPedidoFallido(pedidoId: string) {
  try {
    await consultarBackend(`
      mutation ($id: ID!) { eliminarPedidoPendiente(id: $id) }
    `, { id: pedidoId })
  } catch (error) {
    console.error('[MP Orders: no se pudo borrar el pedido fallido]', error)
  }
}

// usamos Orders, no Payments.create(). el Brick tokeniza, aquí nunca llega el PAN ni el CVV
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

// mensajes según el status_detail de MP. la API de Orders no manda el prefijo
// "cc_rejected_" que sí usaba la API vieja, por eso las claves van sin eso
const MENSAJES_STATUS_DETAIL: Record<string, string> = {
  accredited: 'Pago aprobado.',
  other_reason: 'Rechazado por un error general del banco. Intenta de nuevo o usa otra tarjeta.',
  pending_contingency: 'El pago quedó pendiente de revisión del banco. Con tarjeta esto no es válido: no se confirmará el pedido, intenta de nuevo o usa otra tarjeta.',
  pending_review_manual: 'El pago quedó pendiente de revisión manual. Con tarjeta esto no es válido: no se confirmará el pedido, intenta de nuevo o usa otra tarjeta.',
  call_for_authorize: 'Rechazado: debes autorizar este pago directamente con tu banco antes de reintentar.',
  insufficient_amount: 'Rechazado por fondos insuficientes en la tarjeta.',
  bad_filled_security_code: 'Rechazado: el código de seguridad (CVV) es inválido.',
  bad_filled_date: 'Rechazado: la fecha de vencimiento es inválida o la tarjeta ya venció.',
  bad_filled_other: 'Rechazado: hay un error en los datos del formulario de la tarjeta.',
  bad_filled_card_number: 'Rechazado: el número de tarjeta es inválido.',
  bad_filled_card_data: 'Rechazado: faltan datos de la tarjeta o están mal capturados (número, fecha o CVV).',
  invalid_installments: 'Rechazado: el número de cuotas elegido no es válido para esta tarjeta.',
  duplicated_payment: 'Rechazado: ya se registró un pago idéntico hace unos instantes. Revisa el pedido antes de volver a pagar.',
  card_disabled: 'Rechazado: la tarjeta está deshabilitada. Debes activarla llamando a tu banco.',
  card_type_not_allowed: 'Rechazado: este tipo de tarjeta no está permitido para esta compra.',
  max_attempts: 'Rechazado: se superó el número de intentos permitidos con el PIN de la tarjeta.',
  blacklist: 'Rechazado: el banco marcó esta tarjeta como no segura.',
  unsupported: 'Este medio de pago no es compatible con la operación solicitada.',
  failed: 'Rechazado por un error general al procesar la tarjeta. Intenta de nuevo o usa otra tarjeta.',
}

function mensajeParaStatusDetail(detalle: string | undefined) {
  if (!detalle) return 'El pago no fue aprobado. Intenta de nuevo o usa otra tarjeta.'
  const normalizado = detalle.replace(/^cc_rejected_/, '')
  return MENSAJES_STATUS_DETAIL[normalizado] || `El pago no fue aprobado (motivo: ${detalle}). Intenta de nuevo o usa otra tarjeta.`
}

// no confiamos en lo que manda el navegador para marcar la venta como pagada
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
    // llave fija por pedido para no duplicar cargos si falla la red y se reintenta
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
      // cuando MP rechaza al crear la order, el motivo real no está en errors[].code
      // (siempre dice "failed") sino en data.transactions.payments[0].status_detail
      const statusDetailCreacion = respuesta?.data?.transactions?.payments?.[0]?.status_detail
      console.error('[MP Orders create] rechazada al crear', { status: r.status, statusDetail: statusDetailCreacion })
      await eliminarPedidoFallido(id)
      return Response.json({
        error: mensajeParaStatusDetail(statusDetailCreacion),
        statusDetail: statusDetailCreacion,
      }, { status: 402 })
    }

    const idOrder = String(respuesta.id || '')
    if (!VALID_ORDER_ID.test(idOrder)) {
      // puede que sí se haya creado, mejor no reintentar a ciegas
      console.error('[MP Orders create] No se recibió ID de order verificable')
      return Response.json({ error: 'MP respondió sin ID verificable. Consulta el pedido antes de reintentar.' }, { status: 502 })
    }

    // segunda consulta a MP, solo confirmamos lo que se verificó del lado del servidor
    const order = await obtenerOrder(idOrder, token)
    const pagoIntento = order?.transactions?.payments?.[0]
    const statusDetail = pagoIntento?.status_detail || order.status_detail

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
      return Response.json({ pedidoId: id, estado: order.status, orderId: idOrder })
    }

    // con tarjeta "pending" no cuenta como válido (distinto a OXXO), el banco
    // responde al instante así que se trata como rechazo y queda pendiente para reintentar
    console.error('[MP Orders: pago no acreditado]', { status: order.status, statusDetail })
    await eliminarPedidoFallido(id)
    return Response.json({
      error: mensajeParaStatusDetail(statusDetail),
      estado: order.status,
      statusDetail,
      orderId: idOrder,
    }, { status: 402 })
  } catch (error) {
    console.error('[MP Orders: error durante procesamiento]', error instanceof Error ? error.message : error)
    return Response.json({ error: 'No se pudo verificar el resultado del pago. Consulta el estado antes de reintentar.' }, { status: 502 })
  }
}
