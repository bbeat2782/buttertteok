import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { naverApiPlugin } from './vite-plugins/naver-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), naverApiPlugin()],
})
