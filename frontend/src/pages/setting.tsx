import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Trash2 } from 'lucide-react'
import Toggle from '@/components/toggle'
import ConfirmDialog from '@/components/confirmDialog'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import SettingSkeleton from '@/components/settingSkeleton'
import { deleteApiAuthAccountId } from '@/api/generated/client'
import { clearUserId, getUserId } from '@/lib/userId'

type PlanKey = 'free' | 'starter' | 'pro'

{
  /** Plan catalog PLACEHOLDER */
}
const plans: {
  key: PlanKey
  name: string
  price: string
  desc: string
}[] = [
  {
    key: 'free',
    name: 'Free',
    price: '0 บาท/เดือน',
    desc: 'ทดลองใช้งานฟีเจอร์พื้นฐาน',
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '490 บาท/เดือน',
    desc: 'เหมาะสำหรับเริ่มต้นยิงแอด',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '1,490 บาท/เดือน',
    desc: 'ฟีเจอร์ขั้นสูง + AI วิเคราะห์เชิงลึก',
  },
]

type NotifyKey = 'notifyEmail' | 'notifyLine' | 'notifyBudget'

const notifyToggles: { key: NotifyKey; label: string; desc: string }[] = [
  {
    key: 'notifyEmail',
    label: 'แจ้งเตือนทางอีเมล',
    desc: 'สรุปผลแคมเปญรายสัปดาห์',
  },
  {
    key: 'notifyBudget',
    label: 'แจ้งเตือนเมื่อใกล้หมดงบ',
    desc: 'เตือนเมื่อใช้งบถึง 80% ของเพดานที่ตั้งไว้',
  },
]

function Setting() {
  const [plan, setPlan] = useState<PlanKey>('free')
  const [notifySettings, setNotifySettings] = useState<
    Record<NotifyKey, boolean>
  >({
    notifyEmail: true,
    notifyLine: true,
    notifyBudget: false,
  })
  const [language, setLanguage] = useState('th')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isLoading = useSimulatedLoading()
  const navigate = useNavigate()

  const toggleNotify = (key: NotifyKey, checked: boolean) => {
    setNotifySettings((prev) => ({ ...prev, [key]: checked }))
  }

  const closeDeleteDialog = () => {
    setConfirmDeleteOpen(false)
    setDeletePassword('')
    setDeleteError(null)
  }

  const logout = () => {
    clearUserId()
    navigate('/login')
  }

  const deleteAccount = async () => {
    const id = getUserId()
    if (!id) {
      navigate('/login')
      return
    }
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await deleteApiAuthAccountId(id, { password: deletePassword })
      if (res.status === 401) {
        setDeleteError('รหัสผ่านไม่ถูกต้อง')
        return
      }
      clearUserId()
      navigate('/login')
    } catch {
      setDeleteError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <SettingSkeleton />

  return (
    <div className="min-h-full min-w-full py-10">
      <h1 className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
        ตั้งค่า
      </h1>
      <p className="font-thai mt-2 text-lg font-semibold text-black">
        จัดการแพ็กเกจ การแจ้งเตือน และการตั้งค่าบัญชีของคุณ
      </p>

      <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <h2 className="font-thai text-amalfidark mb-5 text-xl font-bold">
          แพ็กเกจและการเรียกเก็บเงิน
        </h2>
        <div className="flex flex-wrap items-stretch gap-5">
          {plans.map((p) => {
            const isCurrent = plan === p.key
            const isPro = p.key === 'pro'
            return (
              <div
                key={p.key}
                className={`min-w-55 flex-1 rounded-2xl p-6 ${
                  isPro
                    ? 'bg-amalfidark text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)]'
                    : 'bg-amalfilight text-amalfidark'
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-lg font-bold">{p.name}</span>
                  {isCurrent && (
                    <span
                      className={`font-thai rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPro ? 'bg-white/35' : 'bg-amalfidark/10'
                      }`}
                    >
                      ใช้งานอยู่
                    </span>
                  )}
                </div>
                <div className="mb-1 text-2xl font-bold">{p.price}</div>
                <p
                  className={`font-thai mb-5 text-sm ${isPro ? 'text-white/80' : 'text-[#6B7280]'}`}
                >
                  {p.desc}
                </p>
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => setPlan(p.key)}
                    className="bg-amalfidark font-thai hover:bg-amalfidarker w-full rounded-xl py-3 text-sm font-semibold text-white"
                  >
                    อัปเกรดแพ็กเกจ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <h2 className="font-thai text-amalfidark mb-2 text-2xl font-bold">
          การแจ้งเตือน
        </h2>
        <div className="flex flex-col">
          {notifyToggles.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4 border-b border-[#F0ECF7] py-4 last:border-b-0"
            >
              <div>
                <p className="font-thai text-xl font-semibold text-[#1F2937]">
                  {t.label}
                </p>
                <p className="font-thai text-base text-[#6B7280]">{t.desc}</p>
              </div>
              <Toggle
                checked={notifySettings[t.key]}
                onChange={(checked) => toggleNotify(t.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <h2 className="font-thai text-amalfidark mb-5 text-2xl font-bold">
          ภาษา
        </h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="font-thai w-full max-w-65 rounded-lg border border-[#E4E1EC] bg-white px-3.5 py-3 text-base text-[#1F2937] outline-none"
        >
          <option value="th">ไทย</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <h2 className="font-thai text-amalfidark mb-5 text-2xl font-bold">
          บัญชี
        </h2>
        <div className="flex flex-col">
          <Link
            to="/account"
            className="font-thai hover:text-amalfidark flex items-center justify-between border-b border-[#F0ECF7] py-4 text-xl font-semibold text-[#1F2937] last:border-b-0"
          >
            <span>แก้ไขข้อมูลบัญชีและธุรกิจ</span>
            <ChevronRight className="h-5 w-5 text-[#8E98A8]" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setDeletePassword('')
              setDeleteError(null)
              setConfirmDeleteOpen(true)
            }}
            className="font-thai flex items-center gap-2 border-b border-[#F0ECF7] py-4 text-left text-lg font-bold text-[#E07070] last:border-b-0 hover:text-[#c85050]"
          >
            <Trash2 className="h-5 w-5" />
            <span>ลบบัญชี</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="font-thai py-4 text-left text-lg font-bold text-[#E07070] last:border-b-0 hover:text-[#c85050]"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="ยืนยันการลบบัญชี"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้ การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel={isDeleting ? 'กำลังลบบัญชี...' : 'ลบบัญชี'}
        cancelLabel="ยกเลิก"
        confirmDisabled={!deletePassword || isDeleting}
        onCancel={closeDeleteDialog}
        onConfirm={deleteAccount}
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="delete-account-password"
            className="font-thai text-amalfidark text-base font-medium"
          >
            กรอกรหัสผ่านเพื่อยืนยัน
          </label>
          <input
            id="delete-account-password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="รหัสผ่านของคุณ"
            className="font-thai border-amalfilight-hover text-amalfidark focus:border-amalfi h-12 w-full rounded-xl border-[1.5px] px-4 text-base placeholder:text-[#8E98A8] focus:outline-none"
          />
          {deleteError && (
            <p className="font-thai text-sm text-red-500">{deleteError}</p>
          )}
        </div>
      </ConfirmDialog>

      <div className="h-10 w-full shrink-0" />
    </div>
  )
}

export default Setting
