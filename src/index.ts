import { app } from '@/app'
import { env } from '@/config/env'

console.log(`Healthcare ERP Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}
