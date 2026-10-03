# Betonos — Backend GraphQL (Apollo Server + SQLite)

Backend del flujo e-commerce de la Práctica P2-6. Un solo endpoint (`/graphql`),
construido con **Apollo Server 4**, **Node.js** y una base de datos **SQLite real**
(no en memoria) mediante `better-sqlite3`.

## Requisitos

- Node.js 18 o superior.
- npm.

## Instalación y arranque

```bash
cd back
npm install

# Crea el archivo de base de datos (back/data/betonos.db) y la puebla
# con las categorías y productos de db.sql:
npm run seed

# Levanta el servidor:
npm start
```

Verás en consola:

```
🚀 Backend GraphQL (Betonos) listo en http://localhost:4000/
```

Abre esa URL en el navegador para usar Apollo Sandbox (el playground).

> Si corres `npm start` sin haber corrido antes `npm run seed`, el servidor te
> avisa y no arranca — necesita que la base de datos exista primero.

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Base de datos

- Motor: **SQLite**, archivo generado en `back/data/betonos.db` (no se sube al
  repositorio; se genera con `npm run seed`).
- El esquema y los datos semilla están documentados en [`../db.sql`](../db.sql),
  en la raíz del proyecto.
- Tablas: `categorias`, `productos`, `pedidos`, `pedido_items` (esta última es
  la entidad asociativa entre pedidos y productos).

## Modelo de datos (resumen)

- **Categoria** 1 → N **Producto**
- **Pedido** 1 → N **PedidoItem** N ← 1 **Producto** (relación N:M entre
  Pedido y Producto, resuelta con la tabla `pedido_items`)
- **Enum** `EstadoPedido`: PENDIENTE, PAGADO, ENVIADO, CANCELADO

## Ejemplos de queries y mutations

### Catálogo por categoría con filtro de búsqueda

```graphql
query {
  productos(categoriaId: "1", buscar: "Gamer") {
    id
    nombre
    precio
    stock
    categoria { nombre }
  }
}
```

### Detalle de producto

```graphql
query {
  producto(id: "1") {
    nombre
    descripcion
    precio
    stock
    imagen
    categoria { nombre }
  }
}
```

### Registrar un pedido (mutation de negocio — usada por el Checkout)

```graphql
mutation {
  registrarPedido(input: {
    clienteNombre: "Alberto Briseño"
    clienteEmail: "alberto@example.com"
    items: [
      { productoId: "1", cantidad: 2 }
      { productoId: "5", cantidad: 1 }
    ]
  }) {
    id
    estado
    total
    items {
      cantidad
      subtotal
      producto { nombre }
    }
  }
}
```

Esta mutation corre dentro de una **transacción SQLite**: valida que haya stock
suficiente de cada producto, calcula el total, crea el pedido y sus renglones
(`pedido_items`), y descuenta el inventario. Si algún producto no tiene stock
suficiente, la transacción completa se revierte y se regresa un error de
GraphQL (`BAD_USER_INPUT`).

### CRUD de productos

```graphql
mutation {
  crearProducto(input: {
    nombre: "Audífonos Bluetooth Pro"
    descripcion: "Audífonos inalámbricos con cancelación de ruido"
    precio: 599
    stock: 10
    imagen: "audifonos-bluetooth-pro.jpg"
    categoriaId: "6"
  }) {
    id
    nombre
  }
}
```

```graphql
mutation {
  actualizarProducto(id: "10", input: {
    nombre: "Audífonos Bluetooth Pro Max"
    descripcion: "Audífonos inalámbricos, versión reforzada"
    precio: 649
    stock: 8
    imagen: "audifonos-bluetooth-pro-max.jpg"
    categoriaId: "6"
  }) { id nombre precio }
}
```

```graphql
mutation {
  eliminarProducto(id: "10")
}
```

## Notas

- CORS viene habilitado por defecto (Apollo Server standalone lo trae listo),
  así el frontend en Vite (puerto 5173) puede consultar este backend (puerto
  4000) sin configuración extra.
- Si quieres reiniciar los datos a su estado original, vuelve a correr
  `npm run seed` (borra y recrea `betonos.db`).
