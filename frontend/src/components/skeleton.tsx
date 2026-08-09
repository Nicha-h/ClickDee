export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-amalfilight-active animate-[shimmer_1.3s_ease-in-out_infinite] rounded-md ${className}`}
    />
  )
}
