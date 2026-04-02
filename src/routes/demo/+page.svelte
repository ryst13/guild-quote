<script lang="ts">
  import InteriorScopeForm from '$lib/components/InteriorScopeForm.svelte';
  import ExteriorScopeForm from '$lib/components/ExteriorScopeForm.svelte';
  import EpoxyScopeForm from '$lib/components/EpoxyScopeForm.svelte';
  import type { TradeType, QuoteResult } from '$lib/types/index.js';

  let selectedTrade = $state<TradeType | null>(null);
  let generating = $state(false);
  let result = $state<{ quote: Omit<QuoteResult, 'profitability'> } | null>(null);
  let errorMsg = $state('');
  let captureEmail = $state('');
  let emailCaptured = $state(false);

  const tradeLabels: Record<string, string> = {
    interior: 'Interior Painting',
    exterior: 'Exterior Painting',
    epoxy: 'Epoxy & Garage Coatings',
  };

  const tradeDescriptions: Record<string, string> = {
    interior: 'Scope rooms, trim, doors, windows, and closets. Get instant pricing with production estimates.',
    exterior: 'Scope siding, trim, windows, doors, and carpentry repairs by surface. Includes staging and color scheme options.',
    epoxy: 'Scope garage floors and commercial spaces. Supports multiple coating types, flake options, and cove base.',
  };

  async function handleGenerate(trade: TradeType, scope: any) {
    generating = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_type: trade, scope }),
      });
      const data = await res.json();
      if (res.ok) {
        result = data;
      } else {
        errorMsg = data.error || 'Failed to generate estimate';
      }
    } catch {
      errorMsg = 'Network error';
    } finally {
      generating = false;
    }
  }

  function reset() {
    result = null;
    selectedTrade = null;
    errorMsg = '';
  }
</script>

<svelte:head>
  <title>GuildQuote Demo — See It In Action</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Demo header -->
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">GuildQuote</h1>
        <p class="text-sm text-gray-500">Interactive Demo</p>
      </div>
      <a href="/" class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Start Free Trial
      </a>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if generating}
      <div class="text-center py-16">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p class="mt-4 text-gray-500">Calculating estimate...</p>
      </div>

    {:else if result}
      <!-- Result -->
      <div class="space-y-6">
        <div class="rounded-2xl bg-white border border-gray-200 p-8 text-center">
          <div class="text-5xl mb-4">&#10003;</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Estimate Ready</h2>
          <div class="text-4xl font-bold text-green-600 mb-2">${Math.round(result.quote.grand_total).toLocaleString()}</div>
          <p class="text-sm text-gray-400 mb-4">{tradeLabels[result.quote.trade_type]}</p>

          {#if result.quote.production.painting_hours > 0}
            <p class="text-sm text-gray-500 mb-6">
              {result.quote.production.painting_hours.toFixed(1)} hrs &middot; {result.quote.production.crew_size}-person crew &middot; ~{result.quote.production.duration_days.toFixed(1)} days
            </p>
          {/if}

          <p class="text-xs text-gray-400 mb-6">In the full product, this generates a branded Google Doc saved to your Drive — ready to send to clients.</p>
        </div>

        <!-- Quote breakdown -->
        {#if result.quote.sections.length > 0}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h3 class="font-semibold text-gray-900 mb-4">Quote Breakdown</h3>
            {#each result.quote.sections as section}
              <div class="mb-4">
                <div class="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>{section.label}</span>
                  <span>${Math.round(section.sales_price).toLocaleString()}</span>
                </div>
                {#each section.items as item}
                  <div class="flex justify-between text-xs text-gray-500 pl-4">
                    <span>{item.label} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                    <span>${Math.round(item.sales_price).toLocaleString()}</span>
                  </div>
                {/each}
              </div>
            {/each}

            {#if result.quote.surcharges.length > 0}
              <div class="border-t border-gray-100 pt-3 mt-3">
                <div class="text-sm font-medium text-gray-700 mb-1">Surcharges</div>
                {#each result.quote.surcharges as s}
                  <div class="flex justify-between text-xs text-gray-500 pl-4">
                    <span>{s.label}</span>
                    <span>${Math.round(s.sales_amount).toLocaleString()}</span>
                  </div>
                {/each}
              </div>
            {/if}

            {#if result.quote.materials.length > 0}
              <div class="border-t border-gray-100 pt-3 mt-3">
                <div class="text-sm font-medium text-gray-700 mb-1">Materials</div>
                {#each result.quote.materials as m}
                  <div class="flex justify-between text-xs text-gray-500 pl-4">
                    <span>{m.label}{m.gallons ? ` (${m.gallons} gal)` : ''}</span>
                    <span>${Math.round(m.cost).toLocaleString()}</span>
                  </div>
                {/each}
                <div class="flex justify-between text-xs text-gray-600 pl-4 font-medium">
                  <span>Materials Total (incl. 10% wastage)</span>
                  <span>${Math.round(result.quote.materials_total).toLocaleString()}</span>
                </div>
              </div>
            {/if}

            <div class="border-t border-gray-200 pt-3 mt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Grand Total</span>
              <span>${Math.round(result.quote.grand_total).toLocaleString()}</span>
            </div>
          </div>
        {/if}

        {#if result.quote.completeness_warnings && result.quote.completeness_warnings.length > 0}
          <div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <h3 class="text-sm font-semibold text-yellow-800 mb-2">Scope Completeness Check</h3>
            {#each result.quote.completeness_warnings as warning}
              <p class="text-sm text-yellow-700">- {warning}</p>
            {/each}
          </div>
        {/if}

        {#if result.quote.benchmarks}
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p class="text-sm text-blue-700">{result.quote.benchmarks.message}</p>
          </div>
        {/if}

        <!-- Email Capture CTA -->
        <div class="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
          {#if emailCaptured}
            <div class="text-lg font-bold mb-2">You're in.</div>
            <p class="text-sm text-blue-100">We'll reach out when your trial is ready.</p>
          {:else}
            <h3 class="text-lg font-bold mb-2">Generate estimates like this for your business</h3>
            <p class="text-sm text-blue-100 mb-4">Branded Google Doc estimates from scope data in seconds. 14-day free trial, no credit card.</p>
            <div class="flex justify-center gap-2 max-w-sm mx-auto">
              <input type="email" bind:value={captureEmail} placeholder="Your email" class="flex-1 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none" />
              <button
                onclick={() => { if (captureEmail) emailCaptured = true; }}
                class="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Start Trial
              </button>
            </div>
          {/if}
        </div>

        <div class="text-center">
          <button onclick={reset} class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Try Another Estimate
          </button>
        </div>
      </div>

    {:else if !selectedTrade}
      <!-- Trade selector -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Try GuildQuote</h2>
        <p class="text-gray-500">Pick a trade and scope a sample job. See real pricing calculations in action.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        {#each (['interior', 'exterior', 'epoxy'] as const) as trade}
          <button
            onclick={() => selectedTrade = trade}
            class="rounded-xl bg-white border border-gray-200 p-6 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div class="font-semibold text-gray-900 mb-1">{tradeLabels[trade]}</div>
            <p class="text-xs text-gray-500">{tradeDescriptions[trade]}</p>
          </button>
        {/each}
      </div>

      <div class="mt-8 rounded-lg bg-gray-100 p-4 text-center">
        <p class="text-xs text-gray-500">This demo uses real pricing logic. No account required. No data saved.</p>
      </div>

    {:else}
      <!-- Scope form -->
      {#if errorMsg}
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{errorMsg}</div>
      {/if}

      <div class="mb-4 flex items-center gap-3">
        <button onclick={() => selectedTrade = null} class="text-sm text-gray-500 hover:text-gray-700">&larr; Change trade</button>
        <span class="text-sm font-medium text-gray-700">{tradeLabels[selectedTrade]}</span>
        <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Demo</span>
      </div>

      <div class="rounded-2xl bg-white border border-gray-200 p-6">
        {#if selectedTrade === 'interior'}
          <InteriorScopeForm onSubmit={(scope) => handleGenerate('interior', scope)} />
        {:else if selectedTrade === 'exterior'}
          <ExteriorScopeForm onSubmit={(scope) => handleGenerate('exterior', scope)} />
        {:else if selectedTrade === 'epoxy'}
          <EpoxyScopeForm onSubmit={(scope) => handleGenerate('epoxy', scope)} />
        {/if}
      </div>
    {/if}
  </div>
</div>
