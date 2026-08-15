import type { ComponentType } from 'react'
import {
  Coffee,
  Shirt,
  Sparkles,
  Home,
  Briefcase,
  Star,
  Sprout,
  User,
  Handshake,
  Coins,
  Banknote,
  Wallet,
  Trophy,
  ShoppingCart,
  Users,
  Megaphone,
  Heart,
} from 'lucide-react'
import facebookIcon from '@/assets/logos/facebook.svg'
import instagramIcon from '@/assets/logos/instagram.svg'
import googleIcon from '@/assets/logos/google-icon.svg'
import TiktokIcon from '@/components/tiktokIcon'

export type OnboardingChoice = {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  iconSrc?: string
  other?: boolean
  comingSoon?: boolean
  defaultSelected?: boolean
}

export type FillInStepConfig = {
  type: 'fill-in'
  id: string
  question: string
  subtext: string
  placeholder: string
  multiline?: boolean
  required?: boolean
  summaryLabel: string
}

export type ChoiceStepConfig = {
  type: 'choice'
  id: string
  question: string
  subtext: string
  multiple?: boolean
  choices: OnboardingChoice[]
  summaryLabel: string
}

export type OnboardingStepConfig = FillInStepConfig | ChoiceStepConfig

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    type: 'fill-in',
    id: 'businessName',
    question: 'ธุรกิจของคุณชื่ออะไร?',
    subtext: 'ชื่อนี้จะถูกใช้ในแคมเปญและหน้าระบบของคุณ',
    placeholder: 'เช่น ร้านกาแฟบ้านสวน',
    summaryLabel: 'ชื่อธุรกิจ',
  },
  {
    type: 'fill-in',
    id: 'location',
    question: 'ทำเลที่ตั้ง / พื้นที่ให้บริการของคุณอยู่ที่ไหน?',
    subtext: 'ช่วยให้ AI กำหนดกลุ่มเป้าหมายตามพื้นที่ได้แม่นยำขึ้น',
    placeholder: 'เช่น ย่านสีลม กรุงเทพฯ หรือ ให้บริการทั่วกรุงเทพฯ',
    summaryLabel: 'ทำเลที่ตั้ง / พื้นที่ให้บริการ',
  },
  {
    type: 'choice',
    id: 'category',
    question: 'ธุรกิจของคุณอยู่ในกลุ่มไหน?',
    subtext:
      'เลือกกลุ่มที่ใกล้เคียงที่สุด เพื่อให้ AI ช่วยแนะนำแคมเปญได้ตรงจุด',
    summaryLabel: 'กลุ่มธุรกิจ',
    choices: [
      { id: 'cafe', label: 'คาเฟ่ / ร้านอาหาร', icon: Coffee },
      { id: 'fashion', label: 'แฟชั่น / เสื้อผ้า', icon: Shirt },
      { id: 'beauty', label: 'ความงาม / สกินแคร์', icon: Sparkles },
      { id: 'realestate', label: 'อสังหาริมทรัพย์', icon: Home },
      { id: 'services', label: 'บริการ / ที่ปรึกษา', icon: Briefcase },
      { id: 'other', label: 'อื่นๆ', icon: Star, other: true },
    ],
  },
  {
    type: 'choice',
    id: 'adExperience',
    question: 'คุณเคยยิงแอดมาก่อนหรือไม่?',
    subtext: 'บอกเราหน่อย เพื่อปรับคำแนะนำให้เหมาะกับประสบการณ์ของคุณ',
    summaryLabel: 'ประสบการณ์ยิงแอด',
    choices: [
      { id: 'never', label: 'ไม่เคยเลย', icon: Sprout },
      { id: 'self', label: 'เคยลองด้วยตัวเอง', icon: User },
      { id: 'agency', label: 'มีทีม/เอเจนซี่ดูแลอยู่แล้ว', icon: Handshake },
    ],
  },
  {
    type: 'choice',
    id: 'budget',
    question: 'งบโฆษณาต่อเดือนโดยประมาณ?',
    subtext: 'ช่วยให้ AI วางแผนงบให้เหมาะกับเป้าหมายของคุณ',
    summaryLabel: 'งบโฆษณาแนะนำ',
    choices: [
      { id: 'under5k', label: 'ต่ำกว่า 5,000 บาท', icon: Coins },
      { id: '5k-20k', label: '5,000–20,000 บาท', icon: Banknote },
      { id: '20k-100k', label: '20,000–100,000 บาท', icon: Wallet },
      { id: 'over100k', label: 'มากกว่า 100,000 บาท', icon: Trophy },
    ],
  },
  {
    type: 'choice',
    id: 'goal',
    question: 'เป้าหมายหลักที่อยากได้จากแคมเปญ?',
    subtext: 'AI จะปรับกลยุทธ์แคมเปญให้ตรงกับเป้าหมายนี้',
    summaryLabel: 'เป้าหมายหลัก',
    choices: [
      { id: 'sales', label: 'ยอดขาย/ยอดสั่งซื้อ', icon: ShoppingCart },
      { id: 'visits', label: 'ลูกค้าเข้าร้าน/ทักแชท', icon: Users },
      { id: 'awareness', label: 'การรับรู้แบรนด์', icon: Megaphone },
      { id: 'engagement', label: 'ผู้ติดตาม/เอนเกจเมนต์', icon: Heart },
    ],
  },
  {
    type: 'fill-in',
    id: 'signatureProduct',
    question: 'จุดขายหรือบริการเด่นของธุรกิจคุณคืออะไร?',
    subtext: 'AI จะใช้จุดเด่นนี้ช่วยเขียนแคปชั่นและครีเอทีฟโฆษณาให้คุณ',
    placeholder: 'เช่น ลาเต้เย็นสูตรพิเศษ, เค้กกล้วยหอมโฮมเมด',
    multiline: true,
    summaryLabel: 'สินค้า/เมนูเด่น/บริการ',
  },
  {
    type: 'choice',
    id: 'platforms',
    question: 'แพลตฟอร์มที่คุณสนใจใช้ยิงแอด?',
    subtext: 'เลือกได้มากกว่า 1 แพลตฟอร์ม — ClickDee จะเชื่อมต่อให้อัตโนมัติ',
    multiple: true,
    summaryLabel: 'แพลตฟอร์มที่เชื่อมต่อ',
    choices: [
      {
        id: 'facebook',
        label: 'Facebook',
        iconSrc: facebookIcon,
        defaultSelected: true,
      },
      {
        id: 'instagram',
        label: 'Instagram',
        iconSrc: instagramIcon,
        comingSoon: true,
      },
      { id: 'tiktok', label: 'TikTok', icon: TiktokIcon, comingSoon: true },
      {
        id: 'googleAds',
        label: 'Google Ads',
        iconSrc: googleIcon,
        comingSoon: true,
      },
    ],
  },
]
