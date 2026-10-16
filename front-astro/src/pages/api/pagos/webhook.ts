import type { APIRoute } from 'astro'
import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from 'mercadopago'
import { consultarBackend } from '../../../lib/betonosServer'

const confirmar = (pedidoId: string, pagoId: string, monto: number, moneda: string) =>
  consultarBackend(`mutation ($pedidoId: ID!, $paymentId: String!, $monto: Float!, $moneda: String!) {
    confirmarPagoMercadoPago(pedidoId: $pedidoId, paymentId: $paymentId,
      monto: $monto, moneda: $moneda) { id estado }
  }`, { pedidoId, paymentId: pagoId, monto, moneda })

// Validación independiente por servidor: no se confía en el cuerpo del webhook.
export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const cuerpo = await request.json().catch(() => ({}))
  const tipo = url.searchParams.get('type') || cuerpo.type
  if (tipo !== 'order' && tipo !== 'payment') return Response.json({ recibido: true })
  const id = String(url.searchParams.get('data.id') || cuerpo?.data?.id || '')
  if (!(tipo === 'order' ? /^[A-Z0-9][A-Z0-9_-]{9,99}$/.test(id) : /^\d+$/.test(id)))
    return Response.json({ error: 'Identificador inválido' }, { status: 400 })
  const secreto = import.meta.env.MP_WEBHOOK_SECRET
  if (!secreto) return Response.json({ error: 'Webhook no configurado' }, { status: 503 })

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature') || '',
      xRequestId: request.headers.get('x-request-id') || '',
      dataId: id,
      secret: secreto,
    })
  } catch {
    return Response.json({ error: 'Firma inválida' }, { status: 401 })
  }

  try {
    const token = import.meta.env.MP_ACCESS_TOKEN
    if (!token) throw new Error('Falta MP_ACCESS_TOKEN')
    if (tipo === 'order') {
      const r = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
      if (!r.ok) throw new Error(`Error al consultar la order ${r.status}`)
      const o = await r.json()
      const pagos = o?.transactions?.payments
      if (o.status !== 'processed' || o.status_detail !== 'accredited' ||
          !Array.isArray(pagos) || pagos.length !== 1 ||
          pagos[0].status !== 'processed' || pagos[0].status_detail !== 'accredited') {
        return Response.json({ recibido: true, estado: o.status })
      }
      const pedidoId = String(o.external_reference || '')
      const total = Number(o.total_amount)
      if (String(o.id) !== id || !/^\d+$/.test(pedidoId) ||
          (o.currency_id && o.currency_id !== 'MXN') ||
          (o.country_code && o.country_code !== 'MEX') ||
          !Number.isFinite(total) || total <= 0 ||
          Math.round(Number(o.total_paid_amount) * 100) !== Math.round(total * 100) ||
          Math.round(Number(pagos[0].amount) * 100) !== Math.round(total * 100)) {
        return Response.json({ error: 'Datos de la order inconsistentes' }, { status: 400 })
      }
      // GraphQL hace la verificación de monto del pedido y previene confirmaciones duplicadas.
      await confirmar(pedidoId, id, total, 'MXN')
    } else {
      // Compatibilidad con webhooks previos de Checkout Pro / Payments.
      const pago = await new Payment(new MercadoPagoConfig({ accessToken: token })).get({ id })
      if (pago.status !== 'approved') return Response.json({ recibido: true, estado: pago.status })
      if (!/^\d+$/.test(String(pago.external_reference || '')) ||
          pago.transaction_amount == null || pago.currency_id !== 'MXN')
        return Response.json({ error: 'Pago inconsistente' }, { status: 400 })
      await confirmar(String(pago.external_reference), String(pago.id), pago.transaction_amount, pago.currency_id)
    }
    return Response.json({ recibido: true })
  } catch (error) {
    console.error('[MP Webhook: requiere revisión]', error)
    return Response.json({ error: 'No se pudo confirmar' }, { status: 500 })
  }
}
