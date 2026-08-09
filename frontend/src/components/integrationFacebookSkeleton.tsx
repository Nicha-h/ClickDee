import { Skeleton } from '@/components/skeleton'

function IntegrationFacebookSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-4 h-9 w-56" />

      <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="h-7 w-40" />
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#F0ECF7] py-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="flex items-center justify-between py-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="h-7 w-32" />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default IntegrationFacebookSkeleton
