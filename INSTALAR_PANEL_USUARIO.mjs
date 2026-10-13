// Ejecutar desde p26-codigo (1): node .\INSTALAR_PANEL_USUARIO.mjs
// Instalador idempotente, añade fragmentos mínimos y respalda los archivos existentes.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ruta = (p) => path.join(root, p)
const paths = {
  index: 'back/index.js',
  schema: 'back/src/schema.js',
  topbar: 'front-astro/src/components/TopBar/TopBar.jsx',
  nuevoBack: 'back/src/miCuenta.js',
  nuevaPagina: 'front-astro/src/pages/mi-cuenta.astro',
  nuevoCss: 'front-astro/src/styles/mi-cuenta.css',
}
for (const [clave, nombre] of Object.entries(paths)) {
  if (!fs.existsSync(ruta(nombre))) throw Error(`Falta ${nombre}: copia primero los archivos del ZIP (${clave}).`)
}
let index = fs.readFileSync(ruta(paths.index), 'utf8')
let schema = fs.readFileSync(ruta(paths.schema), 'utf8')
let topbar = fs.readFileSync(ruta(paths.topbar), 'utf8')

if (!index.includes('BETONOS_INTERNAL_KEY')) throw Error('El backend aún no tiene la autorización privada BETONOS_INTERNAL_KEY.')
if (!index.includes('instalarAdminCrud(resolvers)')) throw Error('No encontré el CRUD de administración ya instalado. No modificaré index.js.')
if (!index.includes('const server = new ApolloServer')) throw Error('No encontré el inicializador ApolloServer. No modificaré index.js.')
if (!schema.includes('estadoEnvio: EstadoEnvio!') || !schema.includes('  type Query {') || !schema.includes('  type Mutation {')) {
  throw Error('Falta el esquema del CRUD o no coincide con la estructura esperada; no modificaré schema.js.')
}

if (!index.includes("import { instalarPanelUsuario } from './src/miCuenta.js'")) {
  index = "import { instalarPanelUsuario } from './src/miCuenta.js'\n" + index
}
if (!index.includes('instalarPanelUsuario(resolvers)')) {
  index = index.replace('const server = new ApolloServer', 'instalarPanelUsuario(resolvers)\n\nconst server = new ApolloServer')
}
if (!schema.includes('type ResumenMisPedidos')) {
  schema = schema.replace('  type Query {', `  type ResumenMisPedidos {
    totalPedidos: Int!
    pedidosPagados: Int!
    pedidosPendientes: Int!
    totalGastado: Float!
  }

  type Query {`)
}
if (!schema.includes('misPedidos(correo: String!')) {
  schema = schema.replace('  type Query {', `  type Query {
    misPedidos(correo: String!, limit: Int!, offset: Int!): [Pedido!]!
    resumenMisPedidos(correo: String!): ResumenMisPedidos!`)
}
if (!topbar.includes('href="/mi-cuenta"')) {
  const marcador = '<button className={estilos.logout}'
  if (!topbar.includes(marcador)) {
    console.warn('⚠️ No encontré el botón original de logout para añadir el enlace. El panel funcionará en /mi-cuenta sin ese enlace.')
  } else {
    topbar = topbar.replace(marcador, `{user && <a href="/mi-cuenta" className={estilos.usuario} style={{ textDecoration: 'none', fontWeight: 700 }}>Mi cuenta</a>}
        ` + marcador)
  }
}

// Se revisa todo antes de hacer cambios. Se respaldan los originales.
const backup = 'respaldo_panel_usuario_' + new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_')
fs.mkdirSync(ruta(backup), { recursive: true })
for (const name of [paths.index, paths.schema, paths.topbar]) {
  const to = ruta(path.join(backup, name))
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(ruta(name), to)
}
fs.writeFileSync(ruta(paths.index), index)
fs.writeFileSync(ruta(paths.schema), schema)
fs.writeFileSync(ruta(paths.topbar), topbar)

console.log('✅ Panel de usuario integrado sin sustituir archivos completos.')
console.log('📁 Respaldo de archivos modificados:', backup)
console.log('🔁 Reinicia backend y Astro. Después abre http://localhost:4321/mi-cuenta')
