import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Sparkles,
  Plus,
  X,
  Image as ImageIcon,
  Video,
} from 'lucide-react'
import MediaUploadField from '@/components/mediaUploadField'
import {
  postApiCampaignsCampaignIdAdSetsAdSetIdCreatives,
  getApiCampaignsCampaignIdAdSetsAdSetIdCreativesId,
  patchApiCampaignsCampaignIdAdSetsAdSetIdCreativesId,
  postApiAiCampaignsIdCreative,
  CreateImagePostCreativeInputFormat,
  CreateVideoPostCreativeInputFormat,
  CreateReelsCreativeInputFormat,
  CreateCarouselCreativeInputFormat,
  CreateStoryCreativeInputFormat,
  CreateImagePostCreativeInputCallToActionType,
  CreateStoryCreativeInputMediaType,
} from '@/api/generated/client'
import type { CreateAdCreativeInput } from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'
import ContentWarnings from '@/components/contentWarnings'
import { useGoBack } from '@/components/useGoBack'
import { CTA_LABELS } from '@/lib/adCreativeLabels'
import { resolveAssetUrl } from '@/lib/assetUrl'
import { aiErrorMessage } from '@/lib/aiError'
import { useToast } from '@/lib/toastContext'

type Format =
  | typeof CreateImagePostCreativeInputFormat.IMAGE_POST
  | typeof CreateVideoPostCreativeInputFormat.VIDEO_POST
  | typeof CreateReelsCreativeInputFormat.REELS
  | typeof CreateCarouselCreativeInputFormat.CAROUSEL
  | typeof CreateStoryCreativeInputFormat.STORY

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: 'IMAGE_POST', label: 'รูปภาพ' },
  { value: 'VIDEO_POST', label: 'วิดีโอ' },
  { value: 'REELS', label: 'Reels' },
  { value: 'CAROUSEL', label: 'การ์ดหมุน (Carousel)' },
  { value: 'STORY', label: 'สตอรี่' },
]

type CarouselCard = {
  mediaAssetId: string | null
  mediaAssetUrl: string | null
  link: string
  name: string
  description: string
}

function emptyCard(): CarouselCard {
  return {
    mediaAssetId: null,
    mediaAssetUrl: null,
    link: '',
    name: '',
    description: '',
  }
}

type PrimaryMedia = { url: string | null; hasMedia: boolean; isVideo: boolean }

function MediaThumb({
  media,
  className,
}: {
  media: PrimaryMedia
  className: string
}) {
  if (media.url) {
    return (
      <img src={media.url} alt="" className={`object-cover ${className}`} />
    )
  }
  if (media.hasMedia && media.isVideo) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-[#F1F3F5] ${className}`}
      >
        <Video className="h-8 w-8 text-[#8E98A8]" />
        <p className="font-thai text-sm text-[#8E98A8]">วิดีโอพร้อมแล้ว</p>
      </div>
    )
  }
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-[#F1F3F5] ${className}`}
    >
      <ImageIcon className="h-8 w-8 text-[#8E98A8]" />
      <p className="font-thai text-sm text-[#8E98A8]">ยังไม่มีการอัปโหลดสื่อ</p>
    </div>
  )
}

type CreativeDetailsResponse = {
  mediaAssetId?: string
  mediaAssetUrl?: string
  link?: string
  message?: string
  callToActionType?: string
  title?: string
  ctaLink?: string
  thumbnailUrl?: string
  mediaType?: 'IMAGE' | 'VIDEO'
  childAttachments?: {
    mediaAssetId?: string
    mediaAssetUrl?: string
    link?: string
    name?: string
    description?: string
  }[]
}

function AdCreativeCreate() {
  const { campaignId, adSetId, creativeId } = useParams()
  const isEditMode = !!creativeId
  const navigate = useNavigate()
  const goBack = useGoBack(`/campaign/${campaignId}/report`)

  const [format, setFormat] = useState<Format>('IMAGE_POST')
  const [name, setName] = useState('')
  const [pageId, setPageId] = useState('')
  const [instagramUserId, setInstagramUserId] = useState('')
  const [message, setMessage] = useState('')
  const [callToActionType, setCallToActionType] = useState<string>(
    CreateImagePostCreativeInputCallToActionType.SHOP_NOW,
  )
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null)
  const [mediaAssetUrl, setMediaAssetUrl] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [title, setTitle] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [storyMediaType, setStoryMediaType] = useState<'IMAGE' | 'VIDEO'>(
    'IMAGE',
  )
  const [carouselCards, setCarouselCards] = useState<CarouselCard[]>([
    emptyCard(),
    emptyCard(),
  ])

  const [showPreview, setShowPreview] = useState(false)

  const [isSuggesting, setIsSuggesting] = useState(false)
  const { showToast } = useToast()
  // Non-blocking warnings the backend's content screen attached to the
  // AI-suggested caption; cleared as soon as the user edits the text.
  const [captionWarnings, setCaptionWarnings] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId || !adSetId || !creativeId) return
    getApiCampaignsCampaignIdAdSetsAdSetIdCreativesId(
      campaignId,
      adSetId,
      creativeId,
      withCredentials(),
    ).then((res) => {
      if (res.status === 200) {
        const creative = res.data
        const details = creative.creativeDetails as CreativeDetailsResponse
        setFormat(creative.format)
        setName(creative.name)
        setPageId(creative.pageId)
        setInstagramUserId(creative.instagramUserId ?? '')
        setIsPublished(!!creative.metaCreativeId)
        if (details.message !== undefined) setMessage(details.message)
        if (details.callToActionType !== undefined) {
          setCallToActionType(details.callToActionType)
        }
        if (details.mediaAssetId !== undefined) {
          setMediaAssetId(details.mediaAssetId)
        }
        if (details.mediaAssetUrl !== undefined) {
          setMediaAssetUrl(resolveAssetUrl(details.mediaAssetUrl) ?? null)
        }
        if (details.link !== undefined) setLink(details.link)
        if (details.ctaLink !== undefined) setCtaLink(details.ctaLink)
        if (details.title !== undefined) setTitle(details.title)
        if (details.thumbnailUrl !== undefined) {
          setThumbnailUrl(details.thumbnailUrl)
        }
        if (details.mediaType !== undefined)
          setStoryMediaType(details.mediaType)
        if (details.childAttachments) {
          setCarouselCards(
            details.childAttachments.map((c) => ({
              mediaAssetId: c.mediaAssetId ?? null,
              mediaAssetUrl: resolveAssetUrl(c.mediaAssetUrl) ?? null,
              link: c.link ?? '',
              name: c.name ?? '',
              description: c.description ?? '',
            })),
          )
        }
      }
      setIsLoading(false)
    })
  }, [campaignId, adSetId, creativeId])

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

  const suggestCaption = async () => {
    setIsSuggesting(true)
    try {
      const res = await postApiAiCampaignsIdCreative(
        campaignId,
        { prompt: message || name || 'สร้างแคปชั่นโฆษณาที่น่าสนใจ' },
        withCredentials(),
      )
      if (res.status === 200) {
        setMessage(res.data.caption)
        setCaptionWarnings(res.data.contentWarnings)
      } else {
        showToast(aiErrorMessage(res.status), 'error')
      }
    } catch {
      showToast(aiErrorMessage(0), 'error')
    } finally {
      setIsSuggesting(false)
    }
  }

  const updateCard = (index: number, patch: Partial<CarouselCard>) => {
    setCarouselCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    )
  }

  const addCard = () => {
    setCarouselCards((prev) =>
      prev.length < 10 ? [...prev, emptyCard()] : prev,
    )
  }

  const removeCard = (index: number) => {
    setCarouselCards((prev) =>
      prev.length > 2 ? prev.filter((_, i) => i !== index) : prev,
    )
  }

  const buildPayload = (): CreateAdCreativeInput | null => {
    const base = { name, pageId, instagramUserId: instagramUserId || undefined }
    switch (format) {
      case 'IMAGE_POST':
        if (!mediaAssetId || !link || !message) return null
        return {
          ...base,
          format: 'IMAGE_POST',
          mediaAssetId,
          link,
          message,
          callToActionType: callToActionType as never,
        }
      case 'VIDEO_POST':
        if (!mediaAssetId || !ctaLink || !message) return null
        return {
          ...base,
          format: 'VIDEO_POST',
          mediaAssetId,
          title: title || undefined,
          message,
          callToActionType: callToActionType as never,
          ctaLink,
          thumbnailUrl: thumbnailUrl || undefined,
        }
      case 'REELS':
        if (!mediaAssetId || !ctaLink || !message) return null
        return {
          ...base,
          format: 'REELS',
          mediaAssetId,
          title: title || undefined,
          message,
          callToActionType: callToActionType as never,
          ctaLink,
          thumbnailUrl: thumbnailUrl || undefined,
        }
      case 'CAROUSEL':
        if (carouselCards.some((c) => !c.mediaAssetId || !c.link || !c.name)) {
          return null
        }
        return {
          ...base,
          format: 'CAROUSEL',
          childAttachments: carouselCards.map((c) => ({
            mediaAssetId: c.mediaAssetId!,
            link: c.link,
            name: c.name,
            description: c.description || undefined,
          })),
          message: message || undefined,
          callToActionType: callToActionType as never,
        }
      case 'STORY':
        if (!mediaAssetId) return null
        return {
          ...base,
          format: 'STORY',
          mediaType: storyMediaType,
          mediaAssetId,
          link: link || undefined,
          message: message || undefined,
          callToActionType: (callToActionType as never) || undefined,
          ctaLink: ctaLink || undefined,
        }
    }
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const payload = buildPayload()
    if (!payload) {
      setError('กรุณากรอกข้อมูลและอัปโหลดสื่อให้ครบตามรูปแบบที่เลือก')
      return
    }
    setIsSaving(true)
    try {
      if (isEditMode) {
        const res = await patchApiCampaignsCampaignIdAdSetsAdSetIdCreativesId(
          campaignId,
          adSetId,
          creativeId,
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

      const res = await postApiCampaignsCampaignIdAdSetsAdSetIdCreatives(
        campaignId,
        adSetId,
        payload,
        withCredentials(),
      )
      if (res.status === 201) {
        navigate(`/campaign/${campaignId}/adset/${adSetId}/ad/new`, {
          state: { creativeId: res.data.id },
        })
      } else {
        setError(res.data.message)
      }
    } catch {
      setError(
        isEditMode
          ? 'บันทึกครีเอทีฟไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
          : 'สร้างครีเอทีฟไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const getPrimaryMedia = (): PrimaryMedia => {
    switch (format) {
      case 'IMAGE_POST':
        return { url: mediaAssetUrl, hasMedia: !!mediaAssetId, isVideo: false }
      case 'VIDEO_POST':
      case 'REELS':
        return {
          url: thumbnailUrl || null,
          hasMedia: !!mediaAssetId,
          isVideo: true,
        }
      case 'CAROUSEL':
        return {
          url: carouselCards[0]?.mediaAssetUrl ?? null,
          hasMedia: !!carouselCards[0]?.mediaAssetId,
          isVideo: false,
        }
      case 'STORY':
        return storyMediaType === 'IMAGE'
          ? { url: mediaAssetUrl, hasMedia: !!mediaAssetId, isVideo: false }
          : {
              url: thumbnailUrl || null,
              hasMedia: !!mediaAssetId,
              isVideo: true,
            }
    }
  }

  const primaryMedia = getPrimaryMedia()
  const firstCard = format === 'CAROUSEL' ? carouselCards[0] : null
  const ctaLabel = CTA_LABELS[callToActionType] ?? callToActionType

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
          {isEditMode ? 'แก้ไขครีเอทีฟ' : 'สร้างครีเอทีฟใหม่'}
        </h1>
      </div>

      {isEditMode && isPublished && (
        <p className="font-thai mt-4 max-w-2xl rounded-lg bg-[rgba(254,215,23,0.25)] px-4 py-2 text-base text-black">
          ครีเอทีฟนี้เผยแพร่บน Meta แล้ว — การบันทึกจะส่งครีเอทีฟใหม่ไปแทนที่
          และย้ายโฆษณาที่ใช้งานอยู่ไปยังครีเอทีฟใหม่โดยอัตโนมัติ
        </p>
      )}

      <div className="mt-6 flex items-start gap-8">
        <form
          onSubmit={handleSubmit}
          className="flex max-w-2xl flex-1 flex-col gap-5"
        >
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <label className="font-thai block text-lg font-bold text-black">
              รูปแบบโฆษณา
            </label>
            {isEditMode ? (
              <p className="font-thai mt-2 text-base text-black">
                {FORMAT_OPTIONS.find((opt) => opt.value === format)?.label ??
                  format}{' '}
                <span className="text-[#8E98A8]">(เปลี่ยนรูปแบบไม่ได้)</span>
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormat(opt.value)}
                    className={`font-thai rounded-full px-4 py-2 text-base font-semibold hover:cursor-pointer ${
                      format === opt.value
                        ? 'bg-seaactive text-white'
                        : 'bg-sealight-active text-seadark-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <label className="font-thai block text-lg font-bold text-black">
              ชื่อครีเอทีฟ
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            />

            <label className="font-thai mt-4 block text-lg font-bold text-black">
              Facebook Page ID
            </label>
            <input
              type="text"
              required
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="ระบุ Page ID ของเพจ Facebook"
              className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            />
            <p className="font-thai mt-1 text-base text-[#8E98A8]">
              ยังไม่มีระบบเชื่อมต่อบัญชี Meta อัตโนมัติ — กรอก Page ID
              ด้วยตนเองไปก่อน
            </p>

            <label className="font-thai mt-4 block text-lg font-bold text-black">
              Instagram User ID (ถ้ามี)
            </label>
            <input
              type="text"
              value={instagramUserId}
              onChange={(e) => setInstagramUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            />

            <div className="mt-4 flex items-center justify-between">
              <label className="font-thai block text-lg font-bold text-black">
                แคปชั่น
              </label>
              <button
                type="button"
                disabled={isSuggesting}
                onClick={suggestCaption}
                className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-base hover:cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {isSuggesting ? 'กำลังคิด...' : 'ให้ AI ช่วยเขียน'}
              </button>
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setCaptionWarnings([])
              }}
              className="mt-1 w-full resize-y rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            />
            <ContentWarnings warnings={captionWarnings} className="mt-2" />

            <label className="font-thai mt-4 block text-lg font-bold text-black">
              ปุ่มกระตุ้นการกระทำ (CTA)
            </label>
            <select
              value={callToActionType}
              onChange={(e) => setCallToActionType(e.target.value)}
              className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
            >
              {Object.keys(CTA_LABELS).map((value) => (
                <option key={value} value={value}>
                  {CTA_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {format === 'IMAGE_POST' && (
            <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
              <MediaUploadField
                type="IMAGE"
                label="รูปภาพ"
                onUploaded={(id, previewUrl) => {
                  setMediaAssetId(id)
                  setMediaAssetUrl(resolveAssetUrl(previewUrl) ?? null)
                }}
                existingPreviewUrl={mediaAssetUrl ?? undefined}
              />
              <label className="font-thai mt-4 block text-lg font-bold text-black">
                ลิงก์ปลายทาง
              </label>
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
            </div>
          )}

          {(format === 'VIDEO_POST' || format === 'REELS') && (
            <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
              <MediaUploadField
                type="VIDEO"
                label="วิดีโอ"
                onUploaded={(id, previewUrl) => {
                  setMediaAssetId(id)
                  setMediaAssetUrl(resolveAssetUrl(previewUrl) ?? null)
                }}
                existingLabel={mediaAssetId ? 'วิดีโอปัจจุบัน' : undefined}
              />
              <label className="font-thai mt-4 block text-lg font-bold text-black">
                หัวข้อ (ถ้ามี)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
              <label className="font-thai mt-4 block text-lg font-bold text-black">
                ลิงก์ปลายทาง (CTA)
              </label>
              <input
                type="url"
                required
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
              <label className="font-thai mt-4 block text-lg font-bold text-black">
                รูปปกวิดีโอ (URL, ถ้ามี)
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
            </div>
          )}

          {format === 'CAROUSEL' && (
            <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <h3 className="font-thai text-amalfidark text-xl font-bold">
                  การ์ด ({carouselCards.length}/10)
                </h3>
                <button
                  type="button"
                  onClick={addCard}
                  disabled={carouselCards.length >= 10}
                  className="font-thai text-seadark hover:text-seadark-active flex items-center gap-1 text-base hover:cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มการ์ด
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-4">
                {carouselCards.map((card, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border border-[#8E98A8] p-3"
                  >
                    {carouselCards.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCard(i)}
                        className="absolute top-2 right-2 text-[#8E98A8] hover:cursor-pointer hover:text-[#6B7280]"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    <MediaUploadField
                      type="IMAGE"
                      label={`รูปการ์ด #${i + 1}`}
                      onUploaded={(id, previewUrl) =>
                        updateCard(i, {
                          mediaAssetId: id,
                          mediaAssetUrl: resolveAssetUrl(previewUrl) ?? null,
                        })
                      }
                      existingPreviewUrl={card.mediaAssetUrl ?? undefined}
                    />
                    <label className="font-thai mt-3 block text-base font-bold text-black">
                      ชื่อการ์ด
                    </label>
                    <input
                      type="text"
                      required
                      value={card.name}
                      onChange={(e) => updateCard(i, { name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
                    />
                    <label className="font-thai mt-3 block text-base font-bold text-black">
                      ลิงก์ปลายทาง
                    </label>
                    <input
                      type="url"
                      required
                      value={card.link}
                      onChange={(e) => updateCard(i, { link: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
                    />
                    <label className="font-thai mt-3 block text-base font-bold text-black">
                      คำอธิบาย (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={card.description}
                      onChange={(e) =>
                        updateCard(i, { description: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {format === 'STORY' && (
            <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
              <label className="font-thai block text-lg font-bold text-black">
                ประเภทสื่อ
              </label>
              <div className="font-thai mt-1 flex gap-4 text-lg text-black">
                {(
                  [
                    CreateStoryCreativeInputMediaType.IMAGE,
                    CreateStoryCreativeInputMediaType.VIDEO,
                  ] as const
                ).map((t) => (
                  <label key={t} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="storyMediaType"
                      checked={storyMediaType === t}
                      onChange={() => setStoryMediaType(t)}
                    />
                    {t === 'IMAGE' ? 'รูปภาพ' : 'วิดีโอ'}
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <MediaUploadField
                  type={storyMediaType}
                  label={storyMediaType === 'IMAGE' ? 'รูปภาพ' : 'วิดีโอ'}
                  onUploaded={(id, previewUrl) => {
                    setMediaAssetId(id)
                    setMediaAssetUrl(resolveAssetUrl(previewUrl) ?? null)
                  }}
                  existingPreviewUrl={
                    storyMediaType === 'IMAGE'
                      ? (mediaAssetUrl ?? undefined)
                      : undefined
                  }
                  existingLabel={
                    storyMediaType === 'VIDEO' && mediaAssetId
                      ? 'วิดีโอปัจจุบัน'
                      : undefined
                  }
                />
              </div>
              <label className="font-thai mt-4 block text-lg font-bold text-black">
                ลิงก์ปลายทาง (ถ้ามี)
              </label>
              <input
                type="url"
                value={ctaLink || link}
                onChange={(e) => {
                  setLink(e.target.value)
                  setCtaLink(e.target.value)
                }}
                className="mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-lg text-black outline-none"
              />
            </div>
          )}

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
                : 'สร้างครีเอทีฟ'}
          </button>
        </form>

        <aside className="sticky top-10 flex w-96 shrink-0 flex-col gap-4">
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-lg font-bold text-black">
              สื่อโฆษณา
            </h3>
            <MediaThumb
              media={primaryMedia}
              className="mt-2 h-56 w-full rounded-lg"
            />
            {format === 'CAROUSEL' && carouselCards.length > 1 && (
              <p className="font-thai mt-2 text-base text-[#8E98A8]">
                +{carouselCards.length - 1} การ์ดเพิ่มเติม
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="font-thai border-amalfidark text-amalfidark rounded-xl border-2 px-4 py-3 text-lg font-bold hover:cursor-pointer hover:bg-black/5"
          >
            {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่างโฆษณา'}
          </button>

          {showPreview && (
            <div className="overflow-hidden rounded-xl border border-black/20 bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-2 p-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#8E98A8]/30" />
                <div>
                  <p className="font-thai text-sm font-bold text-black">
                    {pageId || 'เพจของคุณ'}
                  </p>
                  <p className="font-thai text-xs text-[#8E98A8]">
                    โฆษณา · Sponsored
                  </p>
                </div>
              </div>
              {message && (
                <p className="font-thai px-3 pb-2 text-sm text-black">
                  {message}
                </p>
              )}
              <MediaThumb
                media={primaryMedia}
                className="aspect-square w-full"
              />
              {format === 'CAROUSEL' &&
                firstCard &&
                (firstCard.name || firstCard.description) && (
                  <div className="border-t border-black/10 p-3">
                    {firstCard.name && (
                      <p className="font-thai text-sm font-bold text-black">
                        {firstCard.name}
                      </p>
                    )}
                    {firstCard.description && (
                      <p className="font-thai text-sm text-[#8E98A8]">
                        {firstCard.description}
                      </p>
                    )}
                    <p className="font-thai mt-1 text-xs text-[#8E98A8]">
                      (ตัวอย่างการ์ดแรก)
                    </p>
                  </div>
                )}
              <div className="p-3">
                <button
                  type="button"
                  disabled
                  className="font-thai bg-citrus text-amalfidark w-full rounded-lg px-4 py-2 text-base font-bold"
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default AdCreativeCreate
