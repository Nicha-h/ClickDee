// One-off seed script: moves the frontend's 3 hardcoded demo campaigns
// (frontend/src/data/campaigns.ts) into real, per-user data owned by
// admin810@gmail.com, so the campaign list page no longer needs to show
// placeholder data to every user (see plan: "fix campaign page").
//
// Run from backend/: node --import tsx scripts/seed-admin810.ts
// (or: pnpm --filter backend seed:admin810)
import { randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../src/db/client.js'
import { hashPassword } from '../src/lib/password.js'
import { findUserByEmail } from '../src/services/user.service.js'
import { createCampaign } from '../src/services/campaign.service.js'
import { createAdSet } from '../src/services/ad-set.service.js'
import { createAdCreative } from '../src/services/ad-creative.service.js'
import { createAd } from '../src/services/ad.service.js'
import { storeInsights } from '../src/services/ad-insight.service.js'
import { uploadBufferToCloudinary } from '../src/lib/cloudinary-client.js'
import { getCloudinaryCredentials } from '../src/config/cloudinary.js'
import { env } from '../src/config/env.js'
import type { CreateCampaignInput } from '../src/schemas/campaign.schema.js'
import type { CreateAdSetInput } from '../src/schemas/ad-set.schema.js'
import type { CreateImagePostCreativeInput } from '../src/schemas/ad-creative.schema.js'

const ADMIN_EMAIL = 'admin810@gmail.com'

function randomId(): string {
  return randomBytes(6).toString('hex')
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const BUSINESS_NAMES = ['ร้านกาแฟบ้านสวน', 'คาเฟ่ริมทาง', 'ร้านกาแฟดอยหลวง']
const LOCATIONS = ['เชียงใหม่', 'กรุงเทพมหานคร', 'ขอนแก่น']
const CATEGORIES = ['อาหารและเครื่องดื่ม']
const AD_EXPERIENCE = ['เคยลงโฆษณามาก่อน', 'ไม่เคยลงโฆษณามาก่อน']
const BUDGETS = ['1000-5000', '5000-10000']
const SIGNATURE_PRODUCTS = ['ลาเต้เย็นและครัวซองต์โฮมเมด', 'ไมโลปั่นและเบเกอรี่']
const PEAK_HOURS = ['07:00-10:00', '15:00-18:00']
const PROMO_HIGHLIGHTS = ['ลดราคาช่วงเทศกาล', 'โปรโมชันตามฤดูกาล']

async function ensureAdminUser() {
  const existing = await findUserByEmail(ADMIN_EMAIL)
  if (existing) {
    console.log(`Found existing user ${ADMIN_EMAIL} (${existing.id})`)
    return existing
  }

  const password = randomBytes(12).toString('base64url')
  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      businessName: pick(BUSINESS_NAMES),
      location: pick(LOCATIONS),
      category: pick(CATEGORIES),
      adExperience: pick(AD_EXPERIENCE),
      budget: pick(BUDGETS),
      goal: 'เพิ่มยอดขายออนไลน์',
      signatureProduct: pick(SIGNATURE_PRODUCTS),
      platforms: ['facebook'],
      peakHours: pick(PEAK_HOURS),
      promoHighlight: pick(PROMO_HIGHLIGHTS),
    },
  })

  console.log(`Created user ${ADMIN_EMAIL} (${user.id})`)
  console.log(`Generated password (shown once): ${password}`)
  return user
}

type SeedCampaign = {
  slug: string
  title: string
  goal: string
  status: CreateCampaignInput['status']
  budgetTotal: number
  objective: CreateCampaignInput['objective']
  creativeCaption: string
  // File name under backend/static/placeholders/, uploaded to Cloudinary by
  // seedImageUrl below — the actual campaign artwork, matching
  // frontend/src/data/campaigns.ts's mock thumbnails.
  imageFile: string
}

// Uploads backend/static/placeholders/<imageFile> to Cloudinary (reusing the
// same lib/cloudinary-client.ts helper media.service.ts uses for real
// uploads, not a second hand-rolled implementation) and returns its
// absolute, always-reachable secure_url. Replaces the old relative
// "/static/placeholders/..." path, which only worked via app.ts's
// '/static/*' route + nginx proxy — and 404s in production today, since the
// Dockerfile never copies backend/static/ into the runtime image. Unlike
// media.service.ts's live upload path (where a Cloudinary failure is
// non-fatal), this throws on failure: a seed run has no independent
// fallback the way a real upload has Meta's hash, so a silently-broken image
// URL here is worse than a loud failure telling the operator to configure
// Cloudinary.
const cloudinaryUrlCache = new Map<string, string>()
async function seedImageUrl(imageFile: string): Promise<string> {
  const cached = cloudinaryUrlCache.get(imageFile)
  if (cached) return cached

  if (!getCloudinaryCredentials()) {
    throw new Error(
      'Cloudinary is not configured — seed-admin810.ts requires CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET to host placeholder images (see backend/.env.example).',
    )
  }

  const filePath = path.join('static', 'placeholders', imageFile)
  const buffer = await readFile(filePath)
  const result = await uploadBufferToCloudinary({
    buffer,
    publicId: `seed-placeholder-${path.parse(imageFile).name}`,
    resourceType: 'image',
    folder: `clickdee/${env.NODE_ENV}/seed`,
  })
  cloudinaryUrlCache.set(imageFile, result.secureUrl)
  return result.secureUrl
}

const SEED_CAMPAIGNS: SeedCampaign[] = [
  {
    slug: 'rain-promo-2026',
    title: 'โปรหน้าฝน 2026 ลด 20%',
    goal: 'เป้าหมาย: เพิ่มยอดขาย',
    status: 'ACTIVE',
    budgetTotal: 6000,
    objective: 'OUTCOME_SALES',
    creativeCaption: 'ฝนตก หนาวๆ คู่ที่ดีที่สุดคือลาเต้กับครัวซองต์',
    imageFile: 'campaign-rain-promo.png',
  },
  {
    slug: 'milo-promo-2026',
    title: 'โปรไมโล 2026 ลด 60%',
    goal: 'เป้าหมาย: ระบายสต็อก',
    status: 'PAUSED',
    budgetTotal: 8000,
    objective: 'OUTCOME_SALES',
    creativeCaption: 'ไมโลปั่นเย็นฉ่ำ ลด 60% วันนี้เท่านั้น',
    imageFile: 'campaign-milo-promo.jpg',
  },
  {
    slug: 'latte-caramel-2026',
    title: 'ลาเต้คาราเมล เมนูใหม่',
    goal: 'เป้าหมาย: ทดสอบครีเอทีฟใหม่ (A/B Test)',
    status: 'COMPLETED',
    budgetTotal: 8000,
    objective: 'OUTCOME_ENGAGEMENT',
    creativeCaption: 'เซ็ตคู่ไมโล + ขนม ลด 30%',
    imageFile: 'campaign-latte-promo.jpg',
  },
]

const DAY_MS = 86_400_000

// Daily performance to back the home page's ROI display + sparkline for
// this demo account (see frontend "the campaign card on home should show
// ROI ... add some metric so the graph would display"). Reach/spend mirror
// the retired frontend/src/data/campaigns.ts mock dailyTrend arrays for
// these same slugs; `roas` is new — a steadily climbing purchase ROAS
// (Meta's own field, surfaced to the frontend as AdInsight.purchaseRoas)
// ending at that mock's static `roi` value, so the home card's ROI number
// visibly grows day over day instead of sitting flat.
const SEED_DAILY_TRENDS: Record<
  string,
  { reach: number; spend: number; roas: number }[]
> = {
  'rain-promo-2026': [
    { reach: 2800, spend: 380, roas: 6.2 },
    { reach: 3200, spend: 410, roas: 7.1 },
    { reach: 3550, spend: 430, roas: 8.0 },
    { reach: 3900, spend: 460, roas: 8.9 },
    { reach: 4300, spend: 470, roas: 9.8 },
    { reach: 4750, spend: 480, roas: 10.6 },
    { reach: 5100, spend: 490, roas: 11.5 },
  ],
  'milo-promo-2026': [
    { reach: 6200, spend: 700, roas: 10.4 },
    { reach: 8100, spend: 950, roas: 12.3 },
    { reach: 9800, spend: 1150, roas: 14.1 },
    { reach: 11400, spend: 1300, roas: 15.8 },
    { reach: 9600, spend: 1200, roas: 16.6 },
    { reach: 8700, spend: 1000, roas: 17.4 },
    { reach: 8100, spend: 950, roas: 18.2 },
  ],
  'latte-caramel-2026': [
    { reach: 7200, spend: 900, roas: 10.4 },
    { reach: 5400, spend: 650, roas: 11.9 },
    { reach: 8900, spend: 1150, roas: 13.4 },
    { reach: 6100, spend: 800, roas: 14.8 },
    { reach: 9600, spend: 1300, roas: 16.3 },
    { reach: 7800, spend: 1000, roas: 17.2 },
    { reach: 10400, spend: 1450, roas: 18.2 },
  ],
}

// Meta's own campaign-level effective_status vocabulary — see
// meta-publish.service.ts's simulatedMetaId for the same "sim_<kind>_<uuid>,
// never mistakable for a real Meta id" convention this reuses.
function seedMetaCampaignId() {
  return `sim_campaign_${randomUUID()}`
}

async function ensureMetaCampaignId(campaignId: string, seed: SeedCampaign) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
  })
  if (campaign.metaCampaignId) return

  const metaStatus =
    seed.status === 'PAUSED'
      ? 'PAUSED'
      : seed.status === 'COMPLETED'
        ? 'ARCHIVED'
        : 'ACTIVE'
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      metaCampaignId: seedMetaCampaignId(),
      metaStatus,
      metaEffectiveStatus: metaStatus,
    },
  })
  console.log(`  Set simulated metaCampaignId for "${seed.title}"`)
}

// Writes through the same storeInsights() upsert the real Meta-refresh path
// uses (routes/insights.ts), so re-running this script is safe — it updates
// the same rows by (level, campaignId, date) instead of duplicating them.
async function seedCampaignInsights(
  userId: string,
  campaignId: string,
  slug: string,
) {
  const dailyMetrics = SEED_DAILY_TRENDS[slug]
  if (!dailyMetrics) return

  const now = Date.now()
  const rows = dailyMetrics.map((metric, i) => {
    const daysAgo = dailyMetrics.length - i
    const date = new Date(now - daysAgo * DAY_MS).toISOString().slice(0, 10)
    return {
      date_start: date,
      date_stop: date,
      impressions: String(Math.round(metric.reach * 1.4)),
      reach: String(metric.reach),
      spend: String(metric.spend),
      clicks: String(Math.round(metric.reach * 0.065)),
      unique_clicks: String(Math.round(metric.reach * 0.06)),
      purchase_roas: [
        { action_type: 'omni_purchase', value: String(metric.roas) },
      ],
    }
  })

  await storeInsights(userId, 'CAMPAIGN', campaignId, null, null, rows)
  console.log(
    `  Seeded ${rows.length} daily insight rows for "${slug}" (ROI now ${dailyMetrics[dailyMetrics.length - 1].roas}x)`,
  )
}

function campaignDates(status: CreateCampaignInput['status']) {
  const now = Date.now()
  if (status === 'COMPLETED') {
    return {
      startDate: new Date(now - 30 * DAY_MS).toISOString(),
      endDate: new Date(now - 3 * DAY_MS).toISOString(),
    }
  }
  return {
    startDate: new Date(now - 9 * DAY_MS).toISOString(),
    endDate: new Date(now + 5 * DAY_MS).toISOString(),
  }
}

async function fixExistingCampaignImage(campaignId: string, seed: SeedCampaign) {
  const correctUrl = await seedImageUrl(seed.imageFile)
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { creative: { adSet: { campaignId } } },
  })
  for (const asset of mediaAssets) {
    if (asset.cloudinaryUrl === correctUrl) continue
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { cloudinaryUrl: correctUrl },
    })
    console.log(
      `  Fixed image for "${seed.title}" (${asset.id}): ${asset.cloudinaryUrl} -> ${correctUrl}`,
    )
  }
}

async function seedCampaign(userId: string, seed: SeedCampaign) {
  const existing = await prisma.campaign.findFirst({
    where: { userId, name: seed.title },
  })
  if (existing) {
    console.log(`"${seed.title}" already exists (${existing.id}) — checking image`)
    await fixExistingCampaignImage(existing.id, seed)
    await ensureMetaCampaignId(existing.id, seed)
    await seedCampaignInsights(userId, existing.id, seed.slug)
    return
  }

  const { startDate, endDate } = campaignDates(seed.status)
  const campaignInput: CreateCampaignInput = {
    name: seed.title,
    caption: seed.goal,
    status: seed.status,
    budget: seed.budgetTotal,
    startDate,
    endDate,
    objective: seed.objective,
    specialAdCategories: [],
    campaignBudgetOptimization: true,
  }
  const campaign = await createCampaign(userId, campaignInput)
  console.log(`Created campaign "${seed.title}" (${campaign.id})`)

  // Local-only placeholder media — no real Meta upload happens here (same
  // "no HTTP call to Meta as a side effect of a create route" rule the rest
  // of the app follows for locally-created draft objects). The frontend's
  // own placeholder images are bundled JS module imports, not servable URLs
  // a backend seed script can reuse directly — copies live in
  // backend/static/placeholders/, uploaded to Cloudinary by seedImageUrl
  // above (sourceUrl stays null here since there's no Meta upload at all).
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      userId,
      type: 'IMAGE',
      status: 'READY',
      metaImageHash: `sim_hash_${randomId()}`,
      cloudinaryUrl: await seedImageUrl(seed.imageFile),
    },
  })

  const adSetInput: CreateAdSetInput = {
    name: `${seed.title} - ชุดโฆษณาหลัก`,
    optimizationGoal: 'REACH',
    billingEvent: 'IMPRESSIONS',
    targeting: { targeting_automation: { advantage_audience: 1 } },
    lifetimeBudget: Math.round(seed.budgetTotal * 100),
    advantagePlacements: true,
  }
  const adSet = await createAdSet(userId, campaign.id, adSetInput)
  if (!adSet) throw new Error(`Failed to create ad set for ${seed.title}`)
  console.log(`  Created ad set (${adSet.id})`)

  const creativeInput: CreateImagePostCreativeInput = {
    name: `${seed.title} - ครีเอทีฟหลัก`,
    format: 'IMAGE_POST',
    pageId: `sim_page_${randomId()}`,
    mediaAssetId: mediaAsset.id,
    link: 'https://clickdee.example.com/promo',
    message: seed.creativeCaption,
    callToActionType: 'SHOP_NOW',
  }
  const creative = await createAdCreative(
    userId,
    campaign.id,
    adSet.id,
    creativeInput,
  )
  if (!creative) throw new Error(`Failed to create ad creative for ${seed.title}`)
  console.log(`  Created ad creative (${creative.id})`)

  await prisma.mediaAsset.update({
    where: { id: mediaAsset.id },
    data: { creativeId: creative.id },
  })

  const ad = await createAd(userId, campaign.id, adSet.id, {
    name: `${seed.title} - โฆษณาหลัก`,
    creativeId: creative.id,
  })
  if (!ad) throw new Error(`Failed to create ad for ${seed.title}`)
  console.log(`  Created ad (${ad.id})`)

  await ensureMetaCampaignId(campaign.id, seed)
  await seedCampaignInsights(userId, campaign.id, seed.slug)
}

async function main() {
  const user = await ensureAdminUser()
  for (const seed of SEED_CAMPAIGNS) {
    await seedCampaign(user.id, seed)
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
