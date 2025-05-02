import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
      host: "0.0.0.0",  // Plus clair que "::"
      port: 8080,       // Doit matcher avec CORS_ORIGINS
      proxy: {          // Ajouter un proxy pour les API
        '/api': {
          target: 'http://backend:5000',  // Utilisez le nom du service docker
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
