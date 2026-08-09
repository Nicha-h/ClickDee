function DashboardTransitionLoader({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute inset-x-0 top-20 bottom-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="bg-amalfi h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full" />
        <span className="bg-citrus h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full [animation-delay:0.12s]" />
        <span className="bg-sea h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full [animation-delay:0.24s]" />
      </div>
    </div>
  )
}

export default DashboardTransitionLoader
