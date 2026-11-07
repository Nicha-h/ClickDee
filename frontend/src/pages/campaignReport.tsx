import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Users,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  Pause,
  Play,
  Plus,
  Square,
  Pencil,
  Trash2,
  UploadCloud,
  Zap,
  TriangleAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
} from 'lucide-react'
import { CTA_LABELS } from '@/lib/adCreativeLabels'
import cash from '@/assets/icons/cash.svg'
import DonutChart from '@/components/donutChart'
import TrendChart from '@/components/trendChart'
import {
  indexToFirst,
  reachVsSpendSeries,
  percentFormatter,
} from '@/components/trendChartUtils'
import {
  campaigns,
  platformBadgeStyles,
  getMetaStatusBadge,
  getPushStatusBadge,
} from '@/data/campaigns'
import type {
  Creative,
  CampaignItem,
  DailyTrendPoint,
  ChannelReach,
  Platform,
} from '@/data/campaigns'
import CampaignReportSkeleton from '@/components/campaignReportSkeleton'
import { Skeleton } from '@/components/skeleton'
import StatusPill from '@/components/statusPill'
import ConfirmDialog from '@/components/confirmDialog'
import {
  getApiCampaignsId,
  patchApiCampaignsId,
  getApiAiCampaignsIdInsights,
  postApiCampaignsIdPublishToMeta,
  postApiCampaignsIdMetaStatus,
  getApiCampaignsIdInsights,
  getApiCampaignsCampaignIdAdSets,
  getApiCampaignsCampaignIdAdSetsAdSetIdCreatives,
  getApiCampaignsCampaignIdAdSetsAdSetIdAds,
  deleteApiCampaignsCampaignIdAdSetsId,
  deleteApiCampaignsCampaignIdAdSetsAdSetIdCreativesId,
} from '@/api/generated/client'
import type {
  CampaignStatus as ApiCampaignStatus,
  AdSet,
  AdCreative,
  Ad,
} from '@/api/generated/client'
import { toCampaignItem, fetchCampaignThumbnail } from '@/lib/campaignAdapters'
import { useGoBack } from '@/components/useGoBack'
import { withCredentials } from '@/lib/userId'
import { useToast } from '@/lib/toastContext'
import { resolveAssetUrl } from '@/lib/assetUrl'

type ReportStatus = 'active' | 'paused' | 'stopped'

function MetricCard({
  icon,
  label,
  value,
  trend,
  caption,
}: {
  icon: ReactNode
  label: string
  value: string
  trend?: string
  caption: string
}) {
  return (
    <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-thai text-amalfi text-xl font-bold">{label}</h3>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
          {value}
        </p>
        {trend && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#519b5c]">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </span>
        )}
      </div>
      <p className="font-thai mt-2 text-base font-semibold text-black">
        {caption}
      </p>
    </div>
  )
}

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#8E98A8]">
      <div className="relative">
        <img
          src={creative.image}
          alt={creative.caption}
          className="h-37 w-full object-cover"
        />
        <span
          className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-base font-semibold"
          style={{
            color: creative.badgeBorderColor,
            border: `1px solid ${creative.badgeBorderColor}`,
          }}
        >
          #{creative.rank}
        </span>
      </div>
      <div className="p-3">
        <p className="font-thai text-base text-black">{creative.caption}</p>
        <div className="mt-2 flex gap-4">
          <div>
            <p className="font-thai text-seadark text-base">การแสดงผล</p>
            <p className="text-base font-semibold text-black">
              {creative.impressions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-thai text-seadark text-base">CTR</p>
            <p className="text-base font-semibold text-black">
              {creative.ctr}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

type AdSetWithChildren = {
  adSet: AdSet
  creatives: AdCreative[]
  ads: Ad[]
}

// Only rendered for source === 'api' campaigns — mock/demo campaigns have no
// backing AdSet/AdCreative/Ad rows, so they keep the old static creatives
// grid instead (see CampaignReportView below).
function formatBudget(adSet: AdSet): string {
  if (adSet.dailyBudget !== null) {
    return `฿${(adSet.dailyBudget / 100).toLocaleString()} / วัน`
  }
  if (adSet.lifetimeBudget !== null) {
    return `฿${(adSet.lifetimeBudget / 100).toLocaleString()} ตลอดแคมเปญ`
  }
  return 'จัดการงบที่ระดับแคมเปญ'
}

function formatSchedule(adSet: AdSet): string | null {
  if (!adSet.startTime && !adSet.endTime) return null
  const start = adSet.startTime
    ? new Date(adSet.startTime).toLocaleDateString('th-TH')
    : '-'
  const end = adSet.endTime
    ? new Date(adSet.endTime).toLocaleDateString('th-TH')
    : 'ไม่มีกำหนดสิ้นสุด'
  return `${start} – ${end}`
}

function formatTargeting(targeting: AdSet['targeting']): string {
  const automation = targeting?.targeting_automation as
    { advantage_audience?: number } | undefined
  if (automation?.advantage_audience) {
    return 'กลุ่มเป้าหมายอัตโนมัติ (Advantage+)'
  }
  const ageMin = targeting?.age_min as number | undefined
  const ageMax = targeting?.age_max as number | undefined
  const genders = targeting?.genders as number[] | undefined
  const genderLabel =
    !genders || genders.length === 0
      ? 'ทุกเพศ'
      : genders.includes(1) && genders.includes(2)
        ? 'ทุกเพศ'
        : genders.includes(1)
          ? 'ชาย'
          : 'หญิง'
  const ageLabel = ageMin && ageMax ? `อายุ ${ageMin}-${ageMax} ปี` : ''
  return [ageLabel, genderLabel].filter(Boolean).join(' · ') || 'ไม่ระบุ'
}

function AdSetDetail({ adSet }: { adSet: AdSet }) {
  const schedule = formatSchedule(adSet)
  return (
    <div className="font-thai mt-2 flex flex-col gap-1 rounded-lg bg-[rgba(142,152,168,0.08)] p-3 text-base text-black">
      <p>กลุ่มเป้าหมาย: {formatTargeting(adSet.targeting)}</p>
      <p>งบประมาณ: {formatBudget(adSet)}</p>
      {schedule && <p>ระยะเวลา: {schedule}</p>}
    </div>
  )
}

type CreativeDetails = {
  mediaAssetUrl?: string
  message?: string
  link?: string
  title?: string
  callToActionType?: string
  childAttachments?: {
    mediaAssetUrl?: string
    name?: string
    link?: string
    description?: string
  }[]
}

function CreativeDetail({ creative }: { creative: AdCreative }) {
  const details = creative.creativeDetails as unknown as CreativeDetails

  return (
    <div className="font-thai mt-2 flex flex-col gap-2 rounded-lg bg-[rgba(142,152,168,0.08)] p-3 text-base text-black">
      {details.title && <p className="font-bold">{details.title}</p>}
      {details.message && <p>{details.message}</p>}
      <div className="flex flex-wrap items-center gap-3 text-sm text-[#8E98A8]">
        {details.link && (
          <a
            href={details.link}
            target="_blank"
            rel="noreferrer"
            className="text-seadark hover:text-seadark-active underline"
          >
            {details.link}
          </a>
        )}
        {details.callToActionType && (
          <span className="bg-sealight-active text-seadark-active rounded-full px-2 py-0.5">
            {CTA_LABELS[details.callToActionType] ?? details.callToActionType}
          </span>
        )}
      </div>
      {details.mediaAssetUrl && (
        <img
          src={resolveAssetUrl(details.mediaAssetUrl)}
          alt=""
          className="h-32 w-32 rounded-lg object-cover"
        />
      )}
      {details.childAttachments && details.childAttachments.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-3">
          {details.childAttachments.map((card, i) => (
            <div
              key={i}
              className="w-32 overflow-hidden rounded-lg border border-[#8E98A8]"
            >
              {card.mediaAssetUrl && (
                <img
                  src={resolveAssetUrl(card.mediaAssetUrl)}
                  alt=""
                  className="h-20 w-full object-cover"
                />
              )}
              <div className="p-1.5">
                <p className="truncate text-sm font-semibold">{card.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdSetsSection({ campaignId }: { campaignId: string }) {
  const { showToast } = useToast()
  const [items, setItems] = useState<AdSetWithChildren[] | null>(null)
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>(
    {},
  )
  const [expandedCreatives, setExpandedCreatives] = useState<
    Record<string, boolean>
  >({})
  const [expandedAds, setExpandedAds] = useState<Record<string, boolean>>({})
  const location = useLocation()

  const [deleteAdSetId, setDeleteAdSetId] = useState<string | null>(null)
  const [deleteCreativeTarget, setDeleteCreativeTarget] = useState<{
    adSetId: string
    creativeId: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCreativeError, setDeleteCreativeError] = useState<string | null>(
    null,
  )

  const handleDeleteAdSetConfirm = async () => {
    if (!deleteAdSetId) return
    setIsDeleting(true)
    try {
      const res = await deleteApiCampaignsCampaignIdAdSetsId(
        campaignId,
        deleteAdSetId,
        withCredentials(),
      )
      if (res.status === 204) {
        setItems((prev) =>
          prev ? prev.filter((item) => item.adSet.id !== deleteAdSetId) : prev,
        )
        setDeleteAdSetId(null)
        showToast('ลบ Ad Set เรียบร้อยแล้ว')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCreativeConfirm = async () => {
    if (!deleteCreativeTarget) return
    setIsDeleting(true)
    setDeleteCreativeError(null)
    try {
      const res = await deleteApiCampaignsCampaignIdAdSetsAdSetIdCreativesId(
        campaignId,
        deleteCreativeTarget.adSetId,
        deleteCreativeTarget.creativeId,
        withCredentials(),
      )
      if (res.status === 204) {
        setItems((prev) =>
          prev
            ? prev.map((item) =>
                item.adSet.id === deleteCreativeTarget.adSetId
                  ? {
                      ...item,
                      creatives: item.creatives.filter(
                        (c) => c.id !== deleteCreativeTarget.creativeId,
                      ),
                    }
                  : item,
              )
            : prev,
        )
        setDeleteCreativeTarget(null)
        showToast('ลบครีเอทีฟเรียบร้อยแล้ว')
      } else {
        setDeleteCreativeError(res.data.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    getApiCampaignsCampaignIdAdSets(campaignId, withCredentials()).then(
      (res) => {
        if (res.status !== 200) return
        Promise.all(
          res.data.map((adSet) =>
            Promise.all([
              getApiCampaignsCampaignIdAdSetsAdSetIdCreatives(
                campaignId,
                adSet.id,
                withCredentials(),
              ),
              getApiCampaignsCampaignIdAdSetsAdSetIdAds(
                campaignId,
                adSet.id,
                withCredentials(),
              ),
            ]).then(([creativesRes, adsRes]) => ({
              adSet,
              creatives: creativesRes.status === 200 ? creativesRes.data : [],
              ads: adsRes.status === 200 ? adsRes.data : [],
            })),
          ),
        ).then(setItems)
      },
    )
  }, [campaignId])

  useEffect(() => {
    if (items === null || location.hash !== '#ad-sets') return
    document
      .getElementById('ad-sets')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [items, location.hash])

  return (
    <div
      id="ad-sets"
      className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            Ad Sets
          </h3>
          <p className="font-thai text-base text-black">
            จัดการกลุ่มโฆษณาและครีเอทีฟของแคมเปญนี้
          </p>
        </div>
        <Link
          to={`/campaign/${campaignId}/adset/new`}
          className="bg-seaactive font-thai hover:bg-seadark flex items-center gap-1 rounded-[15px] px-4 py-2 text-base text-white transition-all hover:scale-105 hover:cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          เพิ่ม Ad Set
        </Link>
      </div>

      {items === null ? (
        <p className="font-thai mt-4 text-base text-[#8E98A8]">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <p className="font-thai mt-4 text-base text-[#8E98A8]">
          ยังไม่มี Ad Set — เริ่มสร้าง Ad Set แรกของคุณ
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {items.map(({ adSet, creatives, ads }) => (
            <div
              key={adSet.id}
              className="rounded-lg border border-[#8E98A8] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedAdSets((prev) => ({
                      ...prev,
                      [adSet.id]: !prev[adSet.id],
                    }))
                  }
                  className="flex flex-1 items-center gap-2 text-left hover:cursor-pointer"
                >
                  {expandedAdSets[adSet.id] ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-[#8E98A8]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#8E98A8]" />
                  )}
                  <div>
                    <p className="font-thai text-lg font-bold text-black">
                      {adSet.name}
                    </p>
                    <p className="font-thai text-base text-[#8E98A8]">
                      {adSet.optimizationGoal}
                    </p>
                  </div>
                </button>
                <Link
                  to={`/campaign/${campaignId}/adset/${adSet.id}/edit`}
                  className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-base hover:cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  แก้ไข
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteAdSetId(adSet.id)}
                  className="font-thai flex items-center gap-1 text-base text-[#E07070] hover:cursor-pointer hover:text-[#c85050]"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบ
                </button>
                <StatusPill
                  style={getPushStatusBadge(
                    !!adSet.metaAdSetId,
                    adSet.metaStatus,
                    adSet.metaEffectiveStatus,
                  )}
                />
              </div>
              {expandedAdSets[adSet.id] && <AdSetDetail adSet={adSet} />}
              {(creatives.length > 0 || ads.length > 0) && (
                <div className="mt-3 flex flex-col gap-2">
                  {creatives.map((c) => (
                    <div key={c.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCreatives((prev) => ({
                              ...prev,
                              [c.id]: !prev[c.id],
                            }))
                          }
                          className="font-thai flex items-center gap-1 rounded-lg bg-[rgba(142,152,168,0.15)] px-3 py-1 text-base text-black hover:cursor-pointer"
                        >
                          {expandedCreatives[c.id] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {c.name} · {c.format}
                        </button>
                        <Link
                          to={`/campaign/${campaignId}/adset/${adSet.id}/creative/${c.id}/edit`}
                          className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-sm hover:cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteCreativeTarget({
                              adSetId: adSet.id,
                              creativeId: c.id,
                            })
                          }
                          className="font-thai flex items-center gap-1 text-sm text-[#E07070] hover:cursor-pointer hover:text-[#c85050]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ลบ
                        </button>
                      </div>
                      {expandedCreatives[c.id] && (
                        <CreativeDetail creative={c} />
                      )}
                    </div>
                  ))}
                  {ads.map((a) => (
                    <div key={a.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAds((prev) => ({
                              ...prev,
                              [a.id]: !prev[a.id],
                            }))
                          }
                          className="font-thai bg-sealight-active text-seadark-active flex items-center gap-1 rounded-lg px-3 py-1 text-base hover:cursor-pointer"
                        >
                          {expandedAds[a.id] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {a.name}
                          <StatusPill
                            style={getPushStatusBadge(
                              !!a.metaAdId,
                              a.metaStatus,
                              a.metaEffectiveStatus,
                            )}
                          />
                        </button>
                        <Link
                          to={`/campaign/${campaignId}/adset/${adSet.id}/ad/${a.id}/edit`}
                          className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-sm hover:cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข
                        </Link>
                      </div>
                      {expandedAds[a.id] &&
                        (() => {
                          const adCreative = creatives.find(
                            (c) => c.id === a.creativeId,
                          )
                          return adCreative ? (
                            <CreativeDetail creative={adCreative} />
                          ) : null
                        })()}
                    </div>
                  ))}
                </div>
              )}
              <Link
                to={`/campaign/${campaignId}/adset/${adSet.id}/creative/new`}
                className="font-thai text-seadark hover:text-seadark-active mt-3 flex items-center gap-1 text-base hover:cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                เพิ่มครีเอทีฟ
              </Link>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteAdSetId !== null}
        title="ยืนยันการลบ Ad Set"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบ Ad Set นี้ ครีเอทีฟและโฆษณาทั้งหมดภายใต้ Ad Set นี้จะถูกลบไปด้วย การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ Ad Set"
        confirmDisabled={isDeleting}
        onConfirm={handleDeleteAdSetConfirm}
        onCancel={() => setDeleteAdSetId(null)}
      />

      <ConfirmDialog
        open={deleteCreativeTarget !== null}
        title="ยืนยันการลบครีเอทีฟ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบครีเอทีฟนี้ การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบครีเอทีฟ"
        confirmDisabled={isDeleting}
        onConfirm={handleDeleteCreativeConfirm}
        onCancel={() => {
          setDeleteCreativeTarget(null)
          setDeleteCreativeError(null)
        }}
      >
        {deleteCreativeError && (
          <p className="font-thai -mt-3 mb-3 text-sm text-red-600">
            {deleteCreativeError}
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

function CampaignReport() {
  const { campaignId } = useParams()
  const mockCampaign = campaigns.find((c) => c.id === campaignId)
  const [apiCampaign, setApiCampaign] = useState<CampaignItem | null>(null)
  const [isLoading, setIsLoading] = useState(!mockCampaign)

  useEffect(() => {
    if (mockCampaign || !campaignId) return
    getApiCampaignsId(campaignId, withCredentials()).then((res) => {
      if (res.status === 200) {
        const item = toCampaignItem(res.data)
        setApiCampaign(item)
        fetchCampaignThumbnail(item.id).then((url) => {
          if (!url) return
          setApiCampaign((prev) => (prev ? { ...prev, thumbnail: url } : prev))
        })
      }
      setIsLoading(false)
    })
  }, [campaignId, mockCampaign])

  if (isLoading) return <CampaignReportSkeleton />

  const campaign = mockCampaign ?? apiCampaign
  if (!campaign) {
    return (
      <div className="flex min-h-full min-w-full flex-col items-center justify-center gap-4 py-10">
        <p className="font-thai text-xl text-black">ไม่พบแคมเปญนี้</p>
        <Link to="/campaign" className="font-thai text-amalfi underline">
          กลับไปหน้าแคมเปญ
        </Link>
      </div>
    )
  }

  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0

  return <CampaignReportView campaign={campaign} budgetPct={budgetPct} />
}

type InsightsState =
  { status: 'loading' } | { status: 'loaded'; insights: string[] }

function CampaignReportView({
  campaign,
  budgetPct,
}: {
  campaign: CampaignItem
  budgetPct: number
}) {
  const [status, setStatus] = useState<ReportStatus>(
    campaign.status === 'ended' || campaign.status === 'draft'
      ? 'stopped'
      : campaign.status,
  )

  // Shadows campaign.meta the same way `status` shadows campaign.status —
  // publish-to-meta/meta-status update this local copy in place rather than
  // refetching the whole campaign.
  const [meta, setMeta] = useState(campaign.meta)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const metaBadge = getMetaStatusBadge(meta)
  const goBack = useGoBack('/campaign')
  const isReviewIssue =
    meta?.effectiveStatus === 'DISAPPROVED' ||
    meta?.effectiveStatus === 'WITH_ISSUES'

  const handlePublishToMeta = async () => {
    setIsPublishing(true)
    try {
      const res = await postApiCampaignsIdPublishToMeta(
        campaign.id,
        withCredentials(),
      )
      if (res.status === 200) {
        setMeta((prev) =>
          prev
            ? {
                ...prev,
                campaignId: res.data.metaCampaignId,
                status: res.data.metaStatus,
                effectiveStatus: res.data.metaEffectiveStatus,
              }
            : prev,
        )
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const handleActivateConfirm = async () => {
    setIsActivating(true)
    try {
      const res = await postApiCampaignsIdMetaStatus(
        campaign.id,
        { status: 'ACTIVE' },
        withCredentials(),
      )
      if (res.status === 200) {
        setMeta((prev) =>
          prev ? { ...prev, status: res.data.metaStatus } : prev,
        )
        setActivateOpen(false)
      }
    } finally {
      setIsActivating(false)
    }
  }

  // Mock/demo campaigns (data/campaigns.ts) have no backing Campaign row to
  // ground a real AI call on, so they keep their static insights tuple; only
  // real (API) campaigns fetch AI-generated ones.
  const [insightsState, setInsightsState] = useState<InsightsState>(
    campaign.source === 'api'
      ? { status: 'loading' }
      : { status: 'loaded', insights: campaign.insights },
  )

  useEffect(() => {
    if (campaign.source !== 'api') return
    getApiAiCampaignsIdInsights(campaign.id, withCredentials()).then((res) => {
      if (res.status === 200) {
        setInsightsState({ status: 'loaded', insights: res.data.insights })
      }
    })
  }, [campaign.id, campaign.source])

  // Real Meta Insights (distinct from the AI-written prose above). Reads
  // stored/cached rows by default (refresh=false) — respects Meta's rate
  // limits per Task 6's guidance; the "รีเฟรชข้อมูล" button below is the
  // only thing that passes refresh=true, so a live Meta pull only happens
  // when the user explicitly asks for one.
  const [apiSummary, setApiSummary] = useState<{
    reach: number
    clicks: number
    spend: number
    ctr: number
  } | null>(null)
  const [apiDailyTrend, setApiDailyTrend] = useState<DailyTrendPoint[]>([])
  const [apiChannelReach, setApiChannelReach] = useState<ChannelReach[]>([])
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false)

  // Pure fetch-and-compute, no setState of its own — the two call sites
  // below (the mount effect and the manual refresh handler) each apply the
  // result inline, matching the codebase's established
  // fetch-on-mount-via-.then() convention (see Topbar.tsx's notification
  // poll) rather than calling a setState-triggering function directly from
  // inside a useEffect body.
  const fetchInsightsData = useCallback(
    async (refresh: boolean) => {
      if (campaign.source !== 'api' || !meta?.campaignId) return null
      const [dailyRes, breakdownRes] = await Promise.all([
        getApiCampaignsIdInsights(
          campaign.id,
          { daily: 'true', ...(refresh && { refresh: 'true' }) },
          withCredentials(),
        ),
        getApiCampaignsIdInsights(
          campaign.id,
          {
            breakdowns: 'publisher_platform',
            ...(refresh && { refresh: 'true' }),
          },
          withCredentials(),
        ),
      ])

      let summary: typeof apiSummary = null
      let dailyTrend: DailyTrendPoint[] = []
      let channelReach: ChannelReach[] = []

      if (dailyRes.status === 200) {
        const rows = [...dailyRes.data].sort((a, b) =>
          a.dateStart.localeCompare(b.dateStart),
        )
        dailyTrend = rows.map((r) => ({
          date: r.dateStart.slice(5),
          reach: r.reach,
          spend: Number(r.spend),
        }))
        const totals = rows.reduce(
          (acc, r) => ({
            reach: acc.reach + r.reach,
            clicks: acc.clicks + r.clicks,
            impressions: acc.impressions + r.impressions,
            spend: acc.spend + Number(r.spend),
          }),
          { reach: 0, clicks: 0, impressions: 0, spend: 0 },
        )
        summary = {
          reach: totals.reach,
          clicks: totals.clicks,
          spend: totals.spend,
          ctr:
            totals.impressions > 0
              ? Math.round((totals.clicks / totals.impressions) * 10000) / 100
              : 0,
        }
      }

      if (breakdownRes.status === 200) {
        const byPlatform = new Map<string, number>()
        for (const row of breakdownRes.data) {
          if (
            row.publisherPlatform !== 'facebook' &&
            row.publisherPlatform !== 'instagram'
          ) {
            continue
          }
          byPlatform.set(
            row.publisherPlatform,
            (byPlatform.get(row.publisherPlatform) ?? 0) + row.reach,
          )
        }
        channelReach = [...byPlatform.entries()].map(([platform, reach]) => ({
          platform: platform as Platform,
          reach,
        }))
      }

      return { summary, dailyTrend, channelReach }
    },
    [campaign.id, campaign.source, meta?.campaignId],
  )

  useEffect(() => {
    fetchInsightsData(false).then((result) => {
      if (!result) return
      setApiSummary(result.summary)
      setApiDailyTrend(result.dailyTrend)
      setApiChannelReach(result.channelReach)
    })
  }, [fetchInsightsData])

  const handleRefreshInsights = async () => {
    setIsRefreshingInsights(true)
    try {
      const result = await fetchInsightsData(true)
      if (result) {
        setApiSummary(result.summary)
        setApiDailyTrend(result.dailyTrend)
        setApiChannelReach(result.channelReach)
      }
    } finally {
      setIsRefreshingInsights(false)
    }
  }

  const displayReach = apiSummary?.reach ?? campaign.reach
  const displayClicks = apiSummary?.clicks ?? campaign.clicks
  const displaySpend = apiSummary?.spend ?? campaign.adSpend
  const displayDailyTrend =
    campaign.source === 'api' ? apiDailyTrend : campaign.dailyTrend
  const displayChannelReach =
    campaign.source === 'api' ? apiChannelReach : campaign.channelReach

  const REPORT_STATUS_TO_API: Record<ReportStatus, ApiCampaignStatus> = {
    active: 'ACTIVE',
    paused: 'PAUSED',
    stopped: 'COMPLETED',
  }

  const handleSetStatus = async (next: ReportStatus) => {
    if (campaign.source !== 'api') {
      setStatus(next)
      return
    }
    const res = await patchApiCampaignsId(
      campaign.id,
      { status: REPORT_STATUS_TO_API[next] },
      withCredentials(),
    )
    if (res.status === 200) {
      setStatus(next)
    }
  }

  const location = useLocation()
  const [creatives] = useState<Creative[]>(() => {
    const newCreative = (
      location.state as {
        newCreative?: Omit<Creative, 'rank' | 'badgeBorderColor'>
      } | null
    )?.newCreative
    if (!newCreative) return campaign.creatives
    const worst = campaign.creatives.reduce((min, c) =>
      c.ctr < min.ctr ? c : min,
    )
    return campaign.creatives.map((c) =>
      c.rank === worst.rank
        ? {
            ...newCreative,
            rank: worst.rank,
            badgeBorderColor: worst.rank === 1 ? '#477099' : '#7f66ba',
          }
        : c,
    )
  })

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={goBack}
            className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
          >
            <ChevronLeft className="text-amalfidark h-7 w-7" />
          </button>
          <div className="font-thai flex flex-col gap-2 font-semibold">
            <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
              {campaign.title}
            </h1>
            <p className="text-base font-semibold text-black">
              {campaign.goal}
              {status !== 'stopped' &&
                ` · ระยะเวลา: เหลืออีก ${campaign.daysRemaining} วัน`}
            </p>
            {campaign.source === 'api' && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill style={metaBadge} />
                {isReviewIssue && (
                  <span className="flex items-center gap-1 text-base text-[#be2c2c]">
                    <TriangleAlert className="h-5 w-5 shrink-0" />
                    {meta?.reviewFeedback ??
                      'Meta ตรวจสอบแล้วพบปัญหา กรุณาตรวจสอบครีเอทีฟ'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="font-thai flex flex-wrap items-center gap-3 text-xl">
          <Link
            to={`/campaign/${campaign.id}/edit`}
            className="hover:text-amalfidark flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
          >
            <Pencil className="h-6 w-6" />
            แก้ไข
          </Link>
          {status === 'active' && (
            <>
              <button
                onClick={() => handleSetStatus('paused')}
                className="hover:text-amalfidark flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
              >
                <Pause className="h-6 w-6" />
                หยุดชั่วคราว
              </button>
              <button
                onClick={() => handleSetStatus('stopped')}
                className="border-[] flex items-center gap-1 rounded-[15px] border px-3 py-1 text-lg text-[#be2c2c] hover:cursor-pointer hover:font-semibold"
              >
                <Square className="h-4 w-4" />
                หยุดแคมเปญ
              </button>
            </>
          )}
          {status === 'paused' && (
            <>
              <button
                onClick={() => handleSetStatus('active')}
                className="flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
              >
                <Play className="h-6 w-6" />
                เริ่มแคมเปญ
              </button>
              <button
                onClick={() => handleSetStatus('stopped')}
                className="border-[] flex items-center gap-1 rounded-[15px] border px-3 py-1 text-lg text-[#be2c2c] hover:cursor-pointer hover:font-semibold"
              >
                <Square className="h-4 w-4" />
                หยุดแคมเปญ
              </button>
            </>
          )}
          {status === 'stopped' && (
            <button
              onClick={() => handleSetStatus('active')}
              className="text-amalfi hover:text-amalfidark flex items-center gap-2 hover:cursor-pointer hover:font-semibold"
            >
              <Play className="h-6 w-6" />
              เริ่มแคมเปญใหม่
            </button>
          )}
          {campaign.source === 'api' && !meta?.campaignId && (
            <button
              type="button"
              disabled={isPublishing}
              onClick={handlePublishToMeta}
              className="text-seadark hover:text-seadark-active flex items-center gap-2 hover:cursor-pointer hover:font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud className="h-6 w-6" />
              {isPublishing ? 'กำลังเผยแพร่...' : 'เผยแพร่ไปที่ Meta'}
            </button>
          )}
          {campaign.source === 'api' &&
            meta?.campaignId &&
            meta.status !== 'ACTIVE' && (
              <button
                type="button"
                onClick={() => setActivateOpen(true)}
                className="flex items-center gap-2 text-[#519b5c] hover:cursor-pointer hover:font-semibold hover:text-[#3f7c48]"
              >
                <Zap className="h-6 w-6" />
                เปิดใช้งานบน Meta
              </button>
            )}
        </div>
      </div>

      {/** Metric cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="text-amalfi h-8 w-8" />}
          label="ยอดเข้าถึง"
          value={displayReach.toLocaleString()}
          trend={campaign.source === 'api' ? undefined : '+8%'}
          caption="คนเห็นโฆษณาของคุณ"
        />
        <MetricCard
          icon={<MousePointerClick className="text-amalfi h-8 w-8" />}
          label="คลิก"
          value={displayClicks.toLocaleString()}
          trend={campaign.source === 'api' ? undefined : '+2%'}
          caption="คนที่สนใจและกดดูร้าน"
        />
        <MetricCard
          icon={<ShoppingCart className="text-amalfi h-8 w-8" />}
          label="ออเดอร์"
          value={campaign.orders.toLocaleString()}
          caption={`CPA ฿${campaign.cpa}`}
        />
        <MetricCard
          icon={<img src={cash} alt="" className="h-8 w-8" />}
          label="ยอดใช้จ่ายโฆษณา"
          value={`฿${displaySpend.toLocaleString()}`}
          caption="ของงบรายเดือน"
        />
      </div>

      {/** Budget usage + ROI */}
      <div className="mt-6 flex flex-col gap-5 md:flex-row">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              การใช้งบประมาณ
            </h3>
            <p className="font-thai text-base text-black">
              <span className="font-bold">
                ฿{campaign.budgetSpent.toLocaleString()}
              </span>{' '}
              / ฿{campaign.budgetTotal.toLocaleString()} · ใช้ไปแล้ว {budgetPct}
              %
            </p>
          </div>
          <div className="mt-3 h-5.5 w-full rounded-xl bg-[rgba(142,152,168,0.5)] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <div
              className="bg-citrus h-5.5 rounded-xl shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="font-thai mt-2 flex flex-row justify-between text-base text-[#a6a6a6]">
            <span>วันละ ฿{campaign.dailyAvgSpend} เฉลี่ย</span>
            <span>เหลือเวลาอีก {campaign.daysRemaining} วัน</span>
          </div>
        </div>
        <div className="bg-amalfihover w-full rounded-xl p-5 text-white md:w-72 lg:w-96">
          <p className="font-thai text-xl">Return on Investment (ROI)</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{campaign.roi}x</p>
          <p className="font-thai mt-3 text-base">
            เทียบกับมาตรฐาน {campaign.roiBenchmark}x ในกลุ่มเดียวกัน
          </p>
        </div>
      </div>

      {/** AI insights */}
      <div className="border-seadark bg-sealight mt-6 rounded-xl border p-6">
        <h3 className="font-thai text-amalfidark mb-4 text-xl font-bold">
          น้องดี AI สรุปแคมเปญนี้ให้
        </h3>
        <div className="flex flex-col flex-wrap gap-4 sm:flex-row">
          {insightsState.status === 'loading' ? (
            <>
              <Skeleton className="h-16 min-w-40 flex-1 rounded-xl sm:min-w-55" />
              <Skeleton className="h-16 min-w-40 flex-1 rounded-xl sm:min-w-55" />
            </>
          ) : insightsState.insights.length === 0 ? (
            <p className="font-thai text-base text-[#8E98A8]">
              ยังไม่มีข้อมูลสรุปตอนนี้
            </p>
          ) : (
            insightsState.insights.map((insight, i) => (
              <div
                key={i}
                className="border-seadark flex min-w-40 flex-1 gap-2 rounded-xl border bg-white p-3 sm:min-w-55"
              >
                <span className="bg-sealight-active text-amalfidark flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base font-bold">
                  {i + 1}
                </span>
                <p className="font-thai text-base text-black">{insight}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/** Charts */}
      <div className="mt-6 flex flex-col gap-5 md:flex-row">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-thai text-amalfidark text-2xl font-bold">
                แนวโน้มรายวัน
              </h3>
              <p className="font-thai text-base text-black">
                การเข้าถึง vs. งบที่ใช้
              </p>
            </div>
            {campaign.source === 'api' && meta?.campaignId && (
              <button
                type="button"
                disabled={isRefreshingInsights}
                onClick={handleRefreshInsights}
                className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-base hover:cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshingInsights ? 'animate-spin' : ''}`}
                />
                รีเฟรชข้อมูล
              </button>
            )}
          </div>
          {displayDailyTrend.length > 0 ? (
            <TrendChart
              data={indexToFirst(displayDailyTrend, ['reach', 'spend'])}
              series={reachVsSpendSeries}
              valueFormatter={percentFormatter}
            />
          ) : (
            <p className="font-thai mt-6 text-center text-base text-[#8E98A8]">
              ยังไม่มีข้อมูลแนวโน้ม เนื่องจากแคมเปญยังไม่มีผลลัพธ์
            </p>
          )}
        </div>
        <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] md:w-72 lg:w-96">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            ช่องทางที่ทำงาน
          </h3>
          {displayChannelReach.length > 0 ? (
            <DonutChart
              centerLabel="100%"
              centerSublabel="การเข้าถึง"
              segments={displayChannelReach.map((c) => ({
                key: c.platform,
                label: platformBadgeStyles[c.platform].label,
                value: c.reach,
                color: platformBadgeStyles[c.platform].chartColor,
              }))}
            />
          ) : (
            <p className="font-thai mt-6 text-center text-base text-[#8E98A8]">
              ยังไม่มีข้อมูลช่องทาง
            </p>
          )}
        </div>
      </div>

      {/** Ad Sets (api campaigns) / Creatives (mock/demo campaigns) */}
      {campaign.source === 'api' ? (
        <AdSetsSection campaignId={campaign.id} />
      ) : (
        <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-thai text-amalfidark text-2xl font-bold">
                ครีเอทีฟที่กำลังทำงาน
              </h3>
              <p className="font-thai text-base text-black">
                AI ทดสอบ A/B/C อัตโนมัติ เพื่อหาว่าใบไหนได้ผลที่สุด
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creatives.map((creative) => (
              <CreativeCard key={creative.rank} creative={creative} />
            ))}
          </div>
        </div>
      )}
      <div className="h-24 w-full shrink-0"></div>

      <ConfirmDialog
        open={activateOpen}
        title="ยืนยันการเปิดใช้งานบน Meta"
        message="แคมเปญนี้จะเริ่มแสดงผลจริงและใช้จ่ายงบประมาณตามที่ตั้งไว้ทันที ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="เปิดใช้งาน"
        confirmDisabled={isActivating}
        onConfirm={handleActivateConfirm}
        onCancel={() => setActivateOpen(false)}
      />
    </div>
  )
}

export default CampaignReport
