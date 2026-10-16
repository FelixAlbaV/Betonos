// index.js
import { instalarPanelUsuario } from './src/miCuenta.js'
import { instalarAdminCrud } from './src/adminCrud.js'
import { instalarNotificaciones } from './src/tiempoReal/notificaciones.js'
import { verificarTokenAdmin } from './src/tiempoReal/tokenAdmin.js'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/use/ws'
import express from 'express'
import cors from 'cors'
import http from 'node:http'
import { typeDefs } from './src/schema.js'
import { resolvers } from './src/resolvers.js'
import { db, tablasExisten } from './src/db.js'
import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import { instalarPagos } from './src/pagos.js'
import { instalarPagosStripe } from './src/pagosStripe.js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

const rutaEnv = fileURLToPath(new URL('./.env', import.meta.url))
const resultadoEnv = config({ path: rutaEnv })

console.log('[BACKEND ENV]', {
  archivoEncontrado: !resultadoEnv.error,
  claveConfigurada: Boolean(process.env.BETONOS_INTERNAL_KEY)
})

if (!tablasExisten()) {
  console.log('⚠️  No se encontró la base de datos. Ejecuta primero: npm run seed')
  process.exit(1)
}

// Los resolvers de pago deben instalarse cuando SÍ existe la base de datos.
instalarPagos(resolvers)
instalarPagosStripe(resolvers)
instalarAdminCrud(resolvers)
instalarPanelUsuario(resolvers)
instalarNotificaciones(resolvers)

const schema = makeExecutableSchema({ typeDefs, resolvers })

function autorizacionInterna(headers) {
  const clave = process.env.BETONOS_INTERNAL_KEY || ''
  const recibida = String(headers['x-betonos-internal'] || '')
  return Boolean(
    clave && recibida &&
    Buffer.byteLength(clave) === Buffer.byteLength(recibida) &&
    timingSafeEqual(Buffer.from(clave), Buffer.from(recibida))
  )
}

const app = express()
const httpServer = http.createServer(app)

// Subscriptions viven en el mismo puerto, sobre WebSocket. El context de la
// conexión se construye UNA vez al conectar (no por cada evento): verifica el
// token corto del panel admin y guarda el correo en contexto.adminEmail.
// Sin "path" fijo: igual que las queries HTTP, acepta cualquier ruta
// (PUBLIC_API_URL puede terminar en "/" o en "/graphql" según el entorno).
const wsServer = new WebSocketServer({ server: httpServer })
const limpiezaWs = useServer({
  schema,
  context: async (ctx) => {
    const token = ctx.connectionParams?.token
    if (!token) throw new Error('Sin token: no puedes conectarte.')
    const adminEmail = verificarTokenAdmin(token)
    return { adminEmail }
  },
}, wsServer)

const apollo = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return { async drainServer() { await limpiezaWs.dispose() } }
      },
    },
  ],
})
await apollo.start()

app.use(cors(), express.json(), expressMiddleware(apollo, {
  // Queries y mutations: una petición HTTP = una validación con la clave interna.
  context: async ({ req }) => {
    const autorizado = autorizacionInterna(req.headers)
    console.log('[AUTH INTERNA]', { claveConfigurada: Boolean(process.env.BETONOS_INTERNAL_KEY), autorizado })
    return { autorizado }
  },
}))

const puerto = process.env.PORT || 4000
httpServer.listen(puerto, () => {
  console.log(`🚀 Backend GraphQL (Betonos) listo en http://localhost:${puerto}/`)
  console.log(`   Base de datos: back/data/betonos.db`)
})

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})
