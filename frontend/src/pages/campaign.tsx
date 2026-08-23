import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ShoppingCart,
  Search,
  Clock,
  ChevronRight,
  Pause,
  Play,
  Square,
  Pencil,
  Trash2,
  Zap,
  TriangleAlert,
} from 'lucide-react'
import rocket from '@/assets/icons/rocket.svg'
import cash from '@/assets/icons/cash.svg'
import starcircle from '@/assets/icons/starcircle.svg'
import { platformBadgeStyles, getMetaStatusBadge } from '@/data/campaigns'
import type { CampaignItem, CampaignStatus } from '@/data/campaigns'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import CampaignSkeleton from '@/components/campaignSkeleton'
import Sparkline from '@/components/sparkline'
import ConfirmDialog from '@/components/confirmDialog'
import StatusPill from '@/components/statusPill'
import {
  getApiCampaigns,
  patchApiCampaignsId,
  deleteApiCampaignsId,
  postApiCampaignsIdMetaStatus,
  getApiAuthAccountId,
} from '@/api/generated/client'
import { toCampaignItem, fetchCampaignThumbnail } from '@/lib/campaignAdapters'
import { getUserId, withCredentials } from '@/lib/userId'
import { isShowcaseAccount } from '@/lib/showcaseAccount'

{
  /** Summary data — spend/orders/ROI have no backend source, so only the
   * admin810 showcase account sees these numbers; everyone else sees 0. */
}
const SHOWCASE_TOTAL_SPEND = 19694
const SHOWCASE_TOTAL_BUDGET = 32500
const SHOWCASE_REMAINING_BUDGET = 12806
const SHOWCASE_TOTAL_ORDERS = 2462
const SHOWCASE_ORDERS_DELTA = 184
const SHOWCASE_ROI = 11.5

type FilterTab = { key: string; label: string; count: number }

function buildFilterTabs(items: CampaignItem[]): FilterTab[] {
  return [
    { key: 'all', label: 'ทั้งหมด', count: items.length },
    {
      key: 'active',
      label: 'กำลังทำงาน',
      count: items.filter((c) => c.status === 'active').length,
    },
    {
      key: 'paused',
      label: 'หยุดชั่วคราว',
      count: items.filter((c) => c.status === 'paused').length,
    },
    {
      key: 'draft',
      label: 'ฉบับร่าง',
      count: items.filter((c) => c.status === 'draft').length,
    },
    {
      key: 'ended',
      label: 'สิ้นสุดแล้ว',
      count: items.filter((c) => c.status === 'ended').length,
    },
  ]
}

const statusBadgeStyles: Record<
  CampaignItem['status'],
  { bg: string; textColor: string; dotColor: string; label: string }
> = {
  active: {
    bg: 'bg-[#caf3d0]',
    textColor: 'text-[#519b5c]',
    dotColor: 'bg-[#519b5c]',
    label: 'กำลังทำงาน',
  },
  paused: {
    bg: 'bg-citrus-light-active',
    textColor: 'text-citrusdark',
    dotColor: 'bg-citrusdark',
    label: 'หยุดชั่วคราว',
  },
  draft: {
    bg: 'bg-sealight',
    textColor: 'text-seadark-active',
    dotColor: 'bg-seadark-active',
    label: 'ฉบับร่าง',
  },
  ended: {
    bg: 'bg-[#E5E7EB]',
    textColor: 'text-[#6B7280]',
    dotColor: 'bg-[#6B7280]',
    label: 'สิ้นสุดแล้ว',
  },
}

const STATUS_SORT_PRIORITY: Record<CampaignStatus, number> = {
  active: 0,
  paused: 1,
  draft: 2,
  ended: 3,
}

function compareCampaigns(a: CampaignItem, b: CampaignItem): number {
  const statusDiff =
    STATUS_SORT_PRIORITY[a.status] - STATUS_SORT_PRIORITY[b.status]
  if (statusDiff !== 0) return statusDiff
  return a.daysRemaining - b.daysRemaining
}

function CampaignCard({
  campaign,
  onPause,
  onResume,
  onStop,
  onDeleteRequest,
  onReviewDraft,
  onActivateRequest,
}: {
  campaign: CampaignItem
  onPause: (id: string) => void
  onResume: (id: string) => void
  onStop: (id: string) => void
  onDeleteRequest: (id: string) => void
  onReviewDraft: (id: string) => void
  onActivateRequest: (id: string) => void
}) {
  const statusBadge = statusBadgeStyles[campaign.status]
  const metaBadge = getMetaStatusBadge(campaign.meta)
  const isReviewIssue =
    campaign.meta?.effectiveStatus === 'DISAPPROVED' ||
    campaign.meta?.effectiveStatus === 'WITH_ISSUES'
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#8E98A8] lg:shrink-0 lg:flex-row">
      <img
        src={campaign.thumbnail}
        alt={campaign.title}
        className="h-48 w-full shrink-0 rounded-t-xl object-cover lg:h-auto lg:w-40 lg:self-stretch lg:rounded-tl-xl lg:rounded-tr-none lg:rounded-bl-xl"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-row flex-wrap items-start justify-between gap-2">
          <h3 className="font-thai text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
            {campaign.title}
          </h3>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <StatusPill style={statusBadge} />
            {campaign.source === 'api' && <StatusPill style={metaBadge} />}
            {campaign.status !== 'ended' &&
              Number.isFinite(campaign.daysRemaining) && (
                <span className="font-thai text-citrusdark flex items-center gap-1 text-lg font-medium">
                  <Clock className="h-4 w-4" />
                  เหลือ {campaign.daysRemaining} วัน
                </span>
              )}
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-3">
          <p className="font-thai text-lg font-bold text-black">
            {campaign.goal}
          </p>
          <div className="flex flex-row flex-wrap gap-2">
            {campaign.platforms.map((platform) => {
              const badge = platformBadgeStyles[platform]
              return (
                <span
                  key={platform}
                  className={`inline-flex items-center gap-1 rounded-full px-6 py-2 text-base font-medium ${badge.bg} ${badge.textColor}`}
                >
                  <img src={badge.icon} alt="" className="h-5 w-5" />
                  {badge.label}
                </span>
              )
            })}
          </div>
        </div>
        {isReviewIssue && (
          <p className="font-thai flex items-center gap-2 text-base text-[#be2c2c]">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            {campaign.meta?.reviewFeedback ??
              'Meta ตรวจสอบแล้วพบปัญหา กรุณาตรวจสอบครีเอทีฟ'}
          </p>
        )}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-2 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ยอดเข้าถึง
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.reach.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                คลิก
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.clicks.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ออเดอร์
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.orders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                CPA
              </p>
              <p className="text-2xl font-bold text-black">฿{campaign.cpa}</p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ROI
              </p>
              <p className="text-2xl font-bold text-[#519b5c]">
                {campaign.roi}x
              </p>
            </div>
          </div>
          <Sparkline
            data={campaign.dailyTrend.map((d) => ({
              label: d.date,
              value: d.reach,
            }))}
            label="ยอดเข้าถึงรายวัน"
            className="hidden h-30 w-51 shrink-0 sm:block"
          />
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-row items-center justify-between gap-4 border-t border-[#D9D9D9] p-5 lg:w-45 lg:flex-col lg:items-end lg:justify-between lg:border-t-0 lg:border-l">
        <Link
          to={`/campaign/${campaign.id}/report`}
          className="border-seadark bg-sealight-hover font-thai text-seadark-hover hover:bg-sealight-active flex items-center gap-1 rounded-[19px] border px-4 py-2 text-base font-semibold"
        >
          ดูรายงาน
          <ChevronRight className="h-4 w-4" />
        </Link>
        <div className="flex flex-row flex-wrap items-center gap-4 lg:flex-col lg:items-end">
          {campaign.source === 'api' ? (
            <>
              {campaign.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => onReviewDraft(campaign.id)}
                  className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
                >
                  <Play className="h-5 w-5" />
                  เริ่มแคมเปญ
                </button>
              )}
              {campaign.status === 'active' && (
                <button
                  type="button"
                  onClick={() => onPause(campaign.id)}
                  className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
                >
                  <Pause className="h-5 w-5" />
                  หยุดชั่วคราว
                </button>
              )}
              {campaign.status === 'paused' && (
                <button
                  type="button"
                  onClick={() => onResume(campaign.id)}
                  className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
                >
                  <Play className="h-5 w-5" />
                  เริ่มแคมเปญ
                </button>
              )}
              {(campaign.status === 'active' ||
                campaign.status === 'paused') && (
                <button
                  type="button"
                  onClick={() => onStop(campaign.id)}
                  className="font-thai flex items-center gap-2 text-base text-[#be2c2c] hover:cursor-pointer hover:font-semibold hover:text-[#a32323]"
                >
                  <Square className="h-4 w-4" />
                  หยุดแคมเปญ
                </button>
              )}
              <Link
                to={`/campaign/${campaign.id}/edit`}
                className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
              >
                <Pencil className="h-5 w-5" />
                แก้ไข
              </Link>
              <button
                type="button"
                onClick={() => onDeleteRequest(campaign.id)}
                className="font-thai flex items-center gap-2 text-base text-[#E07070] hover:cursor-pointer hover:font-semibold hover:text-[#c85050]"
              >
                <Trash2 className="h-5 w-5" />
                ลบ
              </button>
              {campaign.meta?.campaignId &&
                campaign.meta.status !== 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => onActivateRequest(campaign.id)}
                    className="font-thai flex items-center gap-2 text-base text-[#519b5c] hover:cursor-pointer hover:font-semibold hover:text-[#3f7c48]"
                  >
                    <Zap className="h-5 w-5" />
                    เปิดใช้งานบน Meta
                  </button>
                )}
            </>
          ) : (
            <>
              {campaign.status === 'active' && (
                <button className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold">
                  <Pause className="h-5 w-5" />
                  หยุดชั่วคราว
                </button>
              )}
              {campaign.status === 'paused' && (
                <button className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold">
                  <Play className="h-5 w-5" />
                  เริ่มแคมเปญ
                </button>
              )}
              <Link
                to={`/campaign/${campaign.id}/edit`}
                className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
              >
                <Pencil className="h-5 w-5" />
                แก้ไข
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Campaign() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userId] = useState(() => getUserId())
  const [email, setEmail] = useState<string | null>(null)
  const isShowcase = isShowcaseAccount(email)
  const [apiCampaigns, setApiCampaigns] = useState<CampaignItem[]>([])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activateTargetId, setActivateTargetId] = useState<string | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const isLoading = useSimulatedLoading()
  const [filterTabsRef] = useEmblaCarousel({
    axis: 'x',
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  useEffect(() => {
    if (!userId) return
    getApiAuthAccountId(userId, withCredentials()).then((res) => {
      if (res.status === 200) setEmail(res.data.email)
    })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    getApiCampaigns(withCredentials()).then((res) => {
      if (res.status !== 200) return
      const items = res.data.map(toCampaignItem)
      setApiCampaigns(items)
      items.forEach((item) => {
        fetchCampaignThumbnail(item.id).then((url) => {
          if (!url) return
          setApiCampaigns((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, thumbnail: url } : c)),
          )
        })
      })
    })
  }, [userId])

  const setCampaignStatus = async (
    id: string,
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED',
  ) => {
    const res = await patchApiCampaignsId(id, { status }, withCredentials())
    if (res.status === 200) {
      setApiCampaigns((prev) =>
        prev.map((c) => (c.id === id ? toCampaignItem(res.data) : c)),
      )
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      const res = await deleteApiCampaignsId(deleteTargetId, withCredentials())
      if (res.status === 204) {
        setApiCampaigns((prev) => prev.filter((c) => c.id !== deleteTargetId))
        setDeleteTargetId(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleActivateConfirm = async () => {
    if (!activateTargetId) return
    setIsActivating(true)
    try {
      const res = await postApiCampaignsIdMetaStatus(
        activateTargetId,
        { status: 'ACTIVE' },
        withCredentials(),
      )
      if (res.status === 200) {
        setApiCampaigns((prev) =>
          prev.map((c) =>
            c.id === activateTargetId && c.meta
              ? { ...c, meta: { ...c.meta, status: res.data.metaStatus } }
              : c,
          ),
        )
        setActivateTargetId(null)
      }
    } finally {
      setIsActivating(false)
    }
  }

  if (isLoading) return <CampaignSkeleton />

  const allCampaigns = apiCampaigns.slice().sort(compareCampaigns)
  const filterTabs = buildFilterTabs(allCampaigns)
  const activeCampaignsCount = allCampaigns.filter(
    (c) => c.status === 'active',
  ).length
  const totalCampaignsCount = allCampaigns.length
  const totalSpend = isShowcase ? SHOWCASE_TOTAL_SPEND : 0
  const totalBudget = isShowcase ? SHOWCASE_TOTAL_BUDGET : 0
  const remainingBudget = isShowcase ? SHOWCASE_REMAINING_BUDGET : 0
  const totalOrders = isShowcase ? SHOWCASE_TOTAL_ORDERS : 0
  const ordersDelta = isShowcase ? SHOWCASE_ORDERS_DELTA : 0
  const roi = isShowcase ? SHOWCASE_ROI : 0

  const filteredCampaigns = allCampaigns.filter((campaign) => {
    const matchesStatus =
      activeFilter === 'all' || campaign.status === activeFilter
    const matchesSearch = campaign.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="font-thai flex flex-col gap-2 font-semibold">
        <h1 className="text-amalfidark text-2xl font-semibold sm:text-3xl lg:text-4xl">
          แคมเปญของฉัน
        </h1>
        <p className="text-lg font-semibold text-black">
          จัดการโฆษณาทั้งหมดของคุณ — AI ดูแลการเสนอราคา จัดสรรงบ
          และเพิ่มประสิทธิภาพให้อัตโนมัติ
        </p>
      </div>

      {/** Create campaign button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/campaign/new')}
          className="bg-citrus font-thai hover:bg-citrushover w-full rounded-[19px] px-12 py-6 text-2xl font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg sm:w-auto"
        >
          <img
            src={rocket}
            alt="Rocket"
            className="mr-3 -ml-2 inline-block h-8 w-8 brightness-0"
          />
          สร้างโฆษณาใหม่
        </button>
      </div>

      {/** Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img
              src={rocket}
              alt="Campaigns"
              className="mr-2 inline-block h-9 w-9 brightness-0"
            />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              แคมเปญที่กำลังทำงาน
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            {activeCampaignsCount}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            จาก {totalCampaignsCount} แคมเปญทั้งหมด
          </p>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img src={cash} alt="Spend" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              ใช้จ่ายรวมเดือนนี้
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            ฿{totalSpend.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            งบ ฿{totalBudget.toLocaleString()} · เหลือ ฿
            {remainingBudget.toLocaleString()}
          </p>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <ShoppingCart className="text-amalfi mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              ออเดอร์รวม
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            {totalOrders.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            +{ordersDelta} จากเมื่อวาน
          </p>
        </div>
        <div className="bg-amalfi h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row justify-between p-4">
            <h2 className="font-thai text-2xl font-semibold text-white">ROI</h2>
            <img src={starcircle} alt="ROI" className="inline-block h-9 w-9" />
          </div>
          <p className="px-4 text-2xl font-bold text-white sm:text-3xl">
            {roi.toFixed(1)}x
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-white">
            ผลตอบแทนดีเยี่ยม
          </p>
        </div>
      </div>

      {/** Filter tabs + search */}
      <div
        ref={filterTabsRef}
        className="mt-8 cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <div className="flex flex-row items-center gap-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`font-thai shrink-0 rounded-[19px] px-5 py-2 text-base font-semibold transition-colors ${
                activeFilter === tab.key
                  ? 'bg-seaactive hover:bg-seadark-hover text-white'
                  : 'bg-sealight-active text-seadark-hover hover:bg-sea'
              } transition-all hover:cursor-pointer hover:shadow-md`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>
      <div className="border-seadark mt-4 flex w-full flex-row items-center justify-around gap-2 rounded-[19px] border-2 px-4 py-2">
        <Search className="text-seadark h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาแคมเปญ..."
          className="font-thai flex-1 text-lg outline-none"
        />
      </div>

      {/** Campaign list */}
      <div className="mt-8 flex flex-col gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onPause={(id) => setCampaignStatus(id, 'PAUSED')}
              onResume={(id) => setCampaignStatus(id, 'ACTIVE')}
              onStop={(id) => setCampaignStatus(id, 'COMPLETED')}
              onDeleteRequest={setDeleteTargetId}
              onReviewDraft={(id) => navigate(`/campaign/${id}/review`)}
              onActivateRequest={setActivateTargetId}
            />
          ))
        ) : (
          <p className="font-thai py-10 text-center text-lg text-black">
            ไม่พบแคมเปญที่ตรงกับตัวกรอง
          </p>
        )}
      </div>

      <div className="h-24 w-full shrink-0"></div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="ยืนยันการลบแคมเปญ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบแคมเปญนี้ การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบแคมเปญ"
        confirmDisabled={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmDialog
        open={activateTargetId !== null}
        title="ยืนยันการเปิดใช้งานบน Meta"
        message="แคมเปญนี้จะเริ่มแสดงผลจริงและใช้จ่ายงบประมาณตามที่ตั้งไว้ทันที ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="เปิดใช้งาน"
        confirmDisabled={isActivating}
        onConfirm={handleActivateConfirm}
        onCancel={() => setActivateTargetId(null)}
      />
    </div>
  )
}

export default Campaign
