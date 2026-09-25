import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/chat": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },

      "/login": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },

      "/signup": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },

      "/logout": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },

      "/chat-history": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },

      "/session": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
})