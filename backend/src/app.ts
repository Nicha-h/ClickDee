import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { registerErrorHandlers } from './middleware/error-handler.js'
import { healthApp } from './routes/health.js'
import { campaignsApp } from './routes/campaigns.js'
import { authApp } from './routes/auth.js'
import { aiApp } from './routes/ai.js'
import { onboardingApp } from './routes/onboarding.js'
import { aiMemoryApp } from './routes/ai-memory.js'
import { notificationsApp } from './routes/notifications.js'
import { adSetsApp } from './routes/ad-sets.js'
import { adCreativesApp } from './routes/ad-creatives.js'
import { adsApp } from './routes/ads.js'
import { mediaApp } from './routes/media.js'
import { metaPublishApp } from './routes/meta-publish.js'
import { insightsApp } from './routes/insights.js'

export const app = new OpenAPIHono()

app.use(
  '/api/*',
  cors({ origin: ['http://localhost:5173'], credentials: true }),
)

app.route('/api/health', healthApp)
app.route('/api/campaigns', campaignsApp)
// Nested campaign-hierarchy resources mounted at the same '/api/campaigns'
// prefix, each owning its own subset of paths under it (e.g.
// '/{campaignId}/ad-sets') — mirrors how campaignsApp declares '/' and
// '/{id}' rather than nesting a second layer of sub-apps.
app.route('/api/campaigns', adSetsApp)
app.route('/api/campaigns', adCreativesApp)
app.route('/api/campaigns', adsApp)
app.route('/api/campaigns', metaPublishApp)
app.route('/api/campaigns', insightsApp)
app.route('/api/media', mediaApp)
app.route('/api/auth', authApp)
app.route('/api/ai', aiApp)
app.route('/api/onboarding', onboardingApp)
app.route('/api/ai-memory', aiMemoryApp)
app.route('/api/notifications', notificationsApp)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'ClickDee API',
  },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

registerErrorHandlers(app)
