<script lang="ts">
  import type { PageData } from './$types.js';
  import InteriorScopeForm from '$lib/components/InteriorScopeForm.svelte';
  import ExteriorScopeForm from '$lib/components/ExteriorScopeForm.svelte';
  import EpoxyScopeForm from '$lib/components/EpoxyScopeForm.svelte';
  import type { TradeType, InteriorScopeData, ExteriorScopeData, EpoxyScopeData, QuoteResult } from '$lib/types/index.js';

  let { data }: { data: PageData } = $props();

  let selectedTrade = $state<TradeType | null>(data.tenant.enabled_trades.length === 1 ? data.tenant.enabled_trades[0] as TradeType : null);
  let generating = $state(false);
  let result = $state<{ quote: QuoteResult; google_doc_url: string | null; pdf_url: string | null; submission_id: string } | null>(null);
  let errorMsg = $state('');

  const tradeLabels: Record<string, string> = {
    interior: 'Interior Painting',
    exterior: 'Exterior Painting',
    epoxy: 'Epoxy & Garage Coatings',
  };

  async function handleGenerate(trade: TradeType, scope: any) {
    generating = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/estimates/generate', {
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
</script>

<svelte:head>
  <title>New Estimate — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="font-bold text-gray-900">New Estimate</h1>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-6">
    {#if generating}
      <div class="text-center py-12">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-500">Generating estimate...</p>
      </div>

    {:else if result}
      <!-- Result -->
      <div class="space-y-6">
        <div class="rounded-2xl bg-white border border-gray-200 p-8 text-center">
          <div class="text-4xl mb-4">&#10003;</div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Estimate Generated</h2>
          <div class="text-3xl font-bold text-green-600 mb-4">${Math.round(result.quote.grand_total).toLocaleString()}</div>

          {#if result.quote.production.painting_hours > 0}
            <p class="text-sm text-gray-500 mb-6">
              {result.quote.production.painting_hours.toFixed(1)} hrs | {result.quote.production.crew_size}-person crew | ~{result.quote.production.duration_days.toFixed(1)} days
            </p>
          {/if}

          <div class="flex justify-center gap-4">
            {#if result.google_doc_url}
              <a href={result.google_doc_url} target="_blank" class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Open Google Doc
              </a>
            {/if}
            {#if result.pdf_url}
              <a href={result.pdf_url} target="_blank" class="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Download PDF
              </a>
            {/if}
            <a href="/dashboard/{result.submission_id}" class="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              View Details
            </a>
          </div>
        </div>

        {#if result.quote.completeness_warnings.length > 0}
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

        <!-- Profitability (internal) -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-3">Profitability (Internal)</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Gross Profit</span>
              <div class="font-bold text-gray-900">${Math.round(result.quote.profitability.gross_profit).toLocaleString()}</div>
            </div>
            <div>
              <span class="text-gray-500">Net Profit</span>
              <div class="font-bold text-green-600">${Math.round(result.quote.profitability.net_profit).toLocaleString()}</div>
            </div>
            <div>
              <span class="text-gray-500">Margin</span>
              <div class="font-bold text-gray-900">
                {result.quote.profitability.total_price > 0 ? Math.round(result.quote.profitability.net_profit / result.quote.profitability.total_price * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        <div class="text-center">
          <button onclick={() => { result = null; selectedTrade = null; }} class="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Create Another Estimate
          </button>
        </div>
      </div>

    {:else if !selectedTrade}
      <!-- Trade selector -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Select Trade</h2>
        {#each data.tenant.enabled_trades as trade}
          <button
            onclick={() => selectedTrade = trade as TradeType}
            class="w-full rounded-xl bg-white border border-gray-200 p-6 text-left hover:border-blue-500 hover:bg-blue-50"
          >
            <div class="font-semibold text-gray-900">{tradeLabels[trade] || trade}</div>
          </button>
        {/each}
      </div>

    {:else}
      <!-- Scope form -->
      {#if errorMsg}
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{errorMsg}</div>
      {/if}

      <div class="mb-4 flex items-center gap-3">
        <button onclick={() => selectedTrade = null} class="text-sm text-gray-500 hover:text-gray-700">&larr; Change trade</button>
        <span class="text-sm font-medium text-gray-700">{tradeLabels[selectedTrade]}</span>
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
