# Betonos — Frontend en Astro + Auth OAuth2 (Pp1 + Auth System)

Migración a [Astro](https://astro.build/) del frontend de la tienda Betonos
(práctica anterior, hecha en React + Vite), agregando un sistema de login con
**OAuth2** real (Google) usando [Auth.js](https://authjs.dev/) a través del
paquete [`auth-astro`](https://www.npmjs.com/package/auth-astro).

El backend GraphQL (`../back`) no cambia — sigue siendo el mismo Apollo
Server + SQLite de la práctica anterior.

## Qué cambió respecto al front original

- El proyecto corre sobre **Astro** en modo `server` (SSR) con el adaptador
  `@astrojs/netlify`, en vez de Vite puro — es requisito de Auth.js, que
  necesita manejar cookies de sesión y un callback de OAuth en el servidor.
- Toda la tienda (Home → Categoría → Producto → Carrito → Checkout) se montó
  como un único "island" de React (`<App client:load />`) dentro de
  `src/pages/index.astro` — la máquina de estados (`useFlujoCompra`) y el
  carrito (Zustand) se mantienen exactamente igual que antes.
- Se agregó `src/pages/login.astro`: si no hay sesión, `index.astro` redirige
  ahí. El login es "Iniciar sesión con Google" (OAuth2 real, no simulado).
- La sesión usa estrategia **JWT** (sin base de datos de usuarios) — solo se
  necesita autenticar y tener nombre/email disponibles, no persistir cuentas.
- `TopBar` muestra el nombre de la cuenta logueada y un link para cerrar
  sesión. `Checkout` prellena nombre/email con los datos de Google (sigue
  siendo editable).

## 1. Configurar credenciales de Google (OAuth2)

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea
   un proyecto nuevo (cualquier nombre).
2. **APIs & Services → OAuth consent screen**: tipo "External", llena nombre
   de la app y los emails pedidos. Déjalo en modo "Testing" y agrégate a ti
   mismo como "test user".
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   tipo "Web application":
   - Authorized JavaScript origins: `http://localhost:4321`
   - Authorized redirect URIs: `http://localhost:4321/api/auth/callback/google`
4. Copia el **Client ID** y **Client Secret** generados.

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa en `.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...        # generar con: openssl rand -hex 32
AUTH_TRUST_HOST=true
PUBLIC_API_URL=http://localhost:4000/graphql
```

> Este repo ya trae un `.env` con un `AUTH_SECRET` de ejemplo generado para
> que puedas levantar el proyecto de inmediato — solo te falta poner tu
> `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` del paso 1.

## 3. Correr el proyecto (2 terminales)

### Backend (sin cambios, ver `../back/README.md`)

```bash
cd ../back
npm install
npm run seed
npm start        # http://localhost:4000
```

### Frontend (Astro)

```bash
npm install
npm run dev       # http://localhost:4321
```

Abre `http://localhost:4321` — sin sesión te manda a `/login`; inicia sesión
con Google y vuelves a la tienda ya logueado.

## 4. Publicarlo (Netlify + túnel al backend)

El backend se queda corriendo en tu propia computadora (así los pedidos y el
inventario son reales, sin depender de un disco persistente en la nube). Se
expone a internet con un túnel (ngrok), y el frontend se despliega en
Netlify.

### 4.1 Exponer el backend con ngrok

1. Crea cuenta gratis en [ngrok.com](https://ngrok.com/) e instala el CLI
   (`npm install -g ngrok` o descarga el binario).
2. Autentica una sola vez: `ngrok config add-authtoken <tu-token>` (lo
   encuentras en tu dashboard de ngrok).
3. Reclama un **dominio estático gratis** (dashboard de ngrok → Domains → New
   Domain) — así la URL no cambia cada vez que reinicias el túnel.
4. Con el backend corriendo (`npm start` en `../back`, puerto 4000), abre
   otra terminal y corre:
   ```bash
   ngrok http --url=tu-dominio.ngrok-free.app 4000
   ```
5. Tu backend ya es público en `https://tu-dominio.ngrok-free.app/graphql`.
   Déjalo corriendo (computadora + backend + ngrok) mientras alguien pueda
   querer entrar al link — si apagas cualquiera de los tres, el sitio
   público deja de poder completar pedidos.

### 4.2 Desplegar el frontend en Netlify

1. Sube este proyecto a GitHub (si no tienes repo: `git init`, commit, push).
2. En [app.netlify.com](https://app.netlify.com/) → **Add new site → Import
   an existing project** → conecta tu repo de GitHub.
3. Como el proyecto vive en una subcarpeta del repo:
   - **Base directory**: `front-astro`
   - **Build command**: `npm run build`
   - **Publish directory**: `front-astro/dist` (Netlify lo autodetecta con el
     adapter `@astrojs/netlify`, normalmente no hace falta tocarlo).
4. En **Site settings → Environment variables**, agrega las mismas 5
   variables de tu `.env` local, pero con `PUBLIC_API_URL` apuntando a tu
   URL de ngrok:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   AUTH_SECRET=...
   AUTH_TRUST_HOST=true
   PUBLIC_API_URL=https://tu-dominio.ngrok-free.app/graphql
   ```
5. Deploy. Netlify te da una URL tipo `https://tu-sitio.netlify.app`.

### 4.3 Actualizar las credenciales de Google con la URL pública

En Google Cloud Console → Credentials → tu OAuth client ID, **agrega** (no
reemplaces, deja también las de `localhost` para seguir probando en local):

- Authorized JavaScript origins: `https://tu-sitio.netlify.app`
- Authorized redirect URIs: `https://tu-sitio.netlify.app/api/auth/callback/google`

Prueba el link público: debería mandarte a `/login`, el botón de Google debe
llevarte al consentimiento real, y al volver ya logueado deberías poder
navegar y completar un pedido de verdad (que queda guardado en tu SQLite
local, a través del túnel).

## Estructura

```
front-astro/
├── auth.config.ts          # Config de Auth.js (provider Google)
├── astro.config.mjs         # output: 'server' + adapter Netlify + integraciones
├── .env / .env.example
└── src/
    ├── pages/
    │   ├── login.astro      # Pantalla de login (OAuth2 con Google)
    │   └── index.astro      # Protegida: revisa sesión, monta <App />
    ├── components/App.jsx    # Antiguo src/App.jsx, ahora recibe prop `user`
    ├── components/...        # Resto de componentes, sin cambios de lógica
    ├── hooks/useFlujoCompra.js
    ├── store/cartStore.js
    ├── context/AppContext.jsx
    └── graphql/client.js     # fetch manual al backend (PUBLIC_API_URL)
```

## Notas

- Las rutas `/api/auth/*` (signin, callback, signout, session) las genera
  automáticamente la integración `auth-astro` — no hay que crearlas a mano.
- `GOOGLE_CLIENT_SECRET` y `AUTH_SECRET` nunca deben llevar el prefijo
  `PUBLIC_` (ese prefijo expone la variable al navegador).
- `npm audit` reporta vulnerabilidades conocidas en `@auth/core` y en
  herramientas de desarrollo que trae `@astrojs/netlify` (`extract-zip`,
  `node-forge`, `sharp`, usadas solo por el preview/dev local de Netlify, no
  por el código que corre en producción) — sin fix disponible todavía río
  arriba, aceptable para este proyecto escolar.
- El túnel de ngrok (o el backend/tu PC) tiene que estar encendido para que
  el checkout funcione en el link público — si lo apagas, la tienda carga
  pero las peticiones a `/graphql` fallan (mismo síntoma que viste en local
  cuando el backend no estaba corriendo).
