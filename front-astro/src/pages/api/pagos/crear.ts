import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { consultarBackend } from '../../../lib/betonosServer'

type PreferenciaBody = Parameters<Preference['create']>[0]['body']

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)
  if (!sesion?.user?.email) {
    return Response.json({ error: 'Inicia sesión con Google.' }, { status: 401 })
  }
  try {
    const { nombre, items } = await request.json()
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 120 ||
        !Array.isArray(items) || items.length < 1 || items.length > 50 ||
        items.some(i => !/^\d+$/.test(String(i.productoId)) ||
          !Number.isSafeInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 100)) {
      return Response.json({ error: 'Carrito o nombre inválidos.' }, { status: 400 })
    }
    const token = import.meta.env.MP_ACCESS_TOKEN
    if (!token) throw new Error('Falta MP_ACCESS_TOKEN en front-astro/.env')

    // Registrar en SQLite y leer precios reales. Nunca confiar en precios del navegador.
    const data = await consultarBackend(`
      mutation ($input: PedidoInput!) {
        registrarPedido(input: $input) {
          id total items {
            cantidad precioUnitario producto { id nombre }
          }
        }
      }
    `, { input: {
      clienteNombre: nombre.trim(), clienteEmail: sesion.user.email, items,
    } })
    const pedido = data.registrarPedido
    const pedidoId = String(pedido.id)
    const sitio = (import.meta.env.SITE_URL || '').replace(/\/$/, '')
    const preferencia: PreferenciaBody = {
      external_reference: pedidoId,
      payer: { email: sesion.user.email },
      items: pedido.items.map((i: any) => ({
        id: String(i.producto.id), title: i.producto.nombre,
        quantity: i.cantidad, unit_price: i.precioUnitario, currency_id: 'MXN',
      })),
    }
    // En localhost solo se prueba el enlace. Para Webhooks usa HTTPS público.
    if (sitio.startsWith('https://') && !/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(sitio)) {
      const regreso = `${sitio}/pago?pedido=${encodeURIComponent(pedidoId)}`
      preferencia.back_urls = { success: regreso, pending: regreso, failure: regreso }
      preferencia.auto_return = 'approved'
      preferencia.notification_url = `${sitio}/api/pagos/webhook`
    }
    const respuesta = await new Preference(new MercadoPagoConfig({ accessToken: token }))
      .create({ body: preferencia })
    if (!respuesta.init_point) throw new Error('No se recibió una URL de Mercado Pago.')
    return Response.json({ pedidoId, url: respuesta.init_point })
  } catch (error) {
    console.error('[Iniciar Mercado Pago]', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Error al pagar.' }, { status: 502 })
  }
}
