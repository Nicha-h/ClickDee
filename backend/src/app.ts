import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { registerErrorHandlers } from './middleware/error-handler.js'
import { healthApp } from './routes/health.js'
import { campaignsApp } from './routes/campaigns.js'
import { authApp } from './routes/auth.js'
import { aiApp } from './routes/ai.js'
import { onboardingApp } from './routes/onboarding.js'

export const app = new OpenAPIHono()

app.use('/api/*', cors({ origin: ['http://localhost:5173'] }))

app.route('/api/health', healthApp)
app.route('/api/campaigns', campaignsApp)
app.route('/api/auth', authApp)
app.route('/api/ai', aiApp)
app.route('/api/onboarding', onboardingApp)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'ClickDee API',
  },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

registerErrorHandlers(app)
