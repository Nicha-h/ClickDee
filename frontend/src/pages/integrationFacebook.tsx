import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import connectIcon from '@/assets/icons/connect-icon.svg'
import disconnectIcon from '@/assets/icons/disconnect-icon.svg'
import account from '@/assets/icons/account.svg'
import Toggle from '@/components/toggle'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import IntegrationFacebookSkeleton from '@/components/integrationFacebookSkeleton'

type SyncedPage = { id: string; name: string; isSynced: boolean }
type AdAccount = {
  id: string
  name: string
  status: string
  currency: string
  isActive: boolean
}

const connectionInfo = {
  accountName: 'Facebook Businesss',
  accountHandle: 'LuLu Cafe',
  lastSyncAt: '15 May 2026 12:59 PM',
}

const initialSyncedPages: SyncedPage[] = [
  { id: 'page-chompon', name: 'LuLu Cafe - Chompon', isSynced: true },
  { id: 'page-bangkok', name: 'LuLu Cafe - Bangkok', isSynced: true },
]

const initialAdAccount: AdAccount = {
  id: 'ad-luluads',
  name: 'LuluAds',
  status: 'ใช้งานอยู่',
  currency: 'THB',
  isActive: true,
}

function IntegrationFacebook() {
  const [syncedPages, setSyncedPages] = useState(initialSyncedPages)
  const [adAccount, setAdAccount] = useState(initialAdAccount)
  const isLoading = useSimulatedLoading()

  const toggleSyncedPage = (id: string, isSynced: boolean) => {
    setSyncedPages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, isSynced } : page)),
    )
  }

  if (isLoading) return <IntegrationFacebookSkeleton />

  return (
    <div className="min-h-full min-w-full py-10">
      <Link
        to="/integration"
        className="font-thai text-amalfidark hover:text-amalfidarker flex w-fit items-center gap-1 text-2xl font-medium"
      >
        <ChevronLeft className="h-9 w-9" />
        กลับไปหน้า การเชื่อมต่อ
      </Link>

      <h1 className="font-thai text-amalfidark mt-4 text-2xl font-bold sm:text-3xl lg:text-4xl">
        การเชื่อมต่อ Facebook
      </h1>
      <p className="font-thai mt-4 max-w-263.75 text-xl text-black">
        จัดการการเชื่อมต่อ Facebook ที่ใช้งานอยู่และการซิงโครไนซ์ข้อมูลอัตโนมัติ
      </p>

      <div className="mt-6 flex flex-col items-start gap-10 md:flex-row">
        {/** Connection summary */}
        <div className="flex min-h-116 w-full shrink-0 flex-col rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] md:w-64 lg:w-88">
          <div className="flex items-start justify-between">
            <div className="bg-citrus flex h-16 w-16 items-center justify-center rounded-xl">
              <img src={connectIcon} alt="" className="h-9 w-9" />
            </div>
            <span className="font-thai rounded-full bg-[#caf3d0] px-3 py-1 text-base font-semibold text-[#519b5c]">
              เชื่อมต่อแล้ว
            </span>
          </div>
          <p className="font-eng text-amalfidark mt-4 text-xl font-bold">
            {connectionInfo.accountName}
          </p>
          <p className="font-thai mt-1 text-2xl font-semibold text-black">
            บัญชี: {connectionInfo.accountHandle}
          </p>

          <div className="mt-auto flex flex-col gap-1 border-t border-[#8E98A8] pt-4">
            <p className="font-thai text-base font-semibold text-[#8e98a8]">
              Last sync (ซิงค์ล่าสุด)
            </p>
            <p className="font-thai text-base font-semibold text-[#8e98a8]">
              {connectionInfo.lastSyncAt}
            </p>
          </div>
        </div>

        {/** Synced pages + ad account */}
        <div className="flex flex-1 flex-col gap-8">
          <div className="rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              เพจที่ซิงค์
            </h3>
            <p className="font-thai mt-1 text-base text-black">
              เลือกเพจเพื่อติดตามสำหรับการวิเคราะห์ลูกค้ามุ่งหวัง (Lead) ด้วย AI
            </p>
            <div className="mt-4 flex flex-col divide-y divide-[#8E98A8]/30">
              {syncedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-citrus flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-lg">
                      <img src={connectIcon} alt="" className="h-7.5 w-7.5" />
                    </div>
                    <p className="font-thai text-amalfidark text-lg font-semibold">
                      {page.name}
                    </p>
                  </div>
                  <Toggle
                    checked={page.isSynced}
                    onChange={(checked) => toggleSyncedPage(page.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              บัญชีโฆษณา
            </h3>
            <p className="font-thai mt-1 text-base text-black">
              เลือกบัญชีที่ใช้งานอยู่สำหรับการจัดการแคมเปญ
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-citrus flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-lg">
                  <img src={account} alt="" className="h-7.5 w-7.5" />
                </div>
                <div>
                  <p className="font-eng text-amalfidark text-lg font-semibold">
                    {adAccount.name}
                  </p>
                  <p className="font-thai text-lg text-black">
                    สถานะ: {adAccount.status} | สกุลเงิน: {adAccount.currency}
                  </p>
                </div>
              </div>
              <Toggle
                checked={adAccount.isActive}
                onChange={(checked) =>
                  setAdAccount((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border-3 border-dashed border-[#ff004f] bg-[#ffe6e6] p-6 sm:flex-row sm:items-center">
        <p className="font-thai max-w-3xl text-lg font-medium text-[#ff2629]">
          การยกเลิกการเชื่อมต่อจะหยุดแคมเปญที่ใช้งานอยู่และระบบอัตโนมัติของ AI
          ทั้งหมดทันที
        </p>
        <button
          type="button"
          className="font-eng flex shrink-0 items-center gap-2 rounded-xl bg-[#c85050] px-6 py-3 text-lg font-medium text-white"
        >
          <img src={disconnectIcon} alt="" className="h-5 w-5" />
          Disconnect Account
        </button>
      </div>

      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default IntegrationFacebook
