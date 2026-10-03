// index.js
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './src/schema.js'
import { resolvers } from './src/resolvers.js'
import { db, tablasExisten } from './src/db.js'

if (!tablasExisten()) {
  console.log('⚠️  No se encontró la base de datos. Ejecuta primero: npm run seed')
  process.exit(1)
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const { url } = await startStandaloneServer(server, {
  listen: { port: process.env.PORT || 4000 },
  context: async () => ({}),
})

console.log(`🚀 Backend GraphQL (Betonos) listo en ${url}`)
console.log(`   Base de datos: back/data/betonos.db`)

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})
