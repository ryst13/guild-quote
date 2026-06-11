<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
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

<svelte:head>
  <title>Price Book — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="text-lg font-bold text-gray-900">Price Book</h1>
      </div>
      <a href="/dashboard/settings/pricing" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Change My Prices</a>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-6">
    {#if data.hadCustomCatalog && !noteDismissed}
      <div class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start justify-between gap-4">
        <p class="text-sm text-blue-900">
          The old catalog editor has been retired. Your estimate prices were not
          affected — they come from your Pricing settings, shown live below.
        </p>
        <button onclick={dismissNote} class="text-blue-400 hover:text-blue-600 text-sm font-bold" aria-label="Dismiss">&times;</button>
      </div>
    {/if}

    <!-- Baseline assumptions: first thing visible, plain words -->
    <div class="mb-6 rounded-xl bg-white border border-gray-200 p-4">
      <p class="text-sm text-gray-700 font-medium">
        These are your current prices. They come from your
        {data.priceBook.engine === 'bottom_up' ? 'cost-based settings (crew wage and margin)' : 'rate-based settings (price level)'}.
      </p>
      <p class="text-sm text-gray-500 mt-1">
        Room prices are for <strong>walls only, standard prep</strong>. Ceilings,
        doors, windows, and trim add to the price — those are listed below the rooms.
      </p>
    </div>

    <!-- Rooms: card per room, three size rows, right-aligned prices -->
    <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Rooms (walls only)</h2>
    <div class="grid gap-3 sm:grid-cols-2 mb-8">
      {#each data.priceBook.rooms as room}
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

    <!-- Items -->
    <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Doors, windows, trim & repairs (price each)</h2>
    <div class="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 mb-8">
      {#each data.priceBook.items as row}
        <div class="flex items-center justify-between px-4 py-2.5 text-sm">
          <span class="text-gray-700">{row.item}</span>
          <span class="font-medium text-gray-900 tabular-nums">{fmt(row.price)}</span>
        </div>
      {/each}
    </div>

    <!-- The levers that actually work -->
    <div class="rounded-xl bg-white border border-gray-200 p-5">
      <h2 class="font-semibold text-gray-900 mb-2">Want different prices?</h2>
      <p class="text-sm text-gray-500 mb-3">
        These numbers update automatically when you change your settings:
      </p>
      <ul class="text-sm text-gray-700 space-y-2">
        <li>• <a href="/dashboard/settings/pricing" class="text-blue-600 hover:underline font-medium">Pricing method</a> — price from your costs (wage + margin) or from market rates</li>
        <li>• <a href="/dashboard/settings/pricing" class="text-blue-600 hover:underline font-medium">Crew wage &amp; margin</a> — the two numbers that drive cost-based prices</li>
        <li>• <a href="/dashboard/settings/pricing" class="text-blue-600 hover:underline font-medium">Surcharges &amp; materials</a> — trash, travel, card fees, and your paint products</li>
      </ul>
    </div>
  </div>
</div>
