
import type { APIRoute } from 'astro'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export const POST: APIRoute = async () => {
  // Endpoint temporal: solo funciona durante el desarrollo.
  if (import.meta.env.PROD) {
    return new Response('No disponible', { status: 404 })
  }

  const token = import.meta.env.MP_ACCESS_TOKEN

  if (!token) {
    return Response.json(
      { error: 'Falta configurar MP_ACCESS_TOKEN' },
      { status: 500 }
    )
  }

  try {
    const cliente = new MercadoPagoConfig({ accessToken: token })
    const preferencia = new Preference(cliente)

    const resultado = await preferencia.create({
      body: {
        items: [{
          id: 'prueba-betonos',
          title: 'Producto de prueba Betonos',
          quantity: 1,
          unit_price: 10,
          currency_id: 'MXN'
        }]
      }
    })

    if (!resultado.init_point) {
      throw new Error('Mercado Pago no devolvió la URL de pago')
    }

    return Response.json({
      id: resultado.id,
      url: resultado.init_point
    })

  } catch (error) {
    console.error('Error de Mercado Pago:', error)
    return Response.json(
      { error: 'No se pudo crear la preferencia de pago' },
      { status: 502 }
    )
  }
}
