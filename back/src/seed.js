// src/seed.js
// Crea las tablas (si no existen) y carga los datos semilla desde db.sql.
// Uso: npm run seed
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', '..', 'db.sql')
const dbFilePath = path.join(__dirname, '..', 'data', 'betonos.db')

// Borramos la base previa para que correr el seed siempre sea reproducible
// (evita duplicar filas si se ejecuta más de una vez).
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
