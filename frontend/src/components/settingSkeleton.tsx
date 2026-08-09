import { Skeleton } from '@/components/skeleton'

function PlanCardSkeleton() {
  return (
    <div className="bg-amalfilight min-w-55 flex-1 rounded-2xl p-6">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="mt-3 h-7 w-28" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-5 h-11 w-full rounded-xl" />
    </div>
  )
}

function SettingSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="mt-3 h-6 w-96" />

      <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="mb-5 h-7 w-56" />
        <div className="flex flex-wrap items-stretch gap-5">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="mb-4 h-7 w-40" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#F0ECF7] py-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="mb-5 h-7 w-16" />
        <Skeleton className="h-11 w-full max-w-65 rounded-lg" />
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="mb-5 h-7 w-16" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="h-10 w-full shrink-0" />
    </div>
  )
}

export default SettingSkeleton
