import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'ec2-16-170-210-30.eu-north-1.compute.amazonaws.com', // Replace with your actual EC2 URL (e.g., http://ec2-xx-xx-xx-xx.compute-1.amazonaws.com)
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})