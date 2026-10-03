// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import auth from 'auth-astro';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react(), auth()],

  adapter: netlify()
});