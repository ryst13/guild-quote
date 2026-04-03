<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let config = $state(structuredClone(data.config));
  let outputFormat = $state(data.outputFormat);
  let showLosp = $state(data.showLosp);
  let saving = $state(false);
  let saved = $state(false);
  let activeTab = $state<'labor' | 'surcharges' | 'materials' | 'payment'>('labor');

  // Bottom-up pricing settings
  let crewWage = $state<number | null>(data.crewHourlyWage);
  let crewSize = $state(data.defaultCrewSize);
  let grossMargin = $state<number | null>(data.targetGrossMargin != null ? Math.round(data.targetGrossMargin * 100) : null);
  let pricingMode = $state(data.pricingMode);
  let metroArea = $state(data.metroArea || '');
  let subModeEnabled = $state(data.subModeEnabled);
  let subMargin = $state<number | null>(data.subMargin != null ? Math.round(data.subMargin * 100) : 10);

  const metros = [
    { value: '', label: 'Select your metro...' },
    { value: 'boston', label: 'Boston' },
    { value: 'new_york', label: 'New York' },
    { value: 'los_angeles', label: 'Los Angeles' },
    { value: 'houston', label: 'Houston' },
    { value: 'dallas', label: 'Dallas-Fort Worth' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'atlanta', label: 'Atlanta' },
    { value: 'phoenix', label: 'Phoenix' },
    { value: 'miami', label: 'Miami' },
    { value: 'denver', label: 'Denver' },
    { value: 'seattle', label: 'Seattle' },
    { value: 'san_francisco', label: 'San Francisco' },
    { value: 'philadelphia', label: 'Philadelphia' },
    { value: 'washington_dc', label: 'Washington DC' },
    { value: 'minneapolis', label: 'Minneapolis' },
    { value: 'national', label: 'Other / National Average' },
  ];

  const metroWages: Record<string, number> = {
    boston: 28.50, new_york: 30.20, los_angeles: 24.60, houston: 19.80,
    dallas: 19.50, chicago: 27.40, atlanta: 20.80, phoenix: 21.20,
    miami: 20.40, denver: 23.80, seattle: 28.00, san_francisco: 31.50,
    philadelphia: 27.00, washington_dc: 26.50, minneapolis: 25.80, national: 22.40,
  };

  let prevMetro = metroArea;
  $effect(() => {
    // When metro changes, auto-fill wage if not already set
    if (metroArea && metroArea !== prevMetro) {
      prevMetro = metroArea;
      if (metroWages[metroArea] && !crewWage) {
        crewWage = metroWages[metroArea];
      }
    }
  });

  const enabledTrades = data.enabledTrades as string[];

  async function saveConfig() {
    saving = true;
    // Save output format, LOSP toggle, and bottom-up pricing settings
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_format: outputFormat,
        show_losp: showLosp,
        crew_hourly_wage: crewWage || null,
        default_crew_size: crewSize,
        target_gross_margin: grossMargin != null ? grossMargin / 100 : null,
        pricing_mode: pricingMode,
        metro_area: metroArea || null,
        sub_mode_enabled: subModeEnabled,
        sub_margin: subMargin != null ? subMargin / 100 : null,
      }),
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
      <button onclick={() => activeTab = 'labor'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'labor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Labor & Margins</button>
      <button onclick={() => activeTab = 'surcharges'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'surcharges' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Surcharges</button>
      <button onclick={() => activeTab = 'materials'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Materials</button>
      <button onclick={() => activeTab = 'payment'} class="px-4 py-2 text-sm font-medium rounded-lg {activeTab === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">Payment Terms</button>
    </div>

    {#if activeTab === 'labor'}
      <!-- Pricing Mode -->
      <div class="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <h2 class="font-semibold text-gray-900 mb-1">Pricing Engine</h2>
        <p class="text-sm text-gray-500 mb-4">Choose how GuildQuote calculates your estimates.</p>
        <div class="flex gap-3">
          <button
            onclick={() => pricingMode = 'top_down'}
            class="flex-1 rounded-xl border p-4 text-left {pricingMode === 'top_down' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          >
            <div class="font-semibold text-gray-900 text-sm">Rate-Based</div>
            <div class="text-xs text-gray-500 mt-1">Price from $/sqft and $/item rates. Calibrate with Quick Calibrate or edit rates directly.</div>
          </button>
          <button
            onclick={() => pricingMode = 'bottom_up'}
            class="flex-1 rounded-xl border p-4 text-left {pricingMode === 'bottom_up' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
          >
            <div class="font-semibold text-gray-900 text-sm">Cost-Based</div>
            <div class="text-xs text-gray-500 mt-1">Price from crew wages and your target margin. Automatically adjusts to your market.</div>
          </button>
        </div>
      </div>

      <!-- Crew & Margin Settings -->
      <div class="rounded-xl bg-white border border-gray-200 p-6 mb-6 space-y-6">
        <div>
          <h2 class="font-semibold text-gray-900">Crew & Margins</h2>
          <p class="text-sm text-gray-500 mt-1">
            {#if pricingMode === 'bottom_up'}
              These settings drive your estimate pricing. Your crew wage and margin determine every line item price.
            {:else}
              These settings are used for production time estimates and profitability analysis on your dashboard.
            {/if}
          </p>
        </div>

        <!-- Metro Area -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Metro Area</label>
          <p class="text-xs text-gray-500 mb-2">Sets default crew wage for your area. You can override below.</p>
          <select
            bind:value={metroArea}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
          >
            {#each metros as m}
              <option value={m.value}>{m.label}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <!-- Crew Wage -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Crew Hourly Wage</label>
            <p class="text-xs text-gray-500 mb-2">What you pay each painter per hour.</p>
            <div class="relative">
              <span class="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input
                type="number"
                step="0.50"
                min="10"
                max="60"
                bind:value={crewWage}
                placeholder={metroArea ? String(metroWages[metroArea] ?? '22.40') : '22.40'}
                class="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <!-- Crew Size -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Default Crew Size</label>
            <p class="text-xs text-gray-500 mb-2">Painters on a typical job.</p>
            <select bind:value={crewSize} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
              <option value={1}>1 painter</option>
              <option value={2}>2 painters</option>
              <option value={3}>3 painters</option>
              <option value={4}>4 painters</option>
            </select>
          </div>

          <!-- Gross Margin -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Target Gross Margin</label>
            <p class="text-xs text-gray-500 mb-2">% of every dollar you keep.</p>
            <div class="relative">
              <input
                type="number"
                step="1"
                min="10"
                max="70"
                bind:value={grossMargin}
                placeholder="40"
                class="w-full rounded-lg border border-gray-300 px-3 pr-7 py-2 text-sm outline-none"
              />
              <span class="absolute right-3 top-2 text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        <!-- Preview -->
        {#if crewWage && grossMargin}
          {@const billingRate = crewWage / (1 - grossMargin / 100)}
          {@const sampleWallSqft = 384}
          {@const sampleWallHours = sampleWallSqft / 150}
          {@const sampleWallPrice = sampleWallHours * billingRate}
          <div class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p class="font-medium mb-2">Preview at these settings:</p>
            <div class="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span class="text-gray-400">Effective billing rate</span>
                <div class="font-semibold text-gray-900">${billingRate.toFixed(2)}/hr per painter</div>
              </div>
              <div>
                <span class="text-gray-400">Medium bedroom walls</span>
                <div class="font-semibold text-gray-900">${Math.round(sampleWallPrice)} ({sampleWallHours.toFixed(1)} hrs)</div>
              </div>
              <div>
                <span class="text-gray-400">You keep per $1,000</span>
                <div class="font-semibold text-gray-900">${Math.round(grossMargin * 10)}</div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Sub Mode -->
      <div class="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900">Subcontractor Mode</h2>
            <p class="text-sm text-gray-500 mt-1">Do you take on subcontracted projects? When enabled, you can generate sub estimates priced at your labor cost plus a small margin — for bidding to general contractors.</p>
          </div>
          <button
            onclick={() => subModeEnabled = !subModeEnabled}
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out {subModeEnabled ? 'bg-blue-600' : 'bg-gray-200'}"
            role="switch"
            aria-checked={subModeEnabled}
            aria-label="Toggle subcontractor mode"
          >
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {subModeEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
          </button>
        </div>
        {#if subModeEnabled}
          <div class="mt-4 pt-4 border-t border-gray-100">
            <label for="sub-margin" class="block text-sm font-medium text-gray-700 mb-1">Sub Margin</label>
            <p class="text-xs text-gray-500 mb-2">Your markup over pure labor cost when bidding to a GC. Typical range: 5-15%.</p>
            <div class="relative w-40">
              <input id="sub-margin" type="number" step="1" min="0" max="30" bind:value={subMargin}
                class="w-full rounded-lg border border-gray-300 px-3 pr-7 py-2 text-sm outline-none" />
              <span class="absolute right-3 top-2 text-sm text-gray-400">%</span>
            </div>
            {#if crewWage && subMargin != null}
              <p class="text-xs text-gray-500 mt-2">
                Sub billing rate: ${(crewWage * (1 + subMargin / 100)).toFixed(2)}/hr per painter
                (vs D2C: ${crewWage && grossMargin ? (crewWage / (1 - grossMargin / 100)).toFixed(2) : '—'}/hr)
              </p>
            {/if}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'surcharges'}
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

      <!-- LOSP Toggle -->
      <div class="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900">Surface Preparation Options</h2>
            <p class="text-sm text-gray-500 mt-1">Show Level of Surface Preparation (LOSP) tier options on estimates. When enabled, estimates include prep tier options with pricing.</p>
          </div>
          <button
            onclick={() => showLosp = !showLosp}
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out {showLosp ? 'bg-blue-600' : 'bg-gray-200'}"
            role="switch"
            aria-checked={showLosp}
            aria-label="Toggle surface preparation options"
          >
            <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {showLosp ? 'translate-x-5' : 'translate-x-0'}"></span>
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
