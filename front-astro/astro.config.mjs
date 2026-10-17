
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import auth from 'auth-astro'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'server',
  integrations: [react(), auth()],
  adapter: netlify({
    devFeatures: {
      edgeFunctions: false
    }
  }),
  vite: {
    server: {
      // Permite acceder al servidor de dev a través del túnel de Cloudflare
      // (dominio distinto en cada sesión), solo en desarrollo local.
      allowedHosts: true,
    },
  },
})
