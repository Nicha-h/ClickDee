import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  getApiCampaignsCampaignIdAdSetsAdSetIdCreatives,
  getApiCampaignsCampaignIdAdSetsAdSetIdAdsId,
  postApiCampaignsCampaignIdAdSetsAdSetIdAds,
  patchApiCampaignsCampaignIdAdSetsAdSetIdAdsId,
} from '@/api/generated/client'
import type { AdCreative } from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'
import { useGoBack } from '@/components/useGoBack'

function AdCreate() {
  const { campaignId, adSetId, adId } = useParams()
  const isEditMode = !!adId
  const navigate = useNavigate()
  const goBack = useGoBack(`/campaign/${campaignId}/report`)
  const location = useLocation()
  const preselectedCreativeId = (
    location.state as { creativeId?: string } | null
  )?.creativeId

  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [creativeId, setCreativeId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId || !adSetId) return
    Promise.all([
      getApiCampaignsCampaignIdAdSetsAdSetIdCreatives(
        campaignId,
        adSetId,
        withCredentials(),
      ),
      isEditMode
        ? getApiCampaignsCampaignIdAdSetsAdSetIdAdsId(
            campaignId,
            adSetId,
            adId,
            withCredentials(),
          )
        : null,
    ]).then(([creativesRes, adRes]) => {
      if (creativesRes.status === 200) {
        setCreatives(creativesRes.data)
        if (adRes && adRes.status === 200) {
          setName(adRes.data.name)
          setCreativeId(adRes.data.creativeId)
          setIsPublished(!!adRes.data.metaAdId)
        } else {
          setCreativeId(preselectedCreativeId ?? creativesRes.data[0]?.id ?? '')
        }
      }
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, adSetId, adId, isEditMode])

  if (!campaignId || !adSetId) {
    return (
      <div className="flex min-h-full min-w-full items-center justify-center py-10">
        <p className="font-thai text-xl text-black">ไม่พบ Ad Set นี้</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full min-w-full items-center justify-center py-10">
        <p className="font-thai text-xl text-black">กำลังโหลด...</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      if (isEditMode) {
        const res = await patchApiCampaignsCampaignIdAdSetsAdSetIdAdsId(
          campaignId,
          adSetId,
          adId,
          { name, creativeId },
          withCredentials(),
        )
        if (res.status === 200) {
          navigate(`/campaign/${campaignId}/report`)
        } else {
          setError(res.data.message)
        }
        return
      }

      const res = await postApiCampaignsCampaignIdAdSetsAdSetIdAds(
        campaignId,
        adSetId,
        { name, creativeId },
        withCredentials(),
      )
      if (res.status === 201) {
        navigate(`/campaign/${campaignId}/report`)
      } else {
        setError(res.data.message)
      }
    } catch {
      setError(
        isEditMode
          ? 'บันทึกโฆษณาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
          : 'สร้างโฆษณาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
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
        <h1 className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
          {isEditMode ? 'แก้ไขโฆษณา' : 'สร้างโฆษณาใหม่'}
        </h1>
      </div>

      {isEditMode && isPublished && (
        <p className="font-thai mt-4 max-w-2xl rounded-lg bg-[rgba(254,215,23,0.25)] px-4 py-2 text-base text-black">
          โฆษณานี้เผยแพร่บน Meta แล้ว — การเปลี่ยนครีเอทีฟจะอัปเดตโฆษณาที่ใช้งานอยู่บน
          Meta ด้วย
        </p>
      )}

      {creatives.length === 0 ? (
        <div className="mt-6 max-w-2xl rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <p className="font-thai text-lg text-black">
            Ad Set นี้ยังไม่มีครีเอทีฟ — กรุณาสร้างครีเอทีฟก่อนสร้างโฆษณา
          </p>
          <button
            type="button"
            onClick={() =>
              navigate(`/campaign/${campaignId}/adset/${adSetId}/creative/new`)
            }
            className="bg-citrus hover:bg-citrushover font-thai text-amalfidark mt-4 rounded-xl px-6 py-3 text-lg font-bold hover:scale-105 hover:cursor-pointer"
          >
            สร้างครีเอทีฟ
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex max-w-2xl flex-col gap-5"
        >
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <label className="font-thai block text-lg font-bold text-black">
              ชื่อโฆษณา
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            />

            <label className="font-thai mt-4 block text-lg font-bold text-black">
              ครีเอทีฟ
            </label>
            <select
              value={creativeId}
              onChange={(e) => setCreativeId(e.target.value)}
              className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            >
              {creatives.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.format})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="font-thai text-base text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-citrus hover:bg-citrushover font-thai text-amalfidark rounded-xl px-6 py-4 text-2xl font-bold shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:scale-105 hover:cursor-pointer disabled:opacity-50"
          >
            {isSaving
              ? 'กำลังบันทึก...'
              : isEditMode
                ? 'บันทึกการเปลี่ยนแปลง'
                : 'สร้างโฆษณา'}
          </button>
        </form>
      )}
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default AdCreate
