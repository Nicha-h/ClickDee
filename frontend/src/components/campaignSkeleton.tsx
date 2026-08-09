import { Skeleton } from '@/components/skeleton'

function StatTileSkeleton() {
  return (
    <div className="h-45 w-85 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
      <div className="flex flex-row items-center gap-2 p-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="px-4">
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="px-4">
        <Skeleton className="mt-3 h-5 w-36" />
      </div>
    </div>
  )
}

function CampaignCardSkeleton() {
  return (
    <div className="flex shrink-0 flex-row overflow-hidden rounded-xl border border-[#8E98A8]">
      <Skeleton className="h-62 w-40 shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-row items-start justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="flex flex-row gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-2 grid flex-1 grid-cols-5 gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
      <div className="flex w-45 shrink-0 flex-col items-end justify-between border-l border-[#D9D9D9] p-5">
        <Skeleton className="h-9 w-28 rounded-[19px]" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  )
}

function CampaignSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-125" />
      </div>

      <div className="mt-6">
        <Skeleton className="h-19 w-64 rounded-[19px]" />
      </div>

      <div className="mt-8 flex flex-row items-stretch gap-5">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <div className="mt-8 flex flex-row items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-[19px]" />
        <Skeleton className="h-10 w-32 rounded-[19px]" />
        <Skeleton className="h-10 w-32 rounded-[19px]" />
        <Skeleton className="h-10 w-28 rounded-[19px]" />
      </div>
      <Skeleton className="mt-4 h-12 w-full rounded-[19px]" />

      <div className="mt-8 flex flex-col gap-6">
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default CampaignSkeleton
