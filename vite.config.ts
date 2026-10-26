import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'next-auth/react': fileURLToPath(new URL('./src/lib/auth-context.tsx', import.meta.url)),
        'next/link': fileURLToPath(new URL('./src/components/shared/link.tsx', import.meta.url)),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
