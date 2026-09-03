import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-dashboard',
      configureServer(server) {
        server.middlewares.use('/api/save-dashboard', async (req, res, next) => {
          if (req.method !== 'POST') return next()
          const chunks: Buffer[] = []
          req.on('data', chunk => chunks.push(chunk))
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString())
              const filePath = path.resolve(__dirname, 'public/data/dashboard-data.json')
              fs.writeFileSync(filePath, JSON.stringify(body, null, 2))
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: String(e) }))
            }
          })
        })
      },
    },
  ],
  server: {
    port: 5173,
  },
})