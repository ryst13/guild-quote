<script lang="ts">
  // Read-only Price Book: every number is computed by the tenant's real
  // pricing engine at their current settings (see lib/server/price-book.ts).
  import type { PriceBook } from '$lib/server/price-book.js';

  let {
    priceBook,
    hadCustomCatalog = false,
    onGoToTab,
  }: {
    priceBook: PriceBook;
    hadCustomCatalog?: boolean;
    onGoToTab?: (tab: 'labor' | 'surcharges' | 'materials') => void;
  } = $props();

  let noteDismissed = $state(false);
  if (typeof localStorage !== 'undefined') {
    noteDismissed = localStorage.getItem('gq-catalog-retired-note') === '1';
  }
  function dismissNote() {
    noteDismissed = true;
    try { localStorage.setItem('gq-catalog-retired-note', '1'); } catch {}
  }

  const fmt = (n: number | null) => (n == null ? '—' : `$${n.toLocaleString()}`);
</script>

{#if hadCustomCatalog && !noteDismissed}
  <div class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start justify-between gap-4">
    <p class="text-sm text-blue-900">
      The old catalog editor has been retired. Your estimate prices were not
      affected — they come from your settings, shown live below.
    </p>
    <button onclick={dismissNote} class="text-blue-400 hover:text-blue-600 text-sm font-bold" aria-label="Dismiss">&times;</button>
  </div>
{/if}

<!-- Baseline assumptions: first thing visible, plain words -->
<div class="mb-6 rounded-xl bg-white border border-gray-200 p-4">
  <p class="text-sm text-gray-700 font-medium">
    These are your current prices. They come from your
    {priceBook.engine === 'bottom_up' ? 'cost-based settings (crew wage and margin)' : 'rate-based settings (price level)'}.
  </p>
  <p class="text-sm text-gray-500 mt-1">
    Room prices are for <strong>walls only, standard prep</strong>. Ceilings,
    doors, windows, and trim add to the price — those are listed below the rooms.
  </p>
</div>

<h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Rooms (walls only)</h2>
<div class="grid gap-3 sm:grid-cols-2 mb-8">
  {#each priceBook.rooms as room}
    <div class="rounded-xl bg-white border border-gray-200 p-4">
      <h3 class="font-semibold text-gray-900 text-sm mb-2">{room.room_type}</h3>
      <div class="space-y-1">
        {#each Object.entries(room.prices) as [size, price]}
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{size}</span>
            <span class="font-medium text-gray-900 tabular-nums">{fmt(price)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Doors, windows, trim & repairs (price each)</h2>
<div class="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 mb-8">
  {#each priceBook.items as row}
    <div class="flex items-center justify-between px-4 py-2.5 text-sm">
      <span class="text-gray-700">{row.item}</span>
      <span class="font-medium text-gray-900 tabular-nums">{fmt(row.price)}</span>
    </div>
  {/each}
</div>

<div class="rounded-xl bg-white border border-gray-200 p-5">
  <h2 class="font-semibold text-gray-900 mb-2">Want different prices?</h2>
  <p class="text-sm text-gray-500 mb-3">
    These numbers update automatically when you change your settings:
  </p>
  <ul class="text-sm text-gray-700 space-y-2">
    <li>• <button class="text-blue-600 hover:underline font-medium" onclick={() => onGoToTab?.('labor')}>Pricing method</button> — price from your costs (wage + margin) or from market rates</li>
    <li>• <button class="text-blue-600 hover:underline font-medium" onclick={() => onGoToTab?.('labor')}>Crew wage &amp; margin</button> — the two numbers that drive cost-based prices</li>
    <li>• <button class="text-blue-600 hover:underline font-medium" onclick={() => onGoToTab?.('surcharges')}>Surcharges</button> and <button class="text-blue-600 hover:underline font-medium" onclick={() => onGoToTab?.('materials')}>materials</button> — trash, travel, card fees, and your paint products</li>
  </ul>
</div>
