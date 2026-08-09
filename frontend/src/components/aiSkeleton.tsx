import { Skeleton } from '@/components/skeleton'

function AiBubbleSkeleton() {
  return (
    <div className="flex flex-row items-start gap-3">
      <Skeleton className="h-15 w-15 shrink-0 rounded-full" />
      <Skeleton className="h-20 w-xl rounded-tr-xl rounded-br-xl rounded-bl-xl" />
    </div>
  )
}

function UserBubbleSkeleton() {
  return (
    <div className="flex flex-row items-start justify-end gap-3">
      <Skeleton className="h-14 w-md rounded-tl-xl rounded-br-xl rounded-bl-xl" />
      <Skeleton className="h-15 w-15 shrink-0 rounded-full" />
    </div>
  )
}

function AiSkeleton() {
  return (
    <div className="flex h-[calc(100vh-5rem)] min-w-full flex-col py-10">
      <Skeleton className="h-9 w-40" />

      <div className="mt-6 flex min-h-0 flex-1 flex-row items-stretch gap-0">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 pr-6">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2">
            <AiBubbleSkeleton />
            <UserBubbleSkeleton />
            <AiBubbleSkeleton />
          </div>
          <Skeleton className="mt-2 mb-2 h-14 w-full shrink-0 rounded-full" />
        </div>

        <div className="bg-citrus-light-active w-105 shrink-0 rounded-[10px] p-6">
          <Skeleton className="h-8 w-40" />
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-16 w-full rounded-[10px]" />
            <Skeleton className="h-16 w-full rounded-[10px]" />
            <Skeleton className="h-16 w-full rounded-[10px]" />
            <Skeleton className="h-16 w-full rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiSkeleton
