type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-9.5 w-21 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-seadark' : 'bg-[#8E98A8]/40'
      }`}
    >
      <span
        className={`absolute top-1 left-1 size-7.5 rounded-full bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] transition-transform ${
          checked ? 'translate-x-11.5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default Toggle
