-- db.sql
-- Esquema y datos semilla para la Práctica P2-6.
-- Motor: SQLite (archivo back/data/betonos.db, generado automáticamente al
-- correr `npm run seed`). Este script documenta y reproduce esa estructura;
-- también es compatible (con mínimos ajustes de tipos) con MySQL/PostgreSQL.

-- ---------- Tabla: categorias ----------
CREATE TABLE IF NOT EXISTS categorias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL
);

-- ---------- Tabla: productos ----------
CREATE TABLE IF NOT EXISTS productos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  precio        REAL NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 0,
  imagen        TEXT NOT NULL,
  categoria_id  INTEGER NOT NULL,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- ---------- Tabla: pedidos ----------
-- estado: PENDIENTE | PAGADO | ENVIADO | CANCELADO
CREATE TABLE IF NOT EXISTS pedidos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nombre TEXT NOT NULL,
  cliente_email  TEXT NOT NULL,
  fecha          TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'PENDIENTE',
  total          REAL NOT NULL
);

-- ---------- Tabla: pedido_items ----------
-- Entidad asociativa: detalle de productos dentro de un pedido (relación N:M
-- entre pedidos y productos, con cantidad y precio_unitario como atributos
-- propios de la relación).
CREATE TABLE IF NOT EXISTS pedido_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id         INTEGER NOT NULL,
  producto_id       INTEGER NOT NULL,
  cantidad          INTEGER NOT NULL,
  precio_unitario   REAL NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ---------- Datos semilla ----------

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Gamer', 'Audífonos pensados para videojuegos, con micrófono y sonido envolvente'),
  ('Música', 'Audífonos de alta fidelidad para disfrutar tu música favorita'),
  ('Diario', 'Audífonos cómodos y versátiles para el uso de todos los días'),
  ('Económicos', 'Opciones accesibles sin sacrificar calidad'),
  ('Cable', 'Audífonos con conexión por cable, ideales para la menor latencia'),
  ('Inalámbricos', 'Audífonos Bluetooth, libertad total sin cables'),
  ('Diadema', 'Audífonos over-ear con diadema, máxima comodidad y aislamiento');

INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria_id) VALUES
  ('Audífonos Gamer Pro RGB', 'Audífonos envolventes con micrófono abatible e iluminación RGB, ideales para sesiones largas de juego.', 899.00, 20, 'audifonos-gamer-rgb.jpg', 1),
  ('Audífonos Gamer Surround 7.1', 'Sonido envolvente virtual 7.1, diadema ajustable y almohadillas de memory foam.', 1199.00, 15, 'audifonos-gamer-surround.jpg', 1),
  ('Audífonos de Estudio HiFi', 'Respuesta de frecuencia extendida para escuchar cada detalle de tu música favorita.', 1499.00, 12, 'audifonos-estudio-hifi.jpg', 2),
  ('Audífonos Monitor de Estudio', 'Audífonos de referencia para mezcla y producción musical, sonido neutro y preciso.', 1699.00, 10, 'audifonos-monitor-estudio.jpg', 2),
  ('Audífonos Casual Lite', 'Ligeros y cómodos para usar todo el día, perfectos para el trabajo o la escuela.', 449.00, 35, 'audifonos-casual-lite.jpg', 3),
  ('Audífonos Urban Comfort', 'Diseño minimalista con acolchado suave, pensados para el uso diario en la ciudad.', 599.00, 28, 'audifonos-urban-comfort.jpg', 3),
  ('Audífonos JBL Deporte', 'Resistentes al sudor, ideales para acompañarte en tus actividades diarias y ejercicio.', 549.00, 25, 'audifonos-jbl-deporte.jpg', 3),
  ('Audífonos Básicos Everyday', 'La opción más accesible sin sacrificar comodidad para el uso de todos los días.', 199.00, 50, 'audifonos-basicos-everyday.jpg', 4),
  ('Audífonos Económicos Sport', 'Audífonos ligeros a precio accesible, resistentes para actividades al aire libre.', 249.00, 45, 'audifonos-economicos-sport.jpg', 4),
  ('Audífonos con Cable Studio', 'Conexión por cable de 3.5mm para la menor latencia posible en grabación y mezcla.', 799.00, 18, 'audifonos-cable-studio.jpg', 5),
  ('Audífonos con Cable Classic', 'Diseño clásico con cable trenzado resistente y conector universal.', 399.00, 30, 'audifonos-cable-classic.jpg', 5),
  ('Audífonos Inalámbricos Pro', 'Conexión Bluetooth 5.3 de baja latencia con hasta 30 horas de batería.', 1299.00, 16, 'audifonos-inalambricos-pro.jpg', 6),
  ('Audífonos Inalámbricos Red Beat', 'Bluetooth con graves potenciados, ideales para escuchar música en movimiento.', 999.00, 20, 'audifonos-inalambricos-redbeat.jpg', 6),
  ('Audífonos Diadema Comfort', 'Diadema acolchada ajustable con almohadillas de piel sintética para sesiones largas.', 699.00, 22, 'audifonos-diadema-comfort.jpg', 7),
  ('Audífonos Diadema Deluxe', 'Acabado premium con diadema reforzada y cancelación de ruido pasiva.', 1099.00, 14, 'audifonos-diadema-deluxe.jpg', 7);

INSERT INTO pedidos (cliente_nombre, cliente_email, fecha, estado, total) VALUES
  ('Fátima López', 'fatima.lopez@example.com', '2026-09-01', 'PAGADO', 1497.00);

INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES
  (1, 1, 1, 899.00),
  (1, 8, 1, 199.00),
  (1, 11, 1, 399.00);
