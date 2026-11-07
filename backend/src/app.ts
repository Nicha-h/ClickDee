import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './config/env.js'
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
  cors({ origin: env.CORS_ORIGINS, credentials: true }),
  // JSON-only responses: nothing should ever load or frame them.
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  }),
)
// Placeholder images are loaded cross-origin by the dev frontend
// (localhost:5173 -> :3000), which the default CORP 'same-origin' blocks.
app.use('/static/*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }))
// Swagger UI pulls its assets from a CDN, so no CSP here — defaults only.
app.use('/docs', secureHeaders())
app.use('/openapi.json', secureHeaders())

// Serves backend-owned static assets (e.g. seed-script placeholder images
// that can't reuse the frontend's bundled JS-module assets) from
// backend/static/. `root` is relative to the process cwd (backend/), not
// this file, and — unlike a typical reverse-proxy path rewrite — is
// prepended to the *full* request path rather than replacing the '/static'
// mount prefix, so files must live at './static/<mount-subpath>', i.e.
// './static/placeholders/x.png' for a request to '/static/placeholders/x.png'.
app.use('/static/*', serveStatic({ root: './' }))

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
