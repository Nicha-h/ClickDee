import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthBrandPanel from '@/components/authBrandPanel'
import AuthSocialButtons from '@/components/authSocialButtons'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent) => {
    navigate('/home')
    event.preventDefault()
  }

  return (
    <div className="flex min-h-screen w-full">
      <AuthBrandPanel
        title={
          <>
            <p>ยินดีต้อนรับกลับมา</p>
            <p>อีกครั้ง</p>
          </>
        }
        description="เข้าสู่ระบบเพื่อดูภาพรวมแคมเปญ ยอดขาย และให้ AI ดูแลโฆษณาต่อจากที่ค้างไว้"
      />
      <div className="flex w-full flex-1 items-center justify-center px-4 md:px-8 lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-xl flex-col items-start gap-6"
        >
          <p className="font-thai text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            เข้าสู่ระบบ
          </p>
          <p className="font-thai text-lg text-[#8E98A8]">
            กรอกข้อมูลเพื่อเข้าสู่บัญชี ClickDee ของคุณ
          </p>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="login-email"
              className="font-thai text-amalfidark text-base font-medium"
            >
              อีเมล
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="font-thai border-amalfilight-hover text-amalfidark focus:border-amalfi h-15 w-full rounded-xl border-[1.5px] px-5 text-base placeholder:text-[#8E98A8] focus:outline-none"
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="login-password"
              className="font-thai text-amalfidark text-base font-medium"
            >
              รหัสผ่าน
            </label>
            <div className="border-amalfilight-hover focus-within:border-amalfi flex h-15 w-full items-center rounded-xl border-[1.5px] px-5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="กรอกรหัสผ่านของคุณ"
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

          <div className="flex w-full items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="accent-amalfi border-amalfilight-hover h-5 w-5 rounded hover:cursor-pointer"
              />
              <span className="font-thai text-sm text-[#8E98A8] hover:cursor-pointer hover:text-[#6B7280]">
                จดจำฉันไว้
              </span>
            </label>
            <p className="font-thai text-amalfi text-sm font-medium hover:cursor-pointer hover:underline">
              ลืมรหัสผ่าน?
            </p>
          </div>

          <button
            type="submit"
            onClick={() => handleSubmit}
            className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-16 w-full items-center justify-center rounded-2xl text-lg font-bold transition-all duration-200 hover:scale-105 hover:cursor-pointer"
          >
            เข้าสู่ระบบ
          </button>

          <AuthSocialButtons />

          <div className="font-thai flex w-full items-center justify-center gap-1 text-base">
            <p className="text-[#8E98A8]">ยังไม่มีบัญชี?</p>
            <Link
              to="/signup"
              className="text-amalfi font-semibold hover:cursor-pointer hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
