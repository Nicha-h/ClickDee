import { useEffect, useState } from 'react'
import { CircleUserRound, Pencil } from 'lucide-react'
import AccountSkeleton from '@/components/accountSkeleton'
import AiMemoryCard from '@/components/aiMemoryCard'
import {
  getApiAuthAccountId,
  patchApiAuthAccountId,
} from '@/api/generated/client'
import type { UpdateAccountInput } from '@/api/generated/client'
import { getUserId, withCredentials } from '@/lib/userId'

type EditableFieldProps = {
  fieldKey: string
  label: string
  value: string
  multiline?: boolean
  rows?: number
  editingKey: string | null
  isSaving?: boolean
  error?: string | null
  onEdit: (key: string) => void
  onSave: () => void
  onChange: (key: string, value: string) => void
}

function EditableField({
  fieldKey,
  label,
  value,
  multiline,
  rows = 3,
  editingKey,
  isSaving,
  error,
  onEdit,
  onSave,
  onChange,
}: EditableFieldProps) {
  const isEditing = editingKey === fieldKey

  return (
    <div className="rounded-xl border border-[#E4E1EC] px-5 py-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-thai text-xl font-medium text-[#6B7280]">
          {label}
        </span>
        {isEditing ? (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="font-thai text-amalfidark hover:text-amalfidarker text-lg font-semibold disabled:opacity-50"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onEdit(fieldKey)}
            className="font-thai flex items-center gap-1 text-lg font-medium text-[#8E98A8] hover:text-[#6B7280]"
          >
            <Pencil className="h-3.5 w-3.5" />
            แก้ไข
          </button>
        )}
      </div>
      {isEditing ? (
        multiline ? (
          <textarea
            value={value}
            rows={rows}
            disabled={isSaving}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="font-thai w-full resize-y rounded-lg border border-[#D2C8E6] px-2.5 py-2 text-lg text-[#1F2937] outline-none disabled:opacity-50"
          />
        ) : (
          <input
            type="text"
            value={value}
            disabled={isSaving}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="font-thai w-full rounded-lg border border-[#D2C8E6] px-2.5 py-2 text-lg text-[#1F2937] outline-none disabled:opacity-50"
          />
        )
      ) : (
        <div className="font-thai text-lg whitespace-pre-wrap text-[#1F2937]">
          {value}
        </div>
      )}
      {isEditing && error && (
        <p className="font-thai mt-1.5 text-base text-red-600">{error}</p>
      )}
    </div>
  )
}

const emptyProfile = { name: '', email: '' }
const emptyBusiness = {
  storeName: '',
  category: '',
  budget: '',
  location: '',
  products: '',
  persona: '',
}

type ProfileKey = keyof typeof emptyProfile
type BusinessKey = keyof typeof emptyBusiness

// Frontend field names differ from the backend User columns they persist to.
const BUSINESS_FIELD_TO_ACCOUNT_KEY: Record<
  BusinessKey,
  keyof UpdateAccountInput
> = {
  storeName: 'businessName',
  category: 'category',
  budget: 'budget',
  location: 'location',
  products: 'signatureProduct',
  persona: 'customerPersona',
}

type AccountTab = 'profile' | 'ai-memory'

const tabs: { key: AccountTab; label: string }[] = [
  { key: 'profile', label: 'โปรไฟล์' },
  { key: 'ai-memory', label: 'ความจำ AI' },
]

function Account() {
  const [userId] = useState(() => getUserId())
  const [profile, setProfile] = useState(emptyProfile)
  const [business, setBusiness] = useState(emptyBusiness)
  const [isLoading, setIsLoading] = useState(() => !!userId)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<{
    key: string
    message: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')

  useEffect(() => {
    if (!userId) return
    getApiAuthAccountId(userId, withCredentials()).then((res) => {
      if (res.status === 200) {
        setProfile({ name: res.data.name ?? '', email: res.data.email })
        setBusiness({
          storeName: res.data.businessName ?? '',
          category: res.data.category ?? '',
          budget: res.data.budget ?? '',
          location: res.data.location ?? '',
          products: res.data.signatureProduct ?? '',
          persona: res.data.customerPersona ?? '',
        })
      }
      setIsLoading(false)
    })
  }, [userId])

  const updateProfile = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }
  const updateBusiness = (key: string, value: string) => {
    setBusiness((prev) => ({ ...prev, [key]: value }))
  }

  const saveEditing = async () => {
    if (!userId || !editingKey) return
    const isProfileField = editingKey in profile
    const value = isProfileField
      ? profile[editingKey as ProfileKey]
      : business[editingKey as BusinessKey]
    const accountKey = isProfileField
      ? (editingKey as keyof UpdateAccountInput)
      : BUSINESS_FIELD_TO_ACCOUNT_KEY[editingKey as BusinessKey]

    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await patchApiAuthAccountId(
        userId,
        { [accountKey]: value },
        withCredentials(),
      )
      if (res.status === 200) {
        setEditingKey(null)
      } else if (res.status === 409) {
        setSaveError({ key: editingKey, message: 'อีเมลนี้ถูกใช้งานแล้ว' })
      } else {
        setSaveError({
          key: editingKey,
          message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        })
      }
    } catch {
      setSaveError({
        key: editingKey,
        message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (key: string) => {
    setSaveError(null)
    setEditingKey(key)
  }

  if (isLoading) return <AccountSkeleton />

  return (
    <div className="min-h-full min-w-full py-10">
      <h1 className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
        บัญชีของฉัน
      </h1>
      <p className="font-thai mt-2 text-lg font-semibold text-black">
        ข้อมูลส่วนตัวและข้อมูลธุรกิจที่น้องดี AI ใช้วางแผนแคมเปญให้คุณ
      </p>

      <div className="font-thai mt-6 flex w-full gap-2 border-b border-[#E4E1EC]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-lg font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-amalfidark text-amalfidark'
                : 'border-transparent text-[#8E98A8] hover:text-[#6B7280]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <>
          <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="mb-6 flex items-center gap-5">
              <div className="bg-amalfilight flex h-18 w-18 shrink-0 items-center justify-center rounded-full">
                <CircleUserRound className="text-amalfidark h-19 w-19" />
              </div>
              <div>
                <p className="font-thai text-2xl font-bold text-[#1F2937]">
                  {profile.name}
                </p>
                <p className="font-thai text-xl text-[#6B7280]">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <EditableField
                fieldKey="name"
                label="ชื่อ-นามสกุล"
                value={profile.name}
                editingKey={editingKey}
                isSaving={editingKey === 'name' && isSaving}
                error={editingKey === 'name' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateProfile}
              />
              <EditableField
                fieldKey="email"
                label="อีเมล"
                value={profile.email}
                editingKey={editingKey}
                isSaving={editingKey === 'email' && isSaving}
                error={editingKey === 'email' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateProfile}
              />
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h2 className="font-thai text-amalfidark text-2xl font-bold">
              ข้อมูลธุรกิจ
            </h2>
            <p className="font-thai mt-1 mb-6 text-lg text-[#6B7280]">
              แก้ไขได้ทุกเมื่อ — น้องดี AI
              จะใช้ข้อมูลนี้วางแผนแคมเปญให้ตรงกลุ่มลูกค้ามากขึ้น
            </p>

            <div className="flex flex-col gap-3.5">
              <EditableField
                fieldKey="storeName"
                label="ชื่อร้าน/ธุรกิจ"
                value={business.storeName}
                editingKey={editingKey}
                isSaving={editingKey === 'storeName' && isSaving}
                error={editingKey === 'storeName' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
              <EditableField
                fieldKey="category"
                label="ประเภทธุรกิจ"
                value={business.category}
                editingKey={editingKey}
                isSaving={editingKey === 'category' && isSaving}
                error={editingKey === 'category' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
              <EditableField
                fieldKey="budget"
                label="งบโฆษณาต่อเดือน"
                value={business.budget}
                editingKey={editingKey}
                isSaving={editingKey === 'budget' && isSaving}
                error={editingKey === 'budget' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
              <EditableField
                fieldKey="location"
                label="ทำเลที่ตั้ง"
                value={business.location}
                editingKey={editingKey}
                isSaving={editingKey === 'location' && isSaving}
                error={editingKey === 'location' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
              <EditableField
                fieldKey="products"
                label="สินค้า/เมนูเด่น"
                value={business.products}
                multiline
                rows={3}
                editingKey={editingKey}
                isSaving={editingKey === 'products' && isSaving}
                error={editingKey === 'products' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
              <EditableField
                fieldKey="persona"
                label="AI Insight: ลูกค้าตัวจริงของคุณ"
                value={business.persona}
                multiline
                rows={4}
                editingKey={editingKey}
                isSaving={editingKey === 'persona' && isSaving}
                error={editingKey === 'persona' ? saveError?.message : null}
                onEdit={startEditing}
                onSave={saveEditing}
                onChange={updateBusiness}
              />
            </div>
          </div>
        </>
      ) : (
        <AiMemoryCard />
      )}

      <div className="h-10 w-full shrink-0" />
    </div>
  )
}

export default Account
