import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  getApiCampaignsId,
  getApiCampaignsCampaignIdAdSetsId,
  postApiCampaignsCampaignIdAdSets,
  patchApiCampaignsCampaignIdAdSetsId,
  CreateAdSetInputOptimizationGoal,
  CreateAdSetInputBillingEvent,
} from '@/api/generated/client'
import type {
  Campaign as ApiCampaign,
  CreateAdSetInputOptimizationGoal as OptimizationGoal,
  CreateAdSetInputBillingEvent as BillingEvent,
} from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'
import { useGoBack } from '@/components/useGoBack'

const OPTIMIZATION_GOAL_LABELS: Record<string, string> = {
  LINK_CLICKS: 'คลิกลิงก์',
  REACH: 'การเข้าถึง',
  IMPRESSIONS: 'การแสดงผล',
  CONVERSIONS: 'คอนเวอร์ชัน',
  LANDING_PAGE_VIEWS: 'การเข้าชมหน้าเว็บ',
  OFFSITE_CONVERSIONS: 'คอนเวอร์ชันนอกเว็บ',
  THRUPLAY: 'การดูวิดีโอจนจบ',
  LEAD_GENERATION: 'การสร้างลูกค้าเป้าหมาย',
  APP_INSTALLS: 'การติดตั้งแอป',
}

const BILLING_EVENT_LABELS: Record<string, string> = {
  IMPRESSIONS: 'จ่ายต่อการแสดงผล',
  LINK_CLICKS: 'จ่ายต่อคลิกลิงก์',
}

type Gender = 'all' | 'male' | 'female'

function AdSetCreate() {
  const { campaignId, adSetId } = useParams()
  const isEditMode = !!adSetId
  const navigate = useNavigate()
  const goBack = useGoBack(`/campaign/${campaignId}/report`)
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [name, setName] = useState('')
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>(
    CreateAdSetInputOptimizationGoal.LINK_CLICKS,
  )
  const [billingEvent, setBillingEvent] = useState<BillingEvent>(
    CreateAdSetInputBillingEvent.IMPRESSIONS,
  )
  const [useAdvantage, setUseAdvantage] = useState(true)
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(65)
  const [gender, setGender] = useState<Gender>('all')
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily')
  const [budgetTHB, setBudgetTHB] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) return
    Promise.all([
      getApiCampaignsId(campaignId, withCredentials()),
      isEditMode
        ? getApiCampaignsCampaignIdAdSetsId(
            campaignId,
            adSetId,
            withCredentials(),
          )
        : null,
    ]).then(([campaignRes, adSetRes]) => {
      if (campaignRes.status === 200) setCampaign(campaignRes.data)
      if (adSetRes && adSetRes.status === 200) {
        const adSet = adSetRes.data
        setName(adSet.name)
        setOptimizationGoal(adSet.optimizationGoal as OptimizationGoal)
        setBillingEvent(adSet.billingEvent as BillingEvent)

        const automation = adSet.targeting?.targeting_automation as
          | { advantage_audience?: number }
          | undefined
        const advantage = !!automation?.advantage_audience
        setUseAdvantage(advantage)
        if (!advantage) {
          const ageMinVal = adSet.targeting?.age_min as number | undefined
          const ageMaxVal = adSet.targeting?.age_max as number | undefined
          const genders = adSet.targeting?.genders as number[] | undefined
          if (ageMinVal) setAgeMin(ageMinVal)
          if (ageMaxVal) setAgeMax(ageMaxVal)
          if (genders?.includes(1) && !genders.includes(2)) {
            setGender('male')
          } else if (genders?.includes(2) && !genders.includes(1)) {
            setGender('female')
          } else {
            setGender('all')
          }
        }

        if (adSet.dailyBudget !== null) {
          setBudgetType('daily')
          setBudgetTHB(String(adSet.dailyBudget / 100))
        } else if (adSet.lifetimeBudget !== null) {
          setBudgetType('lifetime')
          setBudgetTHB(String(adSet.lifetimeBudget / 100))
        }
      }
      setIsLoading(false)
    })
  }, [campaignId, adSetId, isEditMode])

  if (isLoading) {
    return (
      <div className="flex min-h-full min-w-full items-center justify-center py-10">
        <p className="font-thai text-xl text-black">กำลังโหลด...</p>
      </div>
    )
  }

  if (!campaignId || !campaign) {
    return (
      <div className="flex min-h-full min-w-full flex-col items-center justify-center gap-4 py-10">
        <p className="font-thai text-xl text-black">ไม่พบแคมเปญนี้</p>
        <Link to="/campaign" className="font-thai text-amalfi underline">
          กลับไปหน้าแคมเปญ
        </Link>
      </div>
    )
  }

  const needsOwnBudget = !campaign.campaignBudgetOptimization

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const genderCodes: number[] | undefined =
        gender === 'male' ? [1] : gender === 'female' ? [2] : undefined

      const payload = {
        name,
        optimizationGoal,
        billingEvent,
        targeting: useAdvantage
          ? { targeting_automation: { advantage_audience: 1 as const } }
          : {
              age_min: ageMin,
              age_max: ageMax,
              ...(genderCodes && { genders: genderCodes }),
              geo_locations: { countries: ['TH'] },
            },
        advantagePlacements: true,
        ...(needsOwnBudget &&
          budgetTHB && {
            ...(budgetType === 'daily'
              ? { dailyBudget: Math.round(Number(budgetTHB) * 100) }
              : { lifetimeBudget: Math.round(Number(budgetTHB) * 100) }),
          }),
      }

      if (isEditMode) {
        const res = await patchApiCampaignsCampaignIdAdSetsId(
          campaignId,
          adSetId,
          payload,
          withCredentials(),
        )
        if (res.status === 200) {
          navigate(`/campaign/${campaignId}/report`)
        } else {
          setError(res.data.message)
        }
        return
      }

      const res = await postApiCampaignsCampaignIdAdSets(
        campaignId,
        payload,
        withCredentials(),
      )
      if (res.status === 201) {
        navigate(`/campaign/${campaignId}/adset/${res.data.id}/creative/new`)
      } else {
        setError(res.data.message)
      }
    } catch {
      setError(
        isEditMode
          ? 'บันทึก Ad Set ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
          : 'สร้าง Ad Set ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full min-w-full py-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={goBack}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <div>
          <h1 className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            {isEditMode ? 'แก้ไข Ad Set' : 'สร้าง Ad Set ใหม่'}
          </h1>
          <p className="font-thai text-lg text-black">
            สำหรับแคมเปญ &quot;{campaign.name}&quot;
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex max-w-2xl flex-col gap-5"
      >
        <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <label className="font-thai block text-lg font-bold text-black">
            ชื่อ Ad Set
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
          />

          <label className="font-thai mt-4 block text-lg font-bold text-black">
            เป้าหมายการเพิ่มประสิทธิภาพ
          </label>
          <select
            value={optimizationGoal}
            onChange={(e) =>
              setOptimizationGoal(e.target.value as OptimizationGoal)
            }
            className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
          >
            {Object.values(CreateAdSetInputOptimizationGoal).map((value) => (
              <option key={value} value={value}>
                {OPTIMIZATION_GOAL_LABELS[value] ?? value}
              </option>
            ))}
          </select>

          <label className="font-thai mt-4 block text-lg font-bold text-black">
            รูปแบบการเรียกเก็บเงิน
          </label>
          <select
            value={billingEvent}
            onChange={(e) => setBillingEvent(e.target.value as BillingEvent)}
            className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
          >
            {Object.values(CreateAdSetInputBillingEvent).map((value) => (
              <option key={value} value={value}>
                {BILLING_EVENT_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            กลุ่มเป้าหมาย
          </h3>
          <label className="font-thai mt-3 flex items-center gap-2 text-lg text-black">
            <input
              type="checkbox"
              checked={useAdvantage}
              onChange={(e) => setUseAdvantage(e.target.checked)}
              className="h-5 w-5"
            />
            ใช้กลุ่มเป้าหมายอัตโนมัติของ Meta (Advantage+)
          </label>
          <p className="font-thai mt-1 text-base text-[#8E98A8]">
            แนะนำสำหรับร้านที่ยังไม่มีข้อมูลกลุ่มเป้าหมายเดิม — Meta
            จะหากลุ่มเป้าหมายที่เหมาะสมให้อัตโนมัติ
          </p>

          {!useAdvantage && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="font-thai block text-base font-bold text-black">
                    อายุต่ำสุด
                  </label>
                  <input
                    type="number"
                    min={13}
                    max={65}
                    value={ageMin}
                    onChange={(e) => setAgeMin(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-thai block text-base font-bold text-black">
                    อายุสูงสุด
                  </label>
                  <input
                    type="number"
                    min={13}
                    max={65}
                    value={ageMax}
                    onChange={(e) => setAgeMax(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-thai block text-base font-bold text-black">
                  เพศ
                </label>
                <div className="font-thai mt-1 flex gap-4 text-lg text-black">
                  {(['all', 'male', 'female'] as Gender[]).map((g) => (
                    <label key={g} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                      />
                      {g === 'all' ? 'ทั้งหมด' : g === 'male' ? 'ชาย' : 'หญิง'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-thai block text-base font-bold text-black">
                  ประเทศ
                </label>
                <input
                  type="text"
                  disabled
                  value="ประเทศไทย"
                  className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] bg-[rgba(142,152,168,0.1)] px-3 py-2 text-lg text-black outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            งบประมาณ
          </h3>
          {needsOwnBudget ? (
            <>
              <p className="font-thai mt-1 text-base text-black">
                แคมเปญนี้จัดการงบประมาณแยกตาม Ad Set — กรุณาตั้งงบสำหรับ Ad Set
                นี้
              </p>
              <div className="font-thai mt-3 flex gap-4 text-lg text-black">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="budgetType"
                    checked={budgetType === 'daily'}
                    onChange={() => setBudgetType('daily')}
                  />
                  งบต่อวัน
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="budgetType"
                    checked={budgetType === 'lifetime'}
                    onChange={() => setBudgetType('lifetime')}
                  />
                  งบตลอดแคมเปญ
                </label>
              </div>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={budgetTHB}
                onChange={(e) => setBudgetTHB(e.target.value)}
                placeholder="จำนวนเงิน (บาท)"
                className="mt-2 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
            </>
          ) : (
            <p className="font-thai mt-1 text-base text-black">
              งบประมาณถูกจัดการที่ระดับแคมเปญแล้ว
            </p>
          )}
        </div>

        {error && <p className="font-thai text-base text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-citrus hover:bg-citrushover font-thai text-amalfidark flex-1 rounded-xl px-6 py-4 text-2xl font-bold shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:scale-105 hover:cursor-pointer disabled:opacity-50"
          >
            {isSaving
              ? 'กำลังบันทึก...'
              : isEditMode
                ? 'บันทึกการเปลี่ยนแปลง'
                : 'สร้าง Ad Set'}
          </button>
          {!isEditMode && (
            <button
              type="button"
              onClick={() => navigate(`/campaign/${campaignId}/report`)}
              className="font-thai bg-sealight-hover border-seadark text-seadark hover:bg-sealight-active hover:text-seadark-active rounded-xl border-[1.5px] px-6 py-3 text-lg font-semibold hover:scale-105 hover:cursor-pointer"
            >
              ข้ามไปตอนนี้
            </button>
          )}
        </div>
      </form>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default AdSetCreate
