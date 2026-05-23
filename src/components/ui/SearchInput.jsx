export default function SearchInput({ value, onChange, placeholder, inputRef }) {
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="cm-search w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="cm-hover-text absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-sm font-mono"
        >
          x
        </button>
      )}
    </div>
  )
}
