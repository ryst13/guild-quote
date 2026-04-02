<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let config = $state(structuredClone(data.config));
  let outputFormat = $state(data.outputFormat);
  let saving = $state(false);
  let saved = $state(false);
  let activeTab = $state<'surcharges' | 'materials' | 'payment'>('surcharges');

  const enabledTrades = data.enabledTrades as string[];

  async function saveConfig() {
    saving = true;
    // Save output format separately via tenant update
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output_format: outputFormat }),
    });
    const res = await fetch('/api/tenant/update-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      saved = true;
      setTimeout(() => { saved = false; }, 2000);
    }
    saving = false;
  }

  function resetToDefaults() {
    config = structuredClone(data.defaults);
  }
</script>

<svelte:head>
  <title>Pricing & Surcharges — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="font-bold text-gray-900">Pricing & Surcharges</h1>
      </div>
      <div class="flex items-center gap-3">
        {#if saved}
          <span class="text-sm text-green-600 font-medium">Saved</span>
        {/if}
        <button onclick={resetToDefaults} class="text-xs text-gray-500 hover:text-gray-700">Reset to Defaults</button>
        <button onclick={saveConfig} disabled={saving} class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button onclick={() => activeTab = 'surcharges'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'surcharges' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Surcharges</button>
      <button onclick={() => activeTab = 'materials'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Materials</button>
      <button onclick={() => activeTab = 'payment'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Payment Terms</button>
    </div>

    {#if activeTab === 'surcharges'}
      <!-- Output Format -->
      <div class="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <h2 class="font-semibold text-gray-900 mb-1">Estimate Output Format</h2>
        <p class="text-sm text-gray-500 mb-4">Choose how estimates are saved to your Google Drive.</p>
        <div class="flex gap-3">
          <button
            onclick={() => outputFormat = 'google_sheets'}
            class="flex-1 rounded-xl border p-4 text-left {outputFormat === 'google_sheets' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          >
            <div class="font-semibold text-gray-900 text-sm">Google Sheets</div>
            <div class="text-xs text-gray-500 mt-1">Formatted spreadsheet. Easy to edit, prints well. Recommended.</div>
          </button>
          <button
            onclick={() => outputFormat = 'google_docs'}
            class="flex-1 rounded-xl border p-4 text-left {outputFormat === 'google_docs' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          >
            <div class="font-semibold text-gray-900 text-sm">Google Docs</div>
            <div class="text-xs text-gray-500 mt-1">Document format. Good for narrative-heavy estimates.</div>
          </button>
          <button
            onclick={() => outputFormat = 'pdf'}
            class="flex-1 rounded-xl border p-4 text-left {outputFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          >
            <div class="font-semibold text-gray-900 text-sm">PDF Only</div>
            <div class="text-xs text-gray-500 mt-1">No Google integration needed. PDF generated and attached to emails.</div>
          </button>
        </div>
      </div>

      <div class="rounded-xl bg-white border border-gray-200 p-6 space-y-6">
        <h2 class="font-semibold text-gray-900">Surcharges</h2>
        <p class="text-sm text-gray-500">Toggle surcharges on or off and set your amounts. These are applied automatically to every estimate.</p>

        <!-- Trash Removal -->
        <div class="border-b border-gray-100 pb-4">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={config.surcharges.trash_enabled} class="rounded border-gray-300" />
              <span class="text-sm font-medium text-gray-700">Trash Removal</span>
            </label>
          </div>
          {#if config.surcharges.trash_enabled}
            <div class="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Interior ($)</label>
                <input type="number" step="0.01" bind:value={config.surcharges.trash_interior} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Exterior ($)</label>
                <input type="number" step="0.01" bind:value={config.surcharges.trash_exterior} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          {/if}
        </div>

        <!-- Transportation -->
        <div class="border-b border-gray-100 pb-4">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={config.surcharges.transportation_enabled} class="rounded border-gray-300" />
              <span class="text-sm font-medium text-gray-700">Transportation</span>
            </label>
          </div>
          {#if config.surcharges.transportation_enabled}
            <div class="ml-6">
              <label class="block text-xs text-gray-500 mb-1">Amount ($)</label>
              <input type="number" step="0.01" bind:value={config.surcharges.transportation_amount} class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
          {/if}
        </div>

        <!-- CC Fee -->
        <div class="border-b border-gray-100 pb-4">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={config.surcharges.cc_fee_enabled} class="rounded border-gray-300" />
              <span class="text-sm font-medium text-gray-700">Credit Card Fee</span>
            </label>
          </div>
          {#if config.surcharges.cc_fee_enabled}
            <div class="ml-6">
              <label class="block text-xs text-gray-500 mb-1">Percentage (%)</label>
              <input type="number" step="0.1" bind:value={config.surcharges.cc_fee_pct} class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
          {/if}
        </div>

        <!-- Color Samples -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={config.surcharges.color_samples_enabled} class="rounded border-gray-300" />
              <span class="text-sm font-medium text-gray-700">Color Samples</span>
            </label>
          </div>
          {#if config.surcharges.color_samples_enabled}
            <div class="ml-6">
              <label class="block text-xs text-gray-500 mb-1">Amount ($)</label>
              <input type="number" step="0.01" bind:value={config.surcharges.color_samples_amount} class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
          {/if}
        </div>

        <!-- Labor Multiplier -->
        <div class="border-t border-gray-200 pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Labor Price Multiplier</label>
          <p class="text-xs text-gray-500 mb-2">Applied to base labor rates. Default 1.1 (10% markup).</p>
          <input type="number" step="0.05" bind:value={config.labor_multiplier} class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
        </div>
      </div>

    {:else if activeTab === 'materials'}
      <div class="space-y-6">
        {#if enabledTrades.includes('interior')}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-1">Interior Paint Products</h2>
            <p class="text-sm text-gray-500 mb-4">Set your preferred products, coverage rates, and per-gallon pricing.</p>
            <div class="space-y-4">
              {#each Object.entries(config.materials.interior) as [key, mat]}
                <div class="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1 capitalize">{key} — Product</label>
                    <input type="text" bind:value={mat.product} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Coverage (sqft/gal)</label>
                    <input type="number" bind:value={mat.coverage} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Price/Gallon ($)</label>
                    <input type="number" step="0.01" bind:value={mat.price_per_gallon} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if enabledTrades.includes('exterior')}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-1">Exterior Paint Products</h2>
            <p class="text-sm text-gray-500 mb-4">Set your preferred exterior products and pricing.</p>
            <div class="space-y-4">
              {#each Object.entries(config.materials.exterior) as [key, mat]}
                <div class="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1 capitalize">{key} — Product</label>
                    <input type="text" bind:value={mat.product} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Coverage (sqft/gal)</label>
                    <input type="number" bind:value={mat.coverage} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Price/Gallon ($)</label>
                    <input type="number" step="0.01" bind:value={mat.price_per_gallon} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if enabledTrades.includes('epoxy')}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-1">Epoxy Products</h2>
            <p class="text-sm text-gray-500 mb-4">Set your preferred epoxy products and pricing.</p>
            <div class="space-y-4">
              {#each Object.entries(config.materials.epoxy) as [key, mat]}
                <div class="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1 capitalize">{key} — Product</label>
                    <input type="text" bind:value={mat.product} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Coverage (sqft/gal)</label>
                    <input type="number" bind:value={mat.coverage} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Price/Gallon ($)</label>
                    <input type="number" step="0.01" bind:value={mat.price_per_gallon} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

    {:else if activeTab === 'payment'}
      <div class="rounded-xl bg-white border border-gray-200 p-6 space-y-6">
        <h2 class="font-semibold text-gray-900">Payment Terms</h2>
        <p class="text-sm text-gray-500">These appear in the "Your Home Investment" section of every estimate.</p>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deposit (%)</label>
            <input type="number" step="5" min="0" max="100" bind:value={config.payment_terms.deposit_pct} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            <p class="text-xs text-gray-400 mt-1">Due at signing. Remaining balance due at completion.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Progress Payment Threshold ($)</label>
            <input type="number" step="1000" bind:value={config.payment_terms.progress_threshold} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            <p class="text-xs text-gray-400 mt-1">For estimates above this amount, a progress payment is added at 50% completion.</p>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p class="font-medium mb-2">Preview:</p>
          <p>Under ${config.payment_terms.progress_threshold.toLocaleString()}: {config.payment_terms.deposit_pct}% deposit, {100 - config.payment_terms.deposit_pct}% at completion</p>
          <p>Over ${config.payment_terms.progress_threshold.toLocaleString()}: {config.payment_terms.deposit_pct}% deposit, {config.payment_terms.deposit_pct}% at 50%, {100 - config.payment_terms.deposit_pct * 2}% at completion</p>
        </div>
      </div>
    {/if}
  </div>
</div>
