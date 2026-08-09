import { Skeleton } from '@/components/skeleton'

function StatTileSkeleton() {
  return (
    <div className="w-65 rounded-xl border-2 border-[#8E98A8] px-4 py-1 pb-4 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
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

function DonutSkeleton() {
  return (
    <div className="mt-4 flex w-full flex-col items-center gap-5">
      <Skeleton className="aspect-square w-full max-w-56 rounded-full" />
      <div className="flex w-full flex-wrap items-start justify-around gap-x-2 gap-y-4">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-96" />
      </div>

      <div className="mt-4 flex flex-row items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-[15px]" />
        <Skeleton className="h-9 w-28 rounded-[15px]" />
        <Skeleton className="h-9 w-24 rounded-[15px]" />
        <Skeleton className="h-9 w-20 rounded-[15px]" />
      </div>

      <div className="mt-6 flex flex-row items-stretch gap-5">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-5 w-56" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="w-96 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <DonutSkeleton />
        </div>
      </div>

      <div className="border-seadark-hover bg-sealight mt-6 rounded-[10px] border p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-5 w-56" />
        <div className="mt-4 flex flex-row gap-4">
          <Skeleton className="h-20 flex-1 rounded-xl" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      </div>

      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-48" />
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
        <div className="w-108 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <DonutSkeleton />
        </div>
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default OverviewSkeleton
