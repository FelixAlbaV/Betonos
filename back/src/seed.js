// npm run seed
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', '..', 'db.sql')
const dbFilePath = path.join(__dirname, '..', 'data', 'betonos.db')

// borra la db vieja para no duplicar filas si se corre otra vez
for (const ext of ['', '-wal', '-shm']) {
  const f = dbFilePath + ext
  if (fs.existsSync(f)) fs.unlinkSync(f)
}

const { db } = await import('./db.js')

function main() {
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  db.exec(sql)
  console.log('✅ Base de datos creada y poblada en back/data/betonos.db')

  const totalProductos = db.prepare('SELECT COUNT(*) AS n FROM productos').get().n
  const totalCategorias = db.prepare('SELECT COUNT(*) AS n FROM categorias').get().n
  console.log(`   ${totalCategorias} categorías, ${totalProductos} productos.`)
}

main()
