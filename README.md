# Práctica P2-6 / Pp1 — Flujo e-commerce + Backend GraphQL + Auth OAuth2 (Betonos)

Proyecto integrador: flujo Home → Categoría → Producto → Carrito → Checkout,
controlado con una máquina de estados, consumiendo un backend GraphQL propio
con base de datos SQLite real.

Hay dos versiones del frontend:

- **`front/`** — versión original (práctica P2-6): React + Vite, sin login.
- **`front-astro/`** — migración a Astro (práctica Pp1), con **login OAuth2
  real vía Google** (Auth.js / `auth-astro`). Es la versión vigente para la
  entrega de Pp1 + Auth System.

El backend (`back/`) es el mismo para ambas versiones del frontend — no se
tocó en la migración.

## Estructura

```
.
├── back/         # Backend: Apollo Server + Node.js + SQLite (better-sqlite3)
├── front/        # Frontend original: Vite + React + Zustand (sin auth)
├── front-astro/  # Frontend migrado: Astro + React + Zustand + Auth.js (OAuth2 con Google)
└── db.sql        # Esquema y datos semilla de la base de datos
```

## Cómo correrlo (2 terminales)

### 1. Backend

```bash
cd back
npm install
npm run seed    # crea y puebla back/data/betonos.db a partir de db.sql
npm start        # http://localhost:4000
```

### 2. Frontend — Astro + login con Google (versión vigente, Pp1)

Requiere configurar credenciales OAuth2 de Google antes de correrlo — pasos
completos en [`front-astro/README.md`](front-astro/README.md).

```bash
cd front-astro
npm install
cp .env.example .env    # completar GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
npm run dev              # http://localhost:4321
```

Con el backend corriendo, abre `http://localhost:4321` — sin sesión te manda
a `/login`; inicia sesión con Google y entras a la tienda ya logueado. Navega
el flujo completo: elige una categoría, entra al detalle de un producto,
agrégalo al carrito, ajusta cantidades y completa el checkout (prellenado con
tu nombre/correo de Google) — el pedido se registra de verdad en la base de
datos SQLite, con descuento real de inventario.

### 2bis. Frontend original sin auth (`front/`, práctica anterior)

```bash
cd front
npm install
npm run dev       # http://localhost:5173
```

Más detalles de cada parte en `back/README.md`, `front/README.md` y
`front-astro/README.md`.
