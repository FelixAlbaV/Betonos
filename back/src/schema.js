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

  enum EstadoPedido {
    PENDIENTE
    PAGADO
    ENVIADO
    CANCELADO
  }

  type PedidoItem {
    id: ID!
    producto: Producto!
    cantidad: Int!
    precioUnitario: Float!
    subtotal: Float!
  }

  enum EstadoEnvio {
    SIN_INICIAR
    PREPARANDO
    EN_CAMINO
    ENTREGADO
  }

  type Pedido {
    estadoEnvio: EstadoEnvio!
    id: ID!
    clienteNombre: String!
    clienteEmail: String!
    fecha: String!
    estado: EstadoPedido!
    total: Float!
    items: [PedidoItem!]!
  }

  input CategoriaInput {
    nombre: String!
    descripcion: String!
  }

  input ProductoInput {
    nombre: String!
    descripcion: String!
    precio: Float!
    stock: Int!
    imagen: String!
    categoriaId: ID!
  }

  input PedidoItemInput {
    productoId: ID!
    cantidad: Int!
  }

  input PedidoInput {
    clienteNombre: String!
    clienteEmail: String!
    items: [PedidoItemInput!]!
  }

  type ResumenMisPedidos {
    totalPedidos: Int!
    pedidosPagados: Int!
    pedidosPendientes: Int!
    totalGastado: Float!
  }

  type Query {
    misPedidos(correo: String!, limit: Int!, offset: Int!): [Pedido!]!
    resumenMisPedidos(correo: String!): ResumenMisPedidos!
    categorias: [Categoria!]!
    categoria(id: ID!): Categoria

    productos(categoriaId: ID, buscar: String, limit: Int = 20, offset: Int = 0): [Producto!]!
    producto(id: ID!): Producto

    pedidos(estado: EstadoPedido, limit: Int = 20, offset: Int = 0): [Pedido!]!
    pedido(id: ID!): Pedido
  }

  type Mutation {
    crearCategoria(input: CategoriaInput!): Categoria!
    actualizarCategoria(id: ID!, input: CategoriaInput!): Categoria!
    eliminarCategoria(id: ID!): Boolean!
    actualizarEnvio(pedidoId: ID!, estado: EstadoEnvio!): EstadoEnvio!
    crearProducto(input: ProductoInput!): Producto!
    actualizarProducto(id: ID!, input: ProductoInput!): Producto!
    eliminarProducto(id: ID!): Boolean!

    registrarPedido(input: PedidoInput!): Pedido!

    actualizarEstadoPedido(id: ID!, estado: EstadoPedido!): Pedido!
    confirmarPagoMercadoPago(pedidoId: ID!, paymentId: String!, monto: Float!, moneda: String!): Pedido!
    confirmarPagoStripe(pedidoId: ID!, sesionId: String!, montoCentavos: Int!, moneda: String!): Pedido!

    eliminarPedidoPendiente(id: ID!): Boolean!

    crearTokenAdmin(email: String!): String!
  }

  type Subscription {
    pedidoConfirmado: Pedido!
    productoActualizado: Producto!
  }
`
