import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Porta fixa: o backend libera CORS para http://localhost:5173 por padrão
  server: { port: 5173, strictPort: true },
});
