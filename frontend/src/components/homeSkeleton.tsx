import { Skeleton } from '@/components/skeleton'

function StatTileSkeleton() {
  return (
    <div className="h-45 w-75 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
      <div className="flex flex-row items-center gap-2 p-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="px-4">
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="px-4">
        <Skeleton className="mt-3 h-5 w-32" />
      </div>
    </div>
  )
}

function RunningCampaignRowSkeleton() {
  return (
    <div className="flex h-60 w-full flex-row items-center gap-4 rounded-xl border-2 border-[#8E98A8] px-6 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
      <Skeleton className="h-15 w-15 shrink-0 rounded-2xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="ml-auto h-15 w-50" />
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="min-h-full w-full py-10">
      <div className="flex w-7xl flex-row items-center justify-between gap-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-6 w-125" />
        </div>
        <Skeleton className="h-19 w-64 shrink-0 rounded-[19px]" />
      </div>

      <Skeleton className="mt-10 h-60 w-7xl rounded-xl" />

      <div className="mt-10 flex h-45 w-7xl flex-row items-center justify-between gap-5">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <div className="mt-10 flex flex-row items-start gap-5">
        <div className="flex w-3xl flex-col gap-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between p-4">
              <Skeleton className="h-8 w-56" />
            </div>
            <RunningCampaignRowSkeleton />
            <RunningCampaignRowSkeleton />
          </div>

          <div className="mt-3 w-full rounded-xl border-2 border-[#8E98A8] px-10 py-6 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-5 w-32" />
            <Skeleton className="mt-4 h-48 w-full" />
          </div>

          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-5 w-full max-w-md" />
            <Skeleton className="mt-4 h-18 w-58 rounded-[10px]" />
          </div>
        </div>

        <div className="flex w-150 flex-col gap-5">
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <div className="flex flex-row items-center gap-3">
              <Skeleton className="h-13 w-13 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-[10px]" />
              <Skeleton className="h-24 w-full rounded-[10px]" />
            </div>
          </div>

          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 pb-8 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-6 w-full" />
            <div className="mt-4 flex justify-end">
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default HomeSkeleton
