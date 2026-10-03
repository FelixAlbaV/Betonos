// src/schema.js
export const typeDefs = `#graphql
  type Categoria {
    id: ID!
    nombre: String!
    descripcion: String!
    productos: [Producto!]!
  }

  type Producto {
    id: ID!
    nombre: String!
    descripcion: String!
    precio: Float!
    stock: Int!
    imagen: String!
    categoria: Categoria!
  }

  "Estado del ciclo de vida de un pedido."
  enum EstadoPedido {
    PENDIENTE
    PAGADO
    ENVIADO
    CANCELADO
  }

  "Un producto dentro de un pedido, con la cantidad y el precio al momento de la compra."
  type PedidoItem {
    id: ID!
    producto: Producto!
    cantidad: Int!
    precioUnitario: Float!
    subtotal: Float!
  }

  type Pedido {
    id: ID!
    clienteNombre: String!
    clienteEmail: String!
    fecha: String!
    estado: EstadoPedido!
    total: Float!
    items: [PedidoItem!]!
  }

  input ProductoInput {
    nombre: String!
    descripcion: String!
    precio: Float!
    stock: Int!
    imagen: String!
    categoriaId: ID!
  }

  "Un renglón del carrito al momento de registrar el pedido."
  input PedidoItemInput {
    productoId: ID!
    cantidad: Int!
  }

  input PedidoInput {
    clienteNombre: String!
    clienteEmail: String!
    items: [PedidoItemInput!]!
  }

  type Query {
    categorias: [Categoria!]!
    categoria(id: ID!): Categoria

    "Catálogo de productos, filtrable por categoría y/o texto de búsqueda, con paginación."
    productos(categoriaId: ID, buscar: String, limit: Int = 20, offset: Int = 0): [Producto!]!
    producto(id: ID!): Producto

    pedidos(estado: EstadoPedido, limit: Int = 20, offset: Int = 0): [Pedido!]!
    pedido(id: ID!): Pedido
  }

  type Mutation {
    # CRUD de productos
    crearProducto(input: ProductoInput!): Producto!
    actualizarProducto(id: ID!, input: ProductoInput!): Producto!
    eliminarProducto(id: ID!): Boolean!

    "Mutation de negocio: registra un pedido a partir del carrito, descuenta stock y calcula el total."
    registrarPedido(input: PedidoInput!): Pedido!

    "Mutation de negocio: avanza o cambia el estado de un pedido."
    actualizarEstadoPedido(id: ID!, estado: EstadoPedido!): Pedido!
  }
`
