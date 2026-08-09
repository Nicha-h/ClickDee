import { Skeleton } from '@/components/skeleton'

function IntegrationSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-4 h-6 w-full max-w-263.75" />
      <Skeleton className="mt-2 h-6 w-3/4 max-w-263.75" />

      <div className="relative mt-8 flex min-h-54.75 w-full max-w-247.5 items-center rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-6">
          <Skeleton className="h-31 w-31 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <Skeleton className="absolute top-6 right-6 h-6 w-24" />
        <Skeleton className="absolute right-6 bottom-6 h-12.5 w-32.75 rounded-full" />
      </div>
      <div className="h-24 w-full shrink-0" />
    </div>
  )
}

export default IntegrationSkeleton
