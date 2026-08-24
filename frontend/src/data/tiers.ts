export type TierKey = 'freemium' | 'starter' | 'pro'
export type ResetPeriod = 'monthly' | 'lifetime'

export type TierQuota = {
  adsCreated: number
  consultantQuestions: number
  aiImageCreation: number
  aiVideoCreation: number
}

export type TierConfig = {
  key: TierKey
  name: string
  price: string
  desc: string
  quota: TierQuota
  resetPeriod: ResetPeriod
}

export const TIERS: TierConfig[] = [
  {
    key: 'freemium',
    name: 'Freemium',
    price: '0 บาท',
    desc: 'ทดลองใช้งานฟีเจอร์พื้นฐาน',
    quota: {
      adsCreated: 1,
      consultantQuestions: 3,
      aiImageCreation: 2,
      aiVideoCreation: 1,
    },
    resetPeriod: 'lifetime',
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '490 บาท/เดือน',
    desc: 'เหมาะสำหรับเริ่มต้นยิงแอด',
    quota: {
      adsCreated: 6,
      consultantQuestions: 30,
      aiImageCreation: 15,
      aiVideoCreation: 5,
    },
    resetPeriod: 'monthly',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '1,490 บาท/เดือน',
    desc: 'ฟีเจอร์ขั้นสูง + ที่ปรึกษา AI เชิงลึก',
    quota: {
      adsCreated: 20,
      consultantQuestions: 150,
      aiImageCreation: 50,
      aiVideoCreation: 20,
    },
    resetPeriod: 'monthly',
  },
]

export function getTier(key: TierKey): TierConfig {
  const tier = TIERS.find((t) => t.key === key)
  if (!tier) throw new Error(`Unknown tier: ${key}`)
  return tier
}
