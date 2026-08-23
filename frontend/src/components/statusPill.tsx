export type PillStyle = {
  bg: string
  textColor: string
  dotColor: string
  label: string
}

function StatusPill({ style }: { style: PillStyle }) {
  return (
    <span
      className={`font-thai flex items-center gap-1 rounded-full px-3 py-1 text-base font-medium ${style.bg} ${style.textColor}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dotColor}`} />
      {style.label}
    </span>
  )
}

export default StatusPill
