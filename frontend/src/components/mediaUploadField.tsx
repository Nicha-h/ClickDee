import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { apiBaseUrl } from '@/api/env'
import { withCredentials } from '@/lib/userId'

// The backend's media upload/poll routes (routes/media.ts) are deliberately
// plain (non-openapi) Hono routes — multipart/File typing in
// @hono/zod-openapi adds complexity this upload path doesn't need — so they
// don't appear in the generated client at all. Calling them means a manual
// fetch here instead of a generated function.

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading' }
  | { phase: 'processing' }
  | { phase: 'ready'; fileName: string }
  | { phase: 'error'; message: string }

const POLL_INTERVAL_MS = 3_000
const MAX_POLL_ATTEMPTS = 20

interface MediaAssetResponse {
  id: string
  status: 'PENDING' | 'READY' | 'FAILED'
  previewUrl: string | null
}

async function parseErrorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => null)
  return typeof body?.message === 'string' ? body.message : fallback
}

function MediaUploadField({
  type,
  label,
  onUploaded,
  existingPreviewUrl,
  existingLabel,
}: {
  type: 'IMAGE' | 'VIDEO'
  label?: string
  onUploaded: (mediaAssetId: string, previewUrl: string | null) => void
  /** Shown (in edit mode) until the user picks a replacement file. */
  existingPreviewUrl?: string
  existingLabel?: string
}) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const pollAttempts = useRef(0)

  const pollVideoStatus = (mediaAssetId: string) => {
    pollAttempts.current = 0
    const interval = setInterval(async () => {
      pollAttempts.current += 1
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/media/${mediaAssetId}/poll`,
          { method: 'POST', ...withCredentials() },
        )
        if (!res.ok) {
          throw new Error(
            await parseErrorMessage(res, 'ตรวจสอบสถานะวิดีโอไม่สำเร็จ'),
          )
        }
        const asset = (await res.json()) as MediaAssetResponse
        if (asset.status === 'READY') {
          clearInterval(interval)
          setState({ phase: 'ready', fileName: '' })
          onUploaded(mediaAssetId, asset.previewUrl)
        } else if (
          asset.status === 'FAILED' ||
          pollAttempts.current >= MAX_POLL_ATTEMPTS
        ) {
          clearInterval(interval)
          setState({
            phase: 'error',
            message: 'ประมวลผลวิดีโอไม่สำเร็จ กรุณาลองอัปโหลดใหม่',
          })
        }
      } catch (err) {
        clearInterval(interval)
        setState({
          phase: 'error',
          message:
            err instanceof Error ? err.message : 'ตรวจสอบสถานะวิดีโอไม่สำเร็จ',
        })
      }
    }, POLL_INTERVAL_MS)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setState({ phase: 'uploading' })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const path = type === 'IMAGE' ? 'images' : 'videos'
      const res = await fetch(`${apiBaseUrl}/api/media/${path}`, {
        method: 'POST',
        body: formData,
        ...withCredentials(),
      })
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'อัปโหลดไม่สำเร็จ'))
      }
      const asset = (await res.json()) as MediaAssetResponse
      // Cloudinary's upload is synchronous and independent of Meta's async
      // video processing, so a preview URL is already available here even
      // for a video that still needs to be polled to READY below.
      setPreviewUrl(asset.previewUrl)
      if (type === 'VIDEO') {
        setState({ phase: 'processing' })
        pollVideoStatus(asset.id)
      } else {
        setState({ phase: 'ready', fileName: file.name })
        onUploaded(asset.id, asset.previewUrl)
      }
    } catch (err) {
      setState({
        phase: 'error',
        message:
          err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่',
      })
    }
  }

  const isBusy = state.phase === 'uploading' || state.phase === 'processing'

  return (
    <div>
      {label && (
        <label className="font-thai block text-lg font-bold text-black">
          {label}
        </label>
      )}
      {state.phase === 'idle' && (existingPreviewUrl || existingLabel) && (
        <div className="mt-1 flex items-center gap-2">
          {type === 'IMAGE' && (
            <img
              src={existingPreviewUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <p className="font-thai text-base text-[#8E98A8]">
            {existingLabel ?? 'สื่อปัจจุบัน'} — เลือกไฟล์ใหม่เพื่อแทนที่
          </p>
        </div>
      )}
      <input
        type="file"
        accept={type === 'IMAGE' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
        disabled={isBusy}
        className="font-thai mt-1 w-full rounded-lg border border-[#8E98A8] px-3 py-2 text-base text-black outline-none disabled:opacity-50"
      />
      {state.phase === 'uploading' && (
        <p className="font-thai mt-1 flex items-center gap-1 text-base text-[#8E98A8]">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังอัปโหลด...
        </p>
      )}
      {state.phase === 'processing' && (
        <p className="font-thai mt-1 flex items-center gap-1 text-base text-[#8E98A8]">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังประมวลผลวิดีโอ...
        </p>
      )}
      {(state.phase === 'processing' || state.phase === 'ready') &&
        previewUrl &&
        (type === 'IMAGE' ? (
          <img
            src={previewUrl}
            alt=""
            className="mt-1 h-24 w-24 rounded-lg object-cover"
          />
        ) : (
          <video
            src={previewUrl}
            controls
            className="mt-1 h-24 w-40 rounded-lg object-cover"
          />
        ))}
      {state.phase === 'ready' && (
        <p className="font-thai mt-1 flex items-center gap-1 text-base text-[#519b5c]">
          <CheckCircle2 className="h-4 w-4" />
          อัปโหลดสำเร็จ{state.fileName && ` · ${state.fileName}`}
        </p>
      )}
      {state.phase === 'error' && (
        <p className="font-thai mt-1 flex items-center gap-1 text-base text-red-600">
          <XCircle className="h-4 w-4" />
          {state.message}
        </p>
      )}
    </div>
  )
}

export default MediaUploadField
