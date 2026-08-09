import { Skeleton } from '@/components/skeleton'

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-xl border border-[#E4E1EC] px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className={tall ? 'h-16 w-full' : 'h-6 w-2/3'} />
    </div>
  )
}

function AccountSkeleton() {
  return (
    <div className="min-h-full min-w-full py-10">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-3 h-6 w-96" />

      <div className="mt-8 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="mb-6 flex items-center gap-5">
          <Skeleton className="h-18 w-18 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-[#8E98A8] bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 mb-6 h-5 w-full max-w-lg" />
        <div className="flex flex-col gap-3.5">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton tall />
          <FieldSkeleton tall />
        </div>
      </div>
      <div className="h-10 w-full shrink-0" />
    </div>
  )
}

export default AccountSkeleton
