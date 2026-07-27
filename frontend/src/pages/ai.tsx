import { useState } from 'react'
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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import aiMascot from '@/assets/ai-mascot.png'

type ChatMessage = {
  id: string
  sender: 'ai' | 'user'
  text: string
  list?: string[]
  closing?: string
  time: string
}

{
  /** Chat history PLACEHOLDER*/
}
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'ai',
    time: '7:10 pm',
    text: 'สวัสดีค่ะคุณลูกค้า! ฉัน "น้อง ดี" พร้อมช่วยวางแผนการตลาดให้ธุรกิจของคุณแล้วค่ะ!',
  },
  {
    id: '2',
    sender: 'user',
    time: '7:17 pm',
    text: 'อยากทำแคมเปญกระตุ้นยอดขายช่วงหน้าร้อนนี้ครับ ร้านผมขายเครื่องดื่มเล็กๆ',
  },
  {
    id: '3',
    sender: 'ai',
    time: '7:17 pm',
    text: 'ยินดีเลยค่ะ! จากข้อมูลพฤติกรรมผู้บริโภคในช่วงนี้ ฉันขอแนะนำ "แคมเปญเครื่องดื่มเย็นดับร้อน" โดยเน้นกลุ่มเป้าหมายในพื้นที่รัศมี 3 กม. รอบร้านค่ะ',
    list: [
      'เน้นภาพเครื่องดื่มที่มีหยดน้ำเกาะดูเย็นสดชื่น',
      'ช่วงเวลาแนะนำ: 11:30 - 15:00 น. (ช่วงอากาศร้อนจัด)',
      'งบประมาณเริ่มต้นเพียง 100 บาท/วัน',
    ],
    closing: 'คุณต้องการให้ฉันร่างข้อความโฆษณาให้เลยไหมคะ? ✨',
  },
]

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

function AiBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-row items-start gap-3">
      <img
        src={aiMascot}
        alt="น้องดี"
        className="h-15 w-15 shrink-0 rounded-full"
      />
      <div>
        <div className="bg-sealight-hover max-w-xl rounded-tr-xl rounded-br-xl rounded-bl-xl border border-[#8E98A8] p-4">
          <p className="font-thai text-xl text-black">{message.text}</p>
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
        <p className="font-thai mt-1 text-right text-sm text-[#8E98A8]">
          {message.time}
        </p>
      </div>
      <CircleUserRound className="h-15 w-15 shrink-0 text-[#8E98A8]" />
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

  return (
    <div className="flex h-[calc(100vh-5rem)] min-w-full flex-col py-10">
      <h1 className="text-amalfidark font-thai text-4xl font-bold">
        ที่ปรึกษา AI
      </h1>

      <div className="mt-6 flex min-h-0 flex-1 flex-row items-stretch gap-0">
        {/** Chat column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 pr-6">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2">
            {initialMessages.map((message) =>
              message.sender === 'ai' ? (
                <AiBubble key={message.id} message={message} />
              ) : (
                <UserBubble key={message.id} message={message} />
              ),
            )}
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="border-seadark mt-2 mb-2 flex shrink-0 items-center gap-2 rounded-full border-2 bg-white px-4 py-2"
          >
            {/* TODO: wire up real send/AI response once a backend exists */}
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder="พิมพ์คำถามของคุณ..."
              className="font-thai flex-1 text-lg outline-none"
            />
            <button
              type="submit"
              className="bg-sealight-hover flex h-12 w-10 shrink-0 items-center justify-center rounded-full 
              hover:scale-105 hover:*:cursor-pointer *:transition-all"
            >
              <Send className="text-amalfidark h-6 w-6" />
            </button>
          </form>
        </div>

        {/** Quick Actions panel */}
        <div className="relative flex shrink-0 self-stretch">
          <button
            type="button"
            onClick={() => setQuickActionsOpen((open) => !open)}
            className="absolute top-8 -left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#8E98A8] bg-white shadow-md transition-all hover:scale-115 hover:cursor-pointer"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className={`bg-citrus-light-active overflow-x-clip overflow-y-scroll rounded-[10px] transition-all duration-200 ${
              quickActionsOpen ? 'w-105 p-6 opacity-100' : 'w-0 p-0 opacity-0'
            }`}
          >
            <div className="border-citrusdark flex w-91 items-center gap-2 border-b-2 pb-3">
              <Zap className="text-amalfidark h-6 w-6" />
              <h2 className="font-thai text-amalfidark text-2xl font-bold">
                Quick Actions
              </h2>
            </div>
            <div className="mt-4 flex w-91 flex-col gap-3">
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
  )
}

export default Ai
