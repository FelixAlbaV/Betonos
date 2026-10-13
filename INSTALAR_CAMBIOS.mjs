// Ejecutar desde la raíz de p26-codigo (1): node INSTALAR_CAMBIOS.mjs
// Solo añade import, inicializador y extensiones GraphQL. Hace respaldo previo.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ruta = (p) => path.join(root, p)
const indexFile = ruta('back/index.js')
const schemaFile = ruta('back/src/schema.js')
const adminFile = ruta('front-astro/src/pages/admin.astro')

for (const p of [indexFile, schemaFile, ruta('back/src/adminCrud.js'), ruta('front-astro/src/pages/admin/gestion.astro')]) {
  if (!fs.existsSync(p)) throw Error(`Falta ${path.relative(root, p)}. Copia primero las carpetas del ZIP.`)
}
const originalIndex = fs.readFileSync(indexFile, 'utf8')
const originalSchema = fs.readFileSync(schemaFile, 'utf8')
if (!originalIndex.includes('BETONOS_INTERNAL_KEY')) {
  throw Error('Falta proteger el backend con BETONOS_INTERNAL_KEY. NO se habilitará CRUD público. Revisa back/index.js.')
}
if (!originalIndex.includes('const server = new ApolloServer')) {
  throw Error('No encontré el inicializador ApolloServer; aplica el cambio manualmente.')
}
if (!originalSchema.includes('  type Pedido {') || !originalSchema.includes('  type Mutation {') || !originalSchema.includes('  input ProductoInput {')) {
  throw Error('No reconocí la estructura del esquema GraphQL; aplica el cambio manualmente.')
}
let index = originalIndex
if (!index.includes("import { instalarAdminCrud } from './src/adminCrud.js'")) {
  index = "import { instalarAdminCrud } from './src/adminCrud.js'\n" + index
}
if (!index.includes('instalarAdminCrud(resolvers)')) {
  index = index.replace('const server = new ApolloServer', 'instalarAdminCrud(resolvers)\n\nconst server = new ApolloServer')
}
let schema = originalSchema
if (!schema.includes('enum EstadoEnvio')) {
  schema = schema.replace('  type Pedido {', `  enum EstadoEnvio {\n    SIN_INICIAR\n    PREPARANDO\n    EN_CAMINO\n    ENTREGADO\n  }\n\n  type Pedido {`)
}
if (!schema.includes('estadoEnvio: EstadoEnvio!')) {
  schema = schema.replace('  type Pedido {', '  type Pedido {\n    estadoEnvio: EstadoEnvio!')
}
if (!schema.includes('input CategoriaInput')) {
  schema = schema.replace('  input ProductoInput {', `  input CategoriaInput {\n    nombre: String!\n    descripcion: String!\n  }\n\n  input ProductoInput {`)
}
if (!schema.includes('crearCategoria(input: CategoriaInput!)')) {
  schema = schema.replace('  type Mutation {', `  type Mutation {\n    crearCategoria(input: CategoriaInput!): Categoria!\n    actualizarCategoria(id: ID!, input: CategoriaInput!): Categoria!\n    eliminarCategoria(id: ID!): Boolean!\n    actualizarEnvio(pedidoId: ID!, estado: EstadoEnvio!): EstadoEnvio!`)
}
let admin = fs.existsSync(adminFile) ? fs.readFileSync(adminFile, 'utf8') : null
if (admin && !admin.includes('href="/admin/gestion"')) {
  const anchor = '<nav class="admin-menu">'
  if (admin.includes(anchor)) admin = admin.replace(anchor, anchor + '\n          <a href="/admin/gestion"><span aria-hidden="true">✎</span> Gestionar tienda</a>')
}
const baseBackup = 'respaldo_crud_' + new Date().toISOString().replace(/[.:-]/g, '').replace('T', '_').slice(0, 15)
let n = 0
while (fs.existsSync(ruta(baseBackup + (n ? '_' + n : '')))) n++
const destino = ruta(baseBackup + (n ? '_' + n : ''))
fs.mkdirSync(destino, { recursive: true })
for (const p of [indexFile, schemaFile, adminFile, ruta('back/data/betonos.db'), ruta('back/data/betonos.db-wal'), ruta('back/data/betonos.db-shm')]) {
  if (fs.existsSync(p)) {
    const rel = path.relative(root, p)
    const target = path.join(destino, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(p, target)
  }
}
fs.writeFileSync(indexFile, index)
fs.writeFileSync(schemaFile, schema)
if (admin) fs.writeFileSync(adminFile, admin)
console.log('✅ Cambios aplicados sin reemplazar el resto de los archivos.')
console.log('📁 Respaldo:', destino)
console.log('🚀 Reinicia back y front-astro; luego abre /admin/gestion')
