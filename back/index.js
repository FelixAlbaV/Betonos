import { instalarPanelUsuario } from './src/miCuenta.js'
import { instalarAdminCrud } from './src/adminCrud.js'
// index.js
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
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
  instalarPagosStripe(resolvers)
  instalarPagos(resolvers)
  console.log('⚠️  No se encontró la base de datos. Ejecuta primero: npm run seed')
  process.exit(1)
}

instalarAdminCrud(resolvers)

instalarPanelUsuario(resolvers)

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const { url } = await startStandaloneServer(server, {
  listen: { port: process.env.PORT || 4000 },


context: async ({ req }) => {
  const clave = process.env.BETONOS_INTERNAL_KEY || ''
  const recibida = String(req.headers['x-betonos-internal'] || '')

  const autorizado = Boolean(
    clave &&
    recibida &&
    Buffer.byteLength(clave) === Buffer.byteLength(recibida) &&
    timingSafeEqual(
      Buffer.from(clave),
      Buffer.from(recibida)
    )
  )

  // DIAGNÓSTICO TEMPORAL: AGREGAR AQUÍ
  console.log('[AUTH INTERNA]', {
    claveConfigurada: Boolean(clave),
    encabezadoRecibido: Boolean(recibida),
    autorizado
  })

  return { autorizado }
},


})

console.log(`🚀 Backend GraphQL (Betonos) listo en ${url}`)
console.log(`   Base de datos: back/data/betonos.db`)

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})
