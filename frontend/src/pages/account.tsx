import { useState } from 'react'
import { CircleUserRound, Pencil } from 'lucide-react'

type EditableFieldProps = {
  fieldKey: string
  label: string
  value: string
  multiline?: boolean
  rows?: number
  editingKey: string | null
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
            className="font-thai text-amalfidark hover:text-amalfidarker text-lg font-semibold"
          >
            บันทึก
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
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="font-thai w-full resize-y rounded-lg border border-[#D2C8E6] px-2.5 py-2 text-lg text-[#1F2937] outline-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="font-thai w-full rounded-lg border border-[#D2C8E6] px-2.5 py-2 text-lg text-[#1F2937] outline-none"
          />
        )
      ) : (
        <div className="font-thai text-lg whitespace-pre-wrap text-[#1F2937]">
          {value}
        </div>
      )}
    </div>
  )
}

{
  /** Profile + business data PLACEHOLDER */
}
const initialProfile = {
  name: 'มะลิ ใจดี',
  email: 'malee.shop@email.com',
}

const initialBusiness = {
  storeName: 'ร้านก๋วยเตี๋ยวป้ามะลิ',
  category: 'ร้านอาหาร/เครื่องดื่ม',
  budget: '3,000 - 10,000 บาท/เดือน',
  location: 'บางแค กรุงเทพฯ',
  products: 'ก๋วยเตี๋ยวเรือ, ข้าวขาหมู',
  persona:
    'กลุ่มเป้าหมายตัวจริงของร้านคุณคือ พนักงานออฟฟิศแถวร้าน ที่มักเลือกซื้อในช่วงมื้อเที่ยง และประทับใจร้านคุณเรื่องรสชาติ/คุณภาพจัดเต็ม',
}

function Account() {
  const [profile, setProfile] = useState(initialProfile)
  const [business, setBusiness] = useState(initialBusiness)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const updateProfile = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }
  const updateBusiness = (key: string, value: string) => {
    setBusiness((prev) => ({ ...prev, [key]: value }))
  }
  const saveEditing = () => setEditingKey(null)

  return (
    <div className="min-h-full min-w-full py-10">
      <h1 className="font-thai text-amalfidark text-4xl font-bold">
        บัญชีของฉัน
      </h1>
      <p className="font-thai mt-2 text-lg font-semibold text-black">
        ข้อมูลส่วนตัวและข้อมูลธุรกิจที่น้องดี AI ใช้วางแผนแคมเปญให้คุณ
      </p>

      <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="mb-6 flex items-center gap-5">
          <div className="bg-amalfilight flex h-18 w-18 shrink-0 items-center justify-center rounded-full">
            <CircleUserRound className="text-amalfidark h-19 w-19" />
          </div>
          <div>
            <p className="font-thai text-2xl font-bold text-[#1F2937]">
              {profile.name}
            </p>
            <p className="font-thai text-xl text-[#6B7280]">{profile.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <EditableField
            fieldKey="name"
            label="ชื่อ-นามสกุล"
            value={profile.name}
            editingKey={editingKey}
            onEdit={setEditingKey}
            onSave={saveEditing}
            onChange={updateProfile}
          />
          <EditableField
            fieldKey="email"
            label="อีเมล"
            value={profile.email}
            editingKey={editingKey}
            onEdit={setEditingKey}
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
            onEdit={setEditingKey}
            onSave={saveEditing}
            onChange={updateBusiness}
          />
          <EditableField
            fieldKey="category"
            label="ประเภทธุรกิจ"
            value={business.category}
            editingKey={editingKey}
            onEdit={setEditingKey}
            onSave={saveEditing}
            onChange={updateBusiness}
          />
          <EditableField
            fieldKey="budget"
            label="งบโฆษณาต่อเดือน"
            value={business.budget}
            editingKey={editingKey}
            onEdit={setEditingKey}
            onSave={saveEditing}
            onChange={updateBusiness}
          />
          <EditableField
            fieldKey="location"
            label="ทำเลที่ตั้ง"
            value={business.location}
            editingKey={editingKey}
            onEdit={setEditingKey}
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
            onEdit={setEditingKey}
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
            onEdit={setEditingKey}
            onSave={saveEditing}
            onChange={updateBusiness}
          />
        </div>
      </div>

      <div className="h-10 w-full shrink-0" />
    </div>
  )
}

export default Account
