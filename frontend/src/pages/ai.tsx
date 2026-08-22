import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  ChevronRight,
  Send,
  CircleUserRound,
  Users,
  ClipboardList,
  TrendingUp,
  PenTool,
  BarChart3,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import aiMascot from '@/assets/placeholders/ai-mascot.png'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import AiSkeleton from '@/components/aiSkeleton'
import {
  getApiAiMessages,
  postApiAiMessages,
  postApiAiActionsIdConfirm,
  postApiAiActionsIdCancel,
} from '@/api/generated/client'
import type {
  AiMessage as ApiAiMessage,
  PendingAiAction,
} from '@/api/generated/client'
import { getUserId, withCredentials } from '@/lib/userId'
import { pendingActionSummary } from '@/lib/pendingAction'

type ChatMessage = {
  id: string
  sender: 'ai' | 'user'
  text: string
  list?: string[]
  closing?: string
  time: string
  pendingAction?: NonNullable<PendingAiAction>
  redacted?: boolean
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const hours24 = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const period = hours24 >= 12 ? 'pm' : 'am'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${minutes} ${period}`
}

function toChatMessage(message: ApiAiMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.role === 'assistant' ? 'ai' : 'user',
    text: message.text,
    list: message.list ?? undefined,
    closing: message.closing ?? undefined,
    time: formatTime(message.createdAt),
    pendingAction: message.pendingAction ?? undefined,
    redacted: message.redacted,
  }
}

function greetingMessage(): ChatMessage {
  return {
    id: 'greeting',
    sender: 'ai',
    text: 'สวัสดีค่ะ ฉันชื่อ **น้องดี** ผู้ช่วย AI ของ ClickDee 👋 ถามอะไรเกี่ยวกับการตลาดหรือแคมเปญโฆษณาได้เลยค่ะ\n\nตอนนี้น้องดีช่วย**สร้างแคมเปญฉบับร่าง**ให้คุณได้ในแชทนี้เลย (ยังไม่เผยแพร่หรือใช้งบจริง — คุณต้องเปิดใช้งานเองอีกทีนะคะ) แค่บอกชื่อแคมเปญ งบประมาณ และวันเริ่มต้นมาได้เลยค่ะ',
    time: formatTime(new Date().toISOString()),
  }
}

function errorChatMessage(status: number): ChatMessage {
  const text =
    status === 429
      ? 'ตอนนี้มีคนใช้งานเยอะ กรุณาลองใหม่อีกครั้งค่ะ'
      : status === 422
        ? 'ข้อความนี้ถูกบล็อกโดยระบบตรวจสอบความปลอดภัย กรุณาลองใหม่อีกครั้งค่ะ'
        : status === 503
          ? 'ระบบ AI ยังไม่พร้อมใช้งานในขณะนี้ค่ะ'
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ'
  return {
    id: `error-${Date.now()}`,
    sender: 'ai',
    text,
    time: formatTime(new Date().toISOString()),
  }
}

type QuickAction = {
  id: string
  icon: LucideIcon
  title: string
  description: string
  prompt: string
}

{
  /** Quick actions PLACEHOLDER*/
}
const quickActions: QuickAction[] = [
  {
    id: 'competitor-analysis',
    icon: Users,
    title: 'วิเคราะห์คู่แข่ง',
    description: 'ตรวจสอบกลยุทธ์ของคู่แข่งในกรุงเทพฯ',
    prompt: 'ช่วยวิเคราะห์คู่แข่งในพื้นที่ร้านของฉันหน่อย',
  },
  {
    id: '30-day-strategy',
    icon: ClipboardList,
    title: 'แนะนำกลยุทธ์ 30 วัน',
    description: 'แผนการดำเนินงานฉบับสมบูรณ์สำหรับเดือนถัดไป',
    prompt: 'ช่วยวางแผนกลยุทธ์การตลาด 30 วันให้หน่อย',
  },
  {
    id: 'reduce-cpa',
    icon: TrendingUp,
    title: 'วิธีลดค่า CPA',
    description: 'เคล็ดลับเพิ่มประสิทธิภาพสำหรับโฆษณาปัจจุบัน',
    prompt: 'มีวิธีลดค่า CPA ของแคมเปญปัจจุบันยังไงบ้าง',
  },
  {
    id: 'facebook-ad-copy',
    icon: PenTool,
    title: 'เขียนแคปชั่นโฆษณา Facebook',
    description: 'แนวคิดเนื้อหาเพื่อสร้างกระแสความนิยม',
    prompt: 'ช่วยเขียนแคปชั่นโฆษณา Facebook ให้ร้านของฉันหน่อย',
  },
  {
    id: 'daily-insight',
    icon: BarChart3,
    title: 'ข้อมูลเชิงลึกประจำวัน',
    description:
      'อัตราการมีส่วนร่วมบน Facebook ในประเทศไทยสูงสุดในวันอังคาร เวลา 19:00 น. โปรดวางแผนการโพสต์ของคุณให้เหมาะสม',
    prompt: 'ขอข้อมูลเชิงลึกประจำวันสำหรับร้านของฉันหน่อย',
  },
]

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="font-thai text-xl text-black not-last:mb-2 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="font-thai list-disc pl-6 text-xl text-black">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="font-thai list-decimal pl-6 text-xl text-black">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => (
    <h1 className="font-thai mt-1 mb-2 text-2xl font-bold text-black">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-thai mt-1 mb-2 text-xl font-bold text-black">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-thai mt-1 mb-1 text-lg font-bold text-black">
      {children}
    </h3>
  ),
  hr: () => <hr className="my-2 border-black/10" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amalfi hover:text-amalfihover underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-amalfi/40 font-thai my-2 border-l-4 pl-4 text-black/80 italic">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-black/5 p-3 font-mono text-sm">
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.9em]">
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="font-thai min-w-full border-collapse text-left text-base">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b-2 border-black/20">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-black/10">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-1.5 font-bold text-black">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-1.5 text-black">{children}</td>,
}

function PendingActionCard({
  action,
  onResolved,
}: {
  action: NonNullable<PendingAiAction>
  onResolved: (result: {
    status: 'CONFIRMED' | 'CANCELED'
    campaignId?: string | null
  }) => void
}) {
  const [isResolving, setIsResolving] = useState(false)
  const [publish, setPublish] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { label, rows } = pendingActionSummary(action)

  const handleConfirm = async () => {
    setIsResolving(true)
    setError(null)
    try {
      const res = await postApiAiActionsIdConfirm(
        action.id,
        { publish },
        withCredentials(),
      )
      if (res.status === 200) {
        onResolved({ status: 'CONFIRMED', campaignId: res.data.campaignId })
      } else {
        setError('ไม่สามารถยืนยันได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch {
      setError('ไม่สามารถยืนยันได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsResolving(false)
    }
  }

  const handleCancel = async () => {
    setIsResolving(true)
    setError(null)
    try {
      const res = await postApiAiActionsIdCancel(action.id, withCredentials())
      if (res.status === 200) {
        onResolved({ status: 'CANCELED' })
      } else {
        setError('ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch {
      setError('ไม่สามารถยกเลิกได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="border-amalfi/40 mt-3 w-full max-w-xl rounded-xl border-2 border-dashed bg-white p-4">
      <p className="font-thai text-amalfidark text-lg font-bold">{label}</p>
      {rows.length > 0 && (
        <dl className="font-thai mt-2 space-y-1 text-base text-black">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="shrink-0 font-semibold text-[#6B7280]">{k}:</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {action.type !== 'DELETE' && (
        <label className="font-thai mt-3 flex items-center gap-2 text-base text-black">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            disabled={isResolving}
          />
          เผยแพร่ทันที (ไม่เลือก = บันทึกเป็นแบบร่าง)
        </label>
      )}
      {error && <p className="font-thai mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isResolving}
          className="bg-amalfi hover:bg-amalfihover font-thai flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {isResolving && <Loader2 className="h-4 w-4 animate-spin" />}
          ยืนยัน
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isResolving}
          className="font-thai rounded-full border border-[#8E98A8] px-4 py-2 text-sm font-bold text-[#6B7280] disabled:opacity-50"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

function PendingActionResolvedBadge({
  action,
}: {
  action: NonNullable<PendingAiAction>
}) {
  if (action.status === 'CONFIRMED') {
    return (
      <div className="font-thai mt-3 text-base text-green-700">
        ✓ ยืนยันแล้ว
        {action.targetCampaignId && (
          <>
            {' — '}
            <Link
              to={`/campaign/${action.targetCampaignId}`}
              className="text-amalfi hover:text-amalfihover underline"
            >
              ดูแคมเปญ
            </Link>
          </>
        )}
      </div>
    )
  }
  if (action.status === 'CANCELED') {
    return <p className="font-thai mt-3 text-base text-[#8E98A8]">ยกเลิกแล้ว</p>
  }
  if (action.status === 'EXPIRED') {
    return (
      <p className="font-thai mt-3 text-base text-[#8E98A8]">
        หมดอายุการยืนยันแล้ว
      </p>
    )
  }
  return null
}

function AiBubble({
  message,
  onPendingActionResolved,
}: {
  message: ChatMessage
  onPendingActionResolved: (
    messageId: string,
    result: { status: 'CONFIRMED' | 'CANCELED'; campaignId?: string | null },
  ) => void
}) {
  return (
    <div className="flex flex-row items-start gap-3">
      <img
        src={aiMascot}
        alt="น้องดี"
        className="h-15 w-15 shrink-0 rounded-full"
      />
      <div>
        <div className="bg-sealight-hover max-w-xl rounded-tr-xl rounded-br-xl rounded-bl-xl border border-[#8E98A8] p-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.text}
          </ReactMarkdown>
          {message.list && (
            <div className="font-thai mt-2 text-lg text-black">
              <p>ข้อแนะนำ:</p>
              <ul className="list-disc pl-6">
                {message.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {message.closing && (
            <p className="font-thai mt-2 text-xl text-black">
              {message.closing}
            </p>
          )}
        </div>
        {message.pendingAction &&
          (message.pendingAction.status === 'PENDING' ? (
            <PendingActionCard
              action={message.pendingAction}
              onResolved={(result) =>
                onPendingActionResolved(message.id, result)
              }
            />
          ) : (
            <PendingActionResolvedBadge action={message.pendingAction} />
          ))}
        <p className="font-thai mt-1 text-sm text-[#8E98A8]">{message.time}</p>
      </div>
    </div>
  )
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-row items-start justify-end gap-3">
      <div className="items-end">
        <div className="max-w-xl rounded-tl-xl rounded-br-xl rounded-bl-xl border border-[#8E98A8] bg-white p-4">
          <p className="font-thai text-lg text-black">{message.text}</p>
        </div>
        {message.redacted && (
          <p className="font-thai mt-1 flex items-center justify-end gap-1 text-right text-sm text-amber-600">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            บางส่วนของข้อความถูกลบเนื่องจากอาจมีข้อมูลส่วนบุคคล
          </p>
        )}
        <p className="font-thai mt-1 text-right text-sm text-[#8E98A8]">
          {message.time}
        </p>
      </div>
      <CircleUserRound className="h-15 w-15 shrink-0 text-[#8E98A8]" />
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex flex-row items-start gap-3">
      <img
        src={aiMascot}
        alt="น้องดี"
        className="h-15 w-15 shrink-0 rounded-full"
      />
      <div className="bg-sealight-hover flex items-center gap-1.5 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-[#8E98A8] px-4 py-4.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E98A8] [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E98A8] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8E98A8]" />
      </div>
    </div>
  )
}

function QuickActionCard({
  action,
  onSelect,
}: {
  action: QuickAction
  onSelect: () => void
}) {
  const Icon = action.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-row items-start gap-2 rounded-[10px] bg-white p-4 text-left hover:shadow-md"
    >
      <Icon className="text-amalfidark h-7 w-7 shrink-0" />
      <div className="flex-1">
        <p className="font-thai text-amalfidark text-lg font-bold">
          {action.title}
        </p>
        <p className="font-thai text-base text-black">{action.description}</p>
      </div>
      <ChevronRight className="text-amalfidark 5 mt-1 h-5 w-5 shrink-0" />
    </button>
  )
}

function Ai() {
  const [inputValue, setInputValue] = useState('')
  const [quickActionsOpen, setQuickActionsOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userId] = useState(() => getUserId())
  const [isSending, setIsSending] = useState(false)
  const isLoading = useSimulatedLoading()

  useEffect(() => {
    if (!userId) return
    getApiAiMessages(withCredentials()).then((res) => {
      if (res.status === 200) {
        setMessages(
          res.data.length > 0
            ? res.data.map(toChatMessage)
            : [greetingMessage()],
        )
      }
    })
  }, [userId])

  const handlePendingActionResolved = (
    messageId: string,
    result: { status: 'CONFIRMED' | 'CANCELED'; campaignId?: string | null },
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingAction
          ? {
              ...m,
              pendingAction: {
                ...m.pendingAction,
                status: result.status,
                targetCampaignId:
                  result.campaignId ?? m.pendingAction.targetCampaignId,
              },
            }
          : m,
      ),
    )
  }

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    const text = inputValue.trim()
    if (!text || !userId || isSending) return

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: 'user',
        text,
        time: formatTime(new Date().toISOString()),
      },
    ])
    setInputValue('')
    setIsSending(true)

    try {
      const res = await postApiAiMessages({ text }, withCredentials())
      setMessages((prev) => [
        ...prev,
        ...(res.status === 201
          ? res.data.assistantMessages.map(toChatMessage)
          : [errorChatMessage(res.status)]),
      ])
    } catch {
      setMessages((prev) => [...prev, errorChatMessage(0)])
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <AiSkeleton />

  return (
    <div className="flex h-[calc(100vh-5rem)] min-w-full flex-col py-10">
      <h1 className="text-amalfidark font-thai text-2xl font-bold sm:text-3xl lg:text-4xl">
        ที่ปรึกษา AI
      </h1>

      <div className="mt-6 flex min-h-0 flex-1 flex-col items-stretch gap-0 xl:flex-row">
        {/** Chat column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 xl:pr-6">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2">
            {messages.map((message) =>
              message.sender === 'ai' ? (
                <AiBubble
                  key={message.id}
                  message={message}
                  onPendingActionResolved={handlePendingActionResolved}
                />
              ) : (
                <UserBubble key={message.id} message={message} />
              ),
            )}
            {isSending && <TypingBubble />}
          </div>
          {!userId && (
            <p className="font-thai text-sm text-red-500">
              กรุณาสมัครสมาชิกก่อนใช้งานแชท AI
            </p>
          )}
          <form
            onSubmit={handleSend}
            className="border-seadark mt-2 mb-2 flex shrink-0 items-center gap-2 rounded-full border-2 bg-white px-4 py-2"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder="พิมพ์คำถามของคุณ..."
              disabled={!userId || isSending}
              className="font-thai flex-1 px-3 text-lg outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!userId || isSending}
              className="bg-sealight-hover flex h-12 w-10 shrink-0 items-center justify-center rounded-full *:transition-all hover:scale-105 hover:*:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="text-amalfidark h-6 w-6" />
            </button>
          </form>
        </div>

        {/** Quick Actions panel */}
        <div className="relative mt-4 flex w-full shrink-0 flex-col self-stretch xl:mt-0 xl:w-auto xl:flex-row">
          <button
            type="button"
            onClick={() => setQuickActionsOpen((open) => !open)}
            className="absolute top-8 -left-4 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-[#8E98A8] bg-white shadow-md transition-all hover:scale-115 hover:cursor-pointer xl:flex"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickActionsOpen((open) => !open)}
            className="bg-citrus-light-active font-thai text-amalfidark flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-lg font-bold xl:hidden"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </span>
            <ChevronRight
              className={`h-5 w-5 transition-transform ${quickActionsOpen ? 'rotate-90' : ''}`}
            />
          </button>
          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out xl:mt-0 xl:grid-rows-[1fr] xl:overflow-visible xl:opacity-100 ${
              quickActionsOpen
                ? 'mt-2 grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0">
              <div
                className={`bg-citrus-light-active overflow-x-clip rounded-[10px] transition-all duration-200 xl:overflow-y-scroll ${
                  quickActionsOpen ? 'w-full p-6 xl:w-105' : 'w-full p-0 xl:w-0'
                }`}
              >
                <div className="border-citrusdark flex w-full items-center gap-2 border-b-2 pb-3 xl:w-91">
                  <Zap className="text-amalfidark h-6 w-6" />
                  <h2 className="font-thai text-amalfidark text-2xl font-bold">
                    Quick Actions
                  </h2>
                </div>
                <div className="mt-4 flex w-full flex-col gap-3 xl:w-91">
                  {quickActions.map((action) => (
                    <QuickActionCard
                      key={action.id}
                      action={action}
                      onSelect={() => setInputValue(action.prompt)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ai
