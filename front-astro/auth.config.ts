// auth.config.ts
// Configuración de Auth.js para el login con Google (OAuth2).
// Sesión con estrategia JWT (sin base de datos de usuarios): no hace falta
// persistir nada, solo autenticar y tener nombre/email en la sesión.
import Google from '@auth/core/providers/google'
import { defineConfig } from 'auth-astro'

export default defineConfig({
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
})
