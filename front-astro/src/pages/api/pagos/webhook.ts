import type { APIRoute } from 'astro'
import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from 'mercadopago'
import { consultarBackend } from '../../../lib/betonosServer'

// URL pública HTTPS que Mercado Pago llama al cambiar el pago.
export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const cuerpo = await request.json().catch(() => ({}))
  const tipo = url.searchParams.get('type') || cuerpo.type
  if (tipo !== 'payment') return Response.json({ recibido: true })

  const id = String(url.searchParams.get('data.id') || cuerpo?.data?.id || '')
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: 'ID de pago inválido' }, { status: 400 })
  }
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
    return Response.json({ error: 'Firma de webhook inválida' }, { status: 401 })
  }

  try {
    const token = import.meta.env.MP_ACCESS_TOKEN
    if (!token) throw new Error('Falta MP_ACCESS_TOKEN')
    // Obtener los datos directamente de Mercado Pago, no confiar en el JSON recibido.
    const pago = await new Payment(new MercadoPagoConfig({ accessToken: token }))
      .get({ id })
    if (pago.status !== 'approved') {
      return Response.json({ recibido: true, estado: pago.status })
    }
    if (!/^\d+$/.test(String(pago.external_reference || '')) ||
        pago.transaction_amount == null || pago.currency_id !== 'MXN') {
      return Response.json({ error: 'Pago sin referencia o importe válido' }, { status: 400 })
    }
    await consultarBackend(`
      mutation ($pedidoId: ID!, $paymentId: String!, $monto: Float!, $moneda: String!) {
        confirmarPagoMercadoPago(pedidoId: $pedidoId, paymentId: $paymentId,
          monto: $monto, moneda: $moneda) { id estado }
      }
    `, {
      pedidoId: String(pago.external_reference), paymentId: String(pago.id),
      monto: pago.transaction_amount, moneda: pago.currency_id,
    })
    return Response.json({ recibido: true })
  } catch (error) {
    console.error('[WEBHOOK PAGO: REVISAR]', error)
    // 500 permite a Mercado Pago reintentar; si falta stock, conciliar manualmente.
    return Response.json({ error: 'No se pudo confirmar el pedido' }, { status: 500 })
  }
}
