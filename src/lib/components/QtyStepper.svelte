<script lang="ts">
  // Thumb-first quantity control: big −/+ targets, numeric keypad on tap,
  // nonzero values highlighted so they're scannable in daylight.
  let {
    value = 0,
    onchange,
    label = '',
  }: { value?: number; onchange: (v: number) => void; label?: string } = $props();

  function set(v: number) {
    onchange(Math.max(0, Math.min(999, Math.round(v) || 0)));
  }
</script>

<div class="flex items-center gap-1">
  <button
    type="button"
    aria-label="Fewer {label}"
    onclick={() => set(value - 1)}
    disabled={value <= 0}
    class="h-10 w-10 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 text-lg leading-none hover:bg-gray-50 disabled:opacity-30 select-none"
  >−</button>
  <input
    type="number"
    inputmode="numeric"
    min="0"
    max="999"
    value={value || 0}
    oninput={(e) => set(parseInt((e.target as HTMLInputElement).value) || 0)}
    aria-label={label}
    class="w-11 h-10 sm:h-8 shrink-0 rounded-lg border text-center text-sm outline-none {value > 0
      ? 'border-blue-300 bg-blue-50 font-semibold text-blue-900'
      : 'border-gray-200 text-gray-700'}"
  />
  <button
    type="button"
    aria-label="More {label}"
    onclick={() => set(value + 1)}
    class="h-10 w-10 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 text-lg leading-none hover:bg-gray-50 select-none"
  >+</button>
</div>
