-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_APP_PROMOTION');

-- CreateEnum
CREATE TYPE "SpecialAdCategory" AS ENUM ('HOUSING', 'EMPLOYMENT', 'CREDIT', 'ISSUES_ELECTIONS_POLITICS');

-- CreateEnum
CREATE TYPE "BidStrategy" AS ENUM ('LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP', 'LOWEST_COST_WITH_MIN_ROAS');

-- CreateEnum
CREATE TYPE "BuyingType" AS ENUM ('AUCTION');

-- CreateEnum
CREATE TYPE "CreativeFormat" AS ENUM ('IMAGE_POST', 'VIDEO_POST', 'REELS', 'CAROUSEL', 'STORY');

-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "InsightLevel" AS ENUM ('CAMPAIGN', 'ADSET', 'AD');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "bidAmount" INTEGER,
ADD COLUMN     "bidStrategy" "BidStrategy" DEFAULT 'LOWEST_COST_WITHOUT_CAP',
ADD COLUMN     "buyingType" "BuyingType" DEFAULT 'AUCTION',
ADD COLUMN     "campaignBudgetOptimization" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dailyBudget" INTEGER,
ADD COLUMN     "lifetimeBudget" INTEGER,
ADD COLUMN     "metaCampaignId" TEXT,
ADD COLUMN     "metaEffectiveStatus" TEXT,
ADD COLUMN     "metaReviewFeedback" TEXT,
ADD COLUMN     "metaStatus" TEXT,
ADD COLUMN     "objective" "CampaignObjective",
ADD COLUMN     "specialAdCategories" "SpecialAdCategory"[] DEFAULT ARRAY[]::"SpecialAdCategory"[];

-- CreateTable
CREATE TABLE "ad_sets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "optimizationGoal" TEXT NOT NULL,
    "billingEvent" TEXT NOT NULL,
    "destinationType" TEXT,
    "dsaBeneficiary" TEXT,
    "targeting" JSONB NOT NULL,
    "dailyBudget" INTEGER,
    "lifetimeBudget" INTEGER,
    "bidAmount" INTEGER,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "promotedObject" JSONB,
    "advantagePlacements" BOOLEAN NOT NULL DEFAULT true,
    "metaAdSetId" TEXT,
    "metaStatus" TEXT,
    "metaEffectiveStatus" TEXT,
    "metaReviewFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "CreativeFormat" NOT NULL,
    "pageId" TEXT NOT NULL,
    "instagramUserId" TEXT,
    "objectStorySpec" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiDisclosureLabel" BOOLEAN NOT NULL DEFAULT false,
    "metaCreativeId" TEXT,
    "metaReviewFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
    "metaImageHash" TEXT,
    "metaVideoId" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metaAdId" TEXT,
    "metaStatus" TEXT,
    "metaEffectiveStatus" TEXT,
    "metaReviewFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_insights" (
    "id" TEXT NOT NULL,
    "level" "InsightLevel" NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adSetId" TEXT,
    "adId" TEXT,
    "adSetDedupKey" TEXT NOT NULL DEFAULT '',
    "adDedupKey" TEXT NOT NULL DEFAULT '',
    "publisherPlatform" TEXT NOT NULL DEFAULT '',
    "placement" TEXT NOT NULL DEFAULT '',
    "dateStart" DATE NOT NULL,
    "dateStop" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "frequency" DECIMAL(10,4),
    "spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DECIMAL(10,4),
    "cpc" DECIMAL(10,4),
    "cpm" DECIMAL(10,4),
    "actions" JSONB,
    "costPerActionType" JSONB,
    "videoP25Watched" INTEGER,
    "videoP50Watched" INTEGER,
    "videoP75Watched" INTEGER,
    "videoP100Watched" INTEGER,
    "videoThruplayWatched" INTEGER,
    "purchaseRoas" DECIMAL(10,4),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_sets_metaAdSetId_key" ON "ad_sets"("metaAdSetId");

-- CreateIndex
CREATE INDEX "ad_sets_campaignId_idx" ON "ad_sets"("campaignId");

-- CreateIndex
CREATE INDEX "ad_sets_userId_idx" ON "ad_sets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_creatives_metaCreativeId_key" ON "ad_creatives"("metaCreativeId");

-- CreateIndex
CREATE INDEX "ad_creatives_adSetId_idx" ON "ad_creatives"("adSetId");

-- CreateIndex
CREATE INDEX "ad_creatives_userId_idx" ON "ad_creatives"("userId");

-- CreateIndex
CREATE INDEX "media_assets_creativeId_idx" ON "media_assets"("creativeId");

-- CreateIndex
CREATE INDEX "media_assets_userId_idx" ON "media_assets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ads_metaAdId_key" ON "ads"("metaAdId");

-- CreateIndex
CREATE INDEX "ads_adSetId_idx" ON "ads"("adSetId");

-- CreateIndex
CREATE INDEX "ads_userId_idx" ON "ads"("userId");

-- CreateIndex
CREATE INDEX "ad_insights_userId_idx" ON "ad_insights"("userId");

-- CreateIndex
CREATE INDEX "ad_insights_adSetId_idx" ON "ad_insights"("adSetId");

-- CreateIndex
CREATE INDEX "ad_insights_adId_idx" ON "ad_insights"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_insights_level_campaignId_adSetDedupKey_adDedupKey_dateS_key" ON "ad_insights"("level", "campaignId", "adSetDedupKey", "adDedupKey", "dateStart", "dateStop", "publisherPlatform", "placement");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_metaCampaignId_key" ON "campaigns"("metaCampaignId");

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "ad_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "ad_creatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "ad_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "ad_creatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "ad_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

