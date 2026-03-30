<script lang="ts">
  import type { PageData } from './$types.js';
  import type { CatalogConfig } from '$lib/types/index.js';

  let { data }: { data: PageData } = $props();

  let catalog: CatalogConfig = $state(JSON.parse(JSON.stringify(data.catalog)));
  let saving = $state(false);
  let saved = $state(false);
  let activeTab = $state<'pricing' | 'modifiers'>('pricing');

  async function saveCatalog() {
    saving = true;
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog_json: JSON.stringify(catalog) }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function resetToDefaults() {
    if (!confirm('Reset all pricing to defaults? This cannot be undone.')) return;
    catalog = JSON.parse(JSON.stringify(data.defaultCatalog));
    await saveCatalog();
  }

  function updatePrice(roomType: string, size: string, surface: string, value: string) {
    const num = parseInt(value) || 0;
    if (catalog.pricing[roomType]?.[size]) {
      catalog.pricing[roomType][size][surface] = num;
    }
  }

  const surfaces = ['walls', 'ceiling', 'trim', 'door', 'window', 'crown_molding', 'shelving', 'cabinets'];
  const surfaceLabels: Record<string, string> = {
    walls: 'Walls', ceiling: 'Ceiling', trim: 'Trim', door: 'Door',
    window: 'Window', crown_molding: 'Crown', shelving: 'Shelving', cabinets: 'Cabinets'
  };
</script>

<svelte:head>
  <title>Catalog Editor — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="text-lg font-bold text-gray-900">Pricing Catalog</h1>
      </div>
      <div class="flex items-center gap-3">
        {#if saved}
          <span class="text-sm text-green-600 font-medium">Saved!</span>
        {/if}
        <button onclick={resetToDefaults} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset to Defaults</button>
        <button onclick={saveCatalog} disabled={saving} class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <button onclick={() => activeTab = 'pricing'} class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'pricing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">Room Pricing</button>
      <button onclick={() => activeTab = 'modifiers'} class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'modifiers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">Modifiers</button>
    </div>

    {#if activeTab === 'pricing'}
      <p class="text-sm text-gray-500 mb-4">Set prices per room type and size. All prices in USD.</p>

      {#each catalog.room_types as roomType}
        <div class="mb-6 rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 class="font-semibold text-gray-900">{roomType}</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  {#each surfaces as s}
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{surfaceLabels[s]}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each catalog.room_sizes as size}
                  <tr class="border-b border-gray-50">
                    <td class="px-4 py-2 font-medium text-gray-700">{size}</td>
                    {#each surfaces as surface}
                      <td class="px-3 py-1">
                        <input
                          type="number"
                          value={catalog.pricing[roomType]?.[size]?.[surface] ?? 0}
                          oninput={(e) => updatePrice(roomType, size, surface, (e.target as HTMLInputElement).value)}
                          class="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 focus:border-blue-500 outline-none"
                        />
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}

    {:else}
      <div class="space-y-6">
        <!-- Special Conditions -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Special Conditions</h3>
          <div class="space-y-3">
            {#each Object.entries(catalog.special_conditions) as [key, cond]}
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">{cond.label}</span>
                <div class="flex items-center gap-2">
                  {#if 'adder_per_room' in cond}
                    <span class="text-xs text-gray-500">$ per room:</span>
                    <input
                      type="number"
                      value={cond.adder_per_room}
                      oninput={(e) => { catalog.special_conditions[key] = { ...cond, adder_per_room: parseInt((e.target as HTMLInputElement).value) || 0 }; }}
                      class="w-24 rounded border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 outline-none"
                    />
                  {/if}
                  {#if 'adder_pct' in cond}
                    <span class="text-xs text-gray-500">% of base:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={((cond.adder_pct || 0) * 100).toFixed(0)}
                      oninput={(e) => { catalog.special_conditions[key] = { ...cond, adder_pct: (parseInt((e.target as HTMLInputElement).value) || 0) / 100 }; }}
                      class="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 outline-none"
                    />
                    <span class="text-xs text-gray-500">%</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Furniture Handling -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Furniture Handling</h3>
          <div class="space-y-3">
            {#each Object.entries(catalog.furniture_handling) as [key, fh]}
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">{fh.label}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">$ per room:</span>
                  <input
                    type="number"
                    value={fh.adder_per_room}
                    oninput={(e) => { catalog.furniture_handling[key] = { ...fh, adder_per_room: parseInt((e.target as HTMLInputElement).value) || 0 }; }}
                    class="w-24 rounded border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 outline-none"
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Ceiling Heights -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Ceiling Height Multipliers</h3>
          <div class="space-y-3">
            {#each catalog.ceiling_heights as ch, i}
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">{ch.label}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">Multiplier:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={ch.multiplier}
                    oninput={(e) => { catalog.ceiling_heights[i] = { ...ch, multiplier: parseFloat((e.target as HTMLInputElement).value) || 1 }; }}
                    class="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 outline-none"
                  />
                  <span class="text-xs text-gray-500">x</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>
