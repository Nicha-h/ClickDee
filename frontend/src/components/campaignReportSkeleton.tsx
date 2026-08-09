import { Skeleton } from '@/components/skeleton'

function MetricCardSkeleton() {
  return (
    <div className="w-64 rounded-xl border border-[#8E98A8] bg-white p-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-3 h-5 w-32" />
    </div>
  )
}

function CampaignReportSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      <div className="mt-6 flex flex-row gap-5">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-3 h-5.5 w-full rounded-xl" />
          <div className="mt-2 flex flex-row justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="w-96 rounded-xl bg-white p-5">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>

      <div className="border-seadark bg-sealight mt-6 rounded-xl border p-6">
        <Skeleton className="h-6 w-56" />
        <div className="mt-4 flex flex-row gap-4">
          <Skeleton className="h-16 flex-1 rounded-xl" />
          <Skeleton className="h-16 flex-1 rounded-xl" />
        </div>
      </div>

      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-4 h-56 w-full" />
        </div>
        <div className="w-96 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-4 aspect-square w-full max-w-56 rounded-full" />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="h-7 w-48" />
        <div className="mt-5 flex flex-row gap-5">
          <Skeleton className="h-69 w-57 rounded-xl" />
          <Skeleton className="h-69 w-57 rounded-xl" />
          <Skeleton className="h-69 w-57 rounded-xl" />
        </div>
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default CampaignReportSkeleton
