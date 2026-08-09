import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthBrandPanel from '@/components/authBrandPanel'
import AuthSocialButtons from '@/components/authSocialButtons'

function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const navigate = useNavigate()
  // TODO: wire up to the auth API once a client is available
  const handleSubmit = (event: FormEvent) => {
    navigate('/onboarding')
    event.preventDefault()
  }

  return (
    <div className="flex min-h-screen w-full">
      <AuthBrandPanel
        title={
          <>
            <p>เริ่มต้นให้ AI</p>
            <p>ดูแลโฆษณาของคุณ</p>
          </>
        }
        description="สมัครฟรี ไม่มีค่าใช้จ่าย — ตั้งแคมเปญแรกได้ภายใน 5 นาที พร้อมผู้ช่วย AI ที่ดูแลยอดขายให้คุณ 24 ชั่วโมง"
      />
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 md:px-8 lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-xl flex-col items-start gap-6"
        >
          <p className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            สร้างบัญชีใหม่
          </p>
          <p className="font-thai text-lg text-[#8E98A8]">
            เริ่มต้นใช้งาน ClickDee ฟรี ไม่ต้องใช้บัตรเครดิต
          </p>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="signup-email"
              className="font-thai text-amalfidark text-base font-medium"
            >
              อีเมล
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="font-thai border-amalfilight-hover text-amalfidark focus:border-amalfi h-15 w-full rounded-xl border-[1.5px] px-5 text-base placeholder:text-[#8E98A8] focus:outline-none"
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="signup-password"
              className="font-thai text-amalfidark text-base font-medium"
            >
              รหัสผ่าน
            </label>
            <div className="border-amalfilight-hover focus-within:border-amalfi flex h-15 w-full items-center rounded-xl border-[1.5px] px-5">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="font-thai text-amalfidark flex-1 text-base placeholder:text-[#8E98A8] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="text-[#8E98A8] hover:text-[#6B7280]"
              >
                {showPassword ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="signup-confirm-password"
              className="font-thai text-amalfidark text-base font-medium"
            >
              ยืนยันรหัสผ่าน
            </label>
            <div className="border-amalfilight-hover focus-within:border-amalfi flex h-15 w-full items-center rounded-xl border-[1.5px] px-5">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="font-thai text-amalfidark flex-1 text-base placeholder:text-[#8E98A8] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((show) => !show)}
                aria-label={
                  showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'
                }
                className="text-[#8E98A8] hover:text-[#6B7280]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          <label className="flex w-full items-center gap-2.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="accent-amalfi border-amalfilight-hover h-5 w-5 shrink-0 rounded hover:cursor-pointer"
            />
            <span className="font-thai text-sm text-[#8E98A8]">
              ฉันยอมรับข้อกำหนดการใช้งาน และนโยบายความเป็นส่วนตัว
            </span>
          </label>

          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-16 w-full items-center justify-center rounded-2xl text-lg font-bold transition-all duration-200 hover:scale-105 hover:cursor-pointer"
          >
            สมัครสมาชิก
          </button>

          <AuthSocialButtons />

          <div className="font-thai flex w-full items-center justify-center gap-1 text-base">
            <p className="text-[#8E98A8]">มีบัญชีอยู่แล้ว?</p>
            <Link
              to="/login"
              className="text-amalfi font-semibold hover:cursor-pointer hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp
