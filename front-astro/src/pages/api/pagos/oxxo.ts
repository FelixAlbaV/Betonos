import type { APIRoute } from 'astro'
import { createHmac } from 'node:crypto'
import { getSession } from 'auth-astro/server'
import { consultarBackend, CONSULTAR_PEDIDO } from '../../../lib/betonosServer'

// OXXO: usa la misma Orders API que la tarjeta pero con payment_method
// "oxxo"/"ticket". Aquí solo se genera la ficha, el pedido se confirma
// como pagado hasta que llegue el webhook
const dinero = (valor: number) => valor.toFixed(2)

function ticketDeOrder(order: any) {
  return order?.transactions?.payments?.[0]?.payment_method
}

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)
  if (!sesion?.user?.email) return Response.json({ error: 'Inicia sesión con Google.' }, { status: 401 })

  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 })
  }

  const token = import.meta.env.MP_ACCESS_TOKEN
  const clave = import.meta.env.BETONOS_INTERNAL_KEY
  if (!token || !clave) {
    return Response.json({ error: 'Falta configurar MP_ACCESS_TOKEN o la clave interna.' }, { status: 502 })
  }

  try {
    const { pedidoId } = await request.json()
    const id = String(pedidoId)
    if (!/^\d+$/.test(id)) return Response.json({ error: 'Pedido inválido.' }, { status: 400 })

    const { pedido } = await consultarBackend(CONSULTAR_PEDIDO, { id })
    if (!pedido || pedido.clienteEmail.toLowerCase() !== sesion.user.email.toLowerCase()) {
      return Response.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }
    if (pedido.estado !== 'PENDIENTE') {
      return Response.json({ error: 'Este pedido ya no está pendiente de pago.' }, { status: 409 })
    }

    const total = dinero(pedido.total)
    const [nombre, ...resto] = (sesion.user.name || 'Cliente Betonos').trim().split(' ')
    const apellido = resto.join(' ') || 'Betonos'
    // llave fija por pedido, evita duplicar la ficha si hay reintento de red
    const idempotencyKey = createHmac('sha256', clave).update(`mp-oxxo:${id}`).digest('hex')

    const crear = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        type: 'online',
        processing_mode: 'automatic',
        external_reference: id,
        total_amount: total,
        payer: { email: sesion.user.email, first_name: nombre, last_name: apellido },
        config: { location: { state_id: 'MX-DIF' } },
        transactions: {
          payments: [{
            amount: total,
            expiration_time: 'P3D',
            payment_method: { id: 'oxxo', type: 'ticket' },
          }],
        },
      }),
    })
    const datos = await crear.json().catch(() => ({}))
    if (!crear.ok) {
      console.error('[OXXO: crear order]', datos)
      return Response.json({ error: 'Mercado Pago rechazó la solicitud de la ficha OXXO.' }, { status: 502 })
    }

    // la ficha tarda un poco en estar lista, se reintenta unas veces antes de rendirse
    let order = datos
    let ticket = ticketDeOrder(order)
    for (let intento = 0; intento < 6 && !ticket?.ticket_url; intento++) {
      await new Promise((resolver) => setTimeout(resolver, 1000))
      const consulta = await fetch(`https://api.mercadopago.com/v1/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
      if (consulta.ok) order = await consulta.json()
      ticket = ticketDeOrder(order)
    }
    if (!ticket?.ticket_url) {
      return Response.json({ error: 'Mercado Pago tardó demasiado en generar la ficha. Intenta de nuevo.' }, { status: 502 })
    }

    return Response.json({
      pedidoId: id,
      orderId: order.id,
      estado: order.status,
      urlFicha: ticket.ticket_url,
      codigoBarras: ticket.barcode_content ?? null,
      referencia: ticket.reference ?? null,
    })
  } catch (error) {
    console.error('[OXXO: crear order]', error)
    return Response.json({ error: 'No se pudo generar la ficha de pago.' }, { status: 502 })
  }
}
