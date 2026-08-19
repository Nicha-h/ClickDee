import facebook from '@/assets/logos/facebook.svg'
import campaignRainPromo from '@/assets/placeholders/campaign-rain-promo.png'
import campaignMiloPromo from '@/assets/placeholders/campaign-milo-promo.jpg'
import campaignLattePromo from '@/assets/placeholders/campaign-latte-promo.jpg'
import campaignReportCreative1 from '@/assets/placeholders/campaign-report-creative-1.jpg'
import campaignReportCreative2 from '@/assets/placeholders/campaign-report-creative-2.jpg'
import campaignReportCreative3 from '@/assets/placeholders/campaign-report-creative-3.jpg'

export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type Platform = 'facebook'

export type Creative = {
  image: string
  rank: 1 | 2 | 3
  badgeBorderColor: string
  caption: string
  impressions: number
  ctr: number
}

export type ChannelReach = {
  platform: Platform
  reach: number
}

export type DailyTrendPoint = {
  date: string
  reach: number
  spend: number
}

export type CampaignItem = {
  id: string
  thumbnail: string
  title: string
  goal: string
  status: CampaignStatus
  /** Real campaigns fetched from the backend, vs. the static demo data below. */
  source?: 'mock' | 'api'
  daysRemaining: number
  platforms: Platform[]
  reach: number
  clicks: number
  orders: number
  cpa: number
  roi: number
  /** Report-page-only PLACEHOLDER fields */
  adSpend: number
  budgetSpent: number
  budgetTotal: number
  dailyAvgSpend: number
  roiBenchmark: number
  insights: [string, string, string]
  dailyTrend: DailyTrendPoint[]
  channelReach: ChannelReach[]
  creatives: Creative[]
}

{
  /** Campaign list PLACEHOLDER*/
}
export const campaigns: CampaignItem[] = [
  {
    id: 'rain-promo-2026',
    thumbnail: campaignRainPromo,
    title: 'โปรหน้าฝน 2026 ลด 20%',
    goal: 'เป้าหมาย: เพิ่มยอดขาย',
    status: 'active',
    daysRemaining: 5,
    platforms: ['facebook'],
    reach: 28400,
    clicks: 1842,
    orders: 312,
    cpa: 14.4,
    roi: 11.5,
    adSpend: 12400,
    budgetSpent: 3120,
    budgetTotal: 6000,
    dailyAvgSpend: 125,
    roiBenchmark: 3.2,
    insights: [
      'ROI 11.5x สูงกว่าค่าเฉลี่ยร้านของคุณ — แนะนำให้เพิ่มงบอีก ฿1,000 เพื่อขยายผล',
      'งบเหลือ 48% AI กำลังจัดสรรอย่างมีประสิทธิภาพ',
      'ครีเอทีฟ #2 มี Engagement สูงกว่าใบอื่น 28% — AI กำลังเพิ่มสัดส่วนการแสดงผลให้อัตโนมัติ',
    ],
    dailyTrend: [
      { date: '5 พ.ค.', reach: 2800, spend: 380 },
      { date: '6 พ.ค.', reach: 3200, spend: 410 },
      { date: '7 พ.ค.', reach: 3550, spend: 430 },
      { date: '8 พ.ค.', reach: 3900, spend: 460 },
      { date: '9 พ.ค.', reach: 4300, spend: 470 },
      { date: '10 พ.ค.', reach: 4750, spend: 480 },
      { date: '11 พ.ค.', reach: 5100, spend: 490 },
    ],
    channelReach: [{ platform: 'facebook', reach: 18000 }],
    creatives: [
      {
        image: campaignReportCreative1,
        rank: 1,
        badgeBorderColor: '#477099',
        caption: 'ฝนตก หนาวๆ คู่ที่ดีที่สุดคือลาเต้กับครัวซองต์',
        impressions: 12780,
        ctr: 7.65,
      },
      {
        image: campaignReportCreative2,
        rank: 2,
        badgeBorderColor: '#7f66ba',
        caption: 'ดีลคู่ฝน ลด 25% ทั้งสองเมนู',
        impressions: 9088,
        ctr: 6.22,
      },
      {
        image: campaignReportCreative3,
        rank: 3,
        badgeBorderColor: '#7f66ba',
        caption: 'เซ็ตคู่ฮิต ☕ + 🍰 ลด 20%',
        impressions: 6532,
        ctr: 5.31,
      },
    ],
  },
  {
    id: 'milo-promo-2026',
    thumbnail: campaignMiloPromo,
    title: 'โปรไมโล 2026 ลด 60%',
    goal: 'เป้าหมาย: ระบายสต็อก',
    status: 'paused',
    daysRemaining: 5,
    platforms: ['facebook'],
    reach: 64200,
    clicks: 4910,
    orders: 842,
    cpa: 8.6,
    roi: 18.2,
    adSpend: 7250,
    budgetSpent: 7250,
    budgetTotal: 8000,
    dailyAvgSpend: 145,
    roiBenchmark: 3.2,
    insights: [
      'ROI 18.2x สูงกว่าค่าเฉลี่ยร้านของคุณมาก — แนะนำให้เพิ่มงบเพื่อขยายผลก่อนแคมเปญสิ้นสุด',
      'งบเหลือ 9% ใกล้หมด AI แนะนำให้ตัดสินใจเติมงบหรือปิดแคมเปญเร็วๆ นี้',
      'ครีเอทีฟ #1 มี Engagement สูงกว่าใบอื่น 40% — AI กำลังเพิ่มสัดส่วนการแสดงผลให้อัตโนมัติ',
    ],
    dailyTrend: [
      { date: '5 พ.ค.', reach: 6200, spend: 700 },
      { date: '6 พ.ค.', reach: 8100, spend: 950 },
      { date: '7 พ.ค.', reach: 9800, spend: 1150 },
      { date: '8 พ.ค.', reach: 11400, spend: 1300 },
      { date: '9 พ.ค.', reach: 9600, spend: 1200 },
      { date: '10 พ.ค.', reach: 8700, spend: 1000 },
      { date: '11 พ.ค.', reach: 8100, spend: 950 },
    ],
    channelReach: [{ platform: 'facebook', reach: 27700 }],
    creatives: [
      {
        image: campaignReportCreative2,
        rank: 1,
        badgeBorderColor: '#477099',
        caption: 'ไมโลปั่นเย็นฉ่ำ ลด 60% วันนี้เท่านั้น',
        impressions: 15420,
        ctr: 8.92,
      },
      {
        image: campaignReportCreative3,
        rank: 2,
        badgeBorderColor: '#7f66ba',
        caption: 'เซ็ตคู่ไมโล + ขนม ลด 30%',
        impressions: 10210,
        ctr: 6.48,
      },
      {
        image: campaignReportCreative1,
        rank: 3,
        badgeBorderColor: '#7f66ba',
        caption: 'ไมโลร้อนรับลมหนาว ลด 20%',
        impressions: 7340,
        ctr: 5.02,
      },
    ],
  },
  {
    id: 'latte-caramel-2026',
    thumbnail: campaignLattePromo,
    title: 'ลาเต้คาราเมล เมนูใหม่',
    goal: 'เป้าหมาย: ทดสอบครีเอทีฟใหม่ (A/B Test)',
    status: 'ended',
    daysRemaining: 5,
    platforms: ['facebook'],
    reach: 64200,
    clicks: 4910,
    orders: 842,
    cpa: 8.6,
    roi: 18.2,
    adSpend: 7250,
    budgetSpent: 7250,
    budgetTotal: 8000,
    dailyAvgSpend: 145,
    roiBenchmark: 3.2,
    insights: [
      'ROI 18.2x สูงกว่าค่าเฉลี่ยร้านของคุณมาก — แนะนำให้เพิ่มงบเพื่อขยายผลก่อนแคมเปญสิ้นสุด',
      'งบเหลือ 9% ใกล้หมด AI แนะนำให้ตัดสินใจเติมงบหรือปิดแคมเปญเร็วๆ นี้',
      'ครีเอทีฟ #1 มี Engagement สูงกว่าใบอื่น 40% — AI กำลังเพิ่มสัดส่วนการแสดงผลให้อัตโนมัติ',
    ],
    dailyTrend: [
      { date: '5 พ.ค.', reach: 7200, spend: 900 },
      { date: '6 พ.ค.', reach: 5400, spend: 650 },
      { date: '7 พ.ค.', reach: 8900, spend: 1150 },
      { date: '8 พ.ค.', reach: 6100, spend: 800 },
      { date: '9 พ.ค.', reach: 9600, spend: 1300 },
      { date: '10 พ.ค.', reach: 7800, spend: 1000 },
      { date: '11 พ.ค.', reach: 10400, spend: 1450 },
    ],
    channelReach: [{ platform: 'facebook', reach: 27700 }],
    creatives: [
      {
        image: campaignReportCreative2,
        rank: 1,
        badgeBorderColor: '#477099',
        caption: 'ไมโลปั่นเย็นฉ่ำ ลด 60% วันนี้เท่านั้น',
        impressions: 15420,
        ctr: 8.92,
      },
      {
        image: campaignReportCreative3,
        rank: 2,
        badgeBorderColor: '#7f66ba',
        caption: 'เซ็ตคู่ไมโล + ขนม ลด 30%',
        impressions: 10210,
        ctr: 6.48,
      },
      {
        image: campaignReportCreative1,
        rank: 3,
        badgeBorderColor: '#7f66ba',
        caption: 'ไมโลร้อนรับลมหนาว ลด 20%',
        impressions: 7340,
        ctr: 5.02,
      },
    ],
  },
]

export const platformBadgeStyles: Record<
  Platform,
  {
    bg: string
    icon: string
    label: string
    textColor: string
    chartColor: string
  }
> = {
  facebook: {
    bg: 'bg-[#72adff]',
    icon: facebook,
    label: 'Facebook',
    textColor: 'text-white',
    chartColor: '#1877F2',
  },
}
