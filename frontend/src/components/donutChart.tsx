export type DonutSegment = {
  key: string
  label: string
  value: number
  color: string
}

function DonutChart({
  segments,
  centerLabel,
  centerSublabel,
}: {
  segments: DonutSegment[]
  centerLabel: string
  centerSublabel: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const arcs = segments.reduce<
    { color: string; startDeg: number; endDeg: number }[]
  >((acc, s) => {
    const startDeg = acc.length > 0 ? acc[acc.length - 1].endDeg : 0
    const endDeg = startDeg + (s.value / total) * 360
    acc.push({ color: s.color, startDeg, endDeg })
    return acc
  }, [])
  const gradientStops = arcs
    .map((a) => `${a.color} ${a.startDeg}deg ${a.endDeg}deg`)
    .join(', ')

  return (
    <div className="mt-4 flex w-full flex-col items-center gap-5">
      <div
        className="relative aspect-square w-full max-w-56 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full bg-white text-center">
          <p className="text-3xl font-bold text-black">{centerLabel}</p>
          <p className="font-thai text-base text-black">{centerSublabel}</p>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-start justify-around gap-x-2 gap-y-4">
        {segments.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <p className="font-thai text-lg font-semibold text-black">
                {s.label}
              </p>
            </div>
            <p className="text-base text-[#8E98A8]">
              {s.value.toLocaleString()}
            </p>
            <p className="text-lg font-bold text-black">
              {Math.round((s.value / total) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart
