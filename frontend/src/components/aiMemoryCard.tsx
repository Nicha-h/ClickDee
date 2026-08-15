import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import ConfirmDialog from '@/components/confirmDialog'
import {
  getApiAiMemory,
  deleteApiAiMemoryId,
  deleteApiAiMemory,
} from '@/api/generated/client'
import type { AiMemoryItem } from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="font-thai text-lg text-[#1F2937] not-last:mb-1 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="font-thai list-disc pl-6 text-lg text-[#1F2937]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="font-thai list-decimal pl-6 text-lg text-[#1F2937]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function AiMemoryEntry({
  item,
  onDelete,
}: {
  item: AiMemoryItem
  onDelete: (id: string) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="rounded-xl border border-[#E4E1EC] px-5 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-thai text-sm text-[#8E98A8]">
          {formatDate(item.createdAt)}
        </span>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="ลบข้อมูลนี้"
          className="shrink-0 text-[#8E98A8] hover:text-[#E07070]"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {item.question}
        </ReactMarkdown>
      </div>
      <div className="rounded-lg bg-[#F7F5FB] px-4 py-3">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {item.answer}
        </ReactMarkdown>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้ การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onDelete(item.id)
        }}
      />
    </div>
  )
}

function AiMemoryCard() {
  const [items, setItems] = useState<AiMemoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  useEffect(() => {
    getApiAiMemory(withCredentials())
      .then((res) => {
        if (res.status === 200) setItems(res.data)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    await deleteApiAiMemoryId(id, withCredentials())
  }

  const handleClearAll = async () => {
    setClearAllOpen(false)
    setItems([])
    await deleteApiAiMemory(withCredentials())
  }

  return (
    <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-thai text-amalfidark text-2xl font-bold">
            ความจำของ AI
          </h2>
          <p className="font-thai mt-1 text-lg text-[#6B7280]">
            คำถาม-คำตอบที่น้องดี AI จดจำไว้จากช่วงสมัครสมาชิก
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setClearAllOpen(true)}
            className="font-thai flex shrink-0 items-center gap-1 text-base font-semibold text-[#E07070] hover:text-[#c85050]"
          >
            <Trash2 className="h-4 w-4" />
            ลบทั้งหมด
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="font-thai text-lg text-[#8E98A8]">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <p className="font-thai text-lg text-[#8E98A8]">
          ยังไม่มีข้อมูลที่ AI จดจำไว้
        </p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((item) => (
            <AiMemoryEntry key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={clearAllOpen}
        title="ยืนยันการลบข้อมูลทั้งหมด"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบความจำ AI ทั้งหมด การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบทั้งหมด"
        cancelLabel="ยกเลิก"
        onCancel={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
      />
    </div>
  )
}

export default AiMemoryCard
