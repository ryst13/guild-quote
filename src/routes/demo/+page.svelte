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
        <!-- Hero result -->
        <div class="rounded-2xl bg-white border border-gray-200 p-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 text-2xl mb-4">&#10003;</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Estimate Ready</h2>
          <div class="text-4xl font-bold text-green-600 mb-2">${Math.round(result.quote.grand_total).toLocaleString()}</div>
          <p class="text-sm text-gray-400 mb-2">{tradeLabels[result.quote.trade_type]}</p>

          {#if result.quote.production.painting_hours > 0}
            {@const hrs = result.quote.production.painting_hours}
            {@const days = result.quote.production.duration_days}
            {@const hrsLow = Math.max(1, Math.round(hrs * 0.80))}
            {@const hrsHigh = Math.max(hrsLow + 1, Math.round(hrs * 1.20))}
            {@const dLow = Math.max(0.5, Math.round(days * 0.80 * 2) / 2)}
            {@const dHigh = Math.max(dLow + 0.5, Math.round(days * 1.20 * 2) / 2)}
            <p class="text-sm text-gray-500">
              {hrsLow}-{hrsHigh} hrs &middot; {result.quote.production.crew_size}-person crew &middot; {dLow}-{dHigh} days
            </p>
          {/if}
        </div>

        <!-- What happens next — pipeline mockup -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">What happens next in the full product</h3>
          <div class="flex items-center gap-2 overflow-x-auto pb-2">
            {#each [
              { label: 'Estimate Created', status: 'done' },
              { label: 'Branded PDF Generated', status: 'done' },
              { label: 'Send to Client', status: 'next' },
              { label: 'Client Views', status: 'upcoming' },
              { label: 'Won / Lost', status: 'upcoming' },
              { label: 'Crew Snapshot', status: 'upcoming' },
            ] as step}
              <div class="flex items-center gap-2 shrink-0">
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium {
                  step.status === 'done' ? 'bg-green-100 text-green-700' :
                  step.status === 'next' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                  'bg-gray-100 text-gray-400'
                }">
                  {#if step.status === 'done'}<span>&#10003;</span>{/if}
                  {step.label}
                </div>
                {#if step.label !== 'Crew Snapshot'}
                  <span class="text-gray-300 shrink-0">&rarr;</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Branded output preview mockup -->
        <div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div class="px-6 pt-5 pb-3">
            <h3 class="font-semibold text-gray-900 mb-1">Branded Estimate Output</h3>
            <p class="text-xs text-gray-500">Generated as a PDF and optionally saved to your Google Drive as a Doc or Sheet.</p>
          </div>
          <div class="mx-6 mb-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <!-- Mini PDF mockup -->
            <div class="bg-white rounded shadow-sm border border-gray-100 p-5 max-w-sm mx-auto text-left space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="w-24 h-3 rounded bg-blue-600"></div>
                  <div class="w-16 h-2 rounded bg-gray-200 mt-1.5"></div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-gray-400">Estimate #A3F8</div>
                  <div class="text-[10px] text-gray-400">April 2, 2026</div>
                </div>
              </div>
              <div class="border-t border-gray-100 pt-2">
                <div class="text-[10px] font-medium text-gray-600 mb-1">Prepared for</div>
                <div class="text-xs text-gray-800">Sarah Mitchell</div>
                <div class="text-[10px] text-gray-500">42 Maple Ave, Austin TX 78701</div>
              </div>
              <div class="border-t border-gray-100 pt-2 space-y-1">
                <div class="text-[10px] font-medium text-gray-600 mb-1">Work Description</div>
                {#each result.quote.sections.slice(0, 2) as section}
                  <div class="flex justify-between text-[10px]">
                    <span class="text-gray-700">{section.label}</span>
                    <span class="text-gray-500">${Math.round(section.sales_price).toLocaleString()}</span>
                  </div>
                {/each}
                {#if result.quote.sections.length > 2}
                  <div class="text-[10px] text-gray-400 italic">+ {result.quote.sections.length - 2} more sections...</div>
                {/if}
              </div>
              <div class="border-t border-gray-200 pt-2 flex justify-between text-xs font-bold text-gray-900">
                <span>Your Home Investment</span>
                <span>${Math.round(result.quote.grand_total).toLocaleString()}</span>
              </div>
              <div class="border-t border-gray-100 pt-2">
                <div class="w-32 h-1.5 rounded bg-gray-200"></div>
                <div class="w-20 h-1.5 rounded bg-gray-100 mt-1"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature cards grid -->
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Send to Client -->
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <div class="flex items-start gap-3 mb-3">
              <div class="shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">&#9993;</div>
              <div>
                <h4 class="font-semibold text-gray-900 text-sm">Send to Client</h4>
                <p class="text-xs text-gray-500 mt-0.5">Email the estimate with the PDF attached — via your connected Gmail or GuildQuote's built-in sender.</p>
              </div>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2">
              <div class="flex items-center gap-2 text-[10px] text-gray-400">
                <span class="w-12 text-gray-500 font-medium">To</span>
                <span class="flex-1 rounded bg-white border border-gray-200 px-2 py-1">sarah@example.com</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-gray-400">
                <span class="w-12 text-gray-500 font-medium">Subject</span>
                <span class="flex-1 rounded bg-white border border-gray-200 px-2 py-1 truncate">Your {tradeLabels[result.quote.trade_type]} Estimate</span>
              </div>
              <div class="flex gap-3 text-[10px] text-gray-500 mt-1">
                <span class="flex items-center gap-1"><span class="text-green-500">&#10003;</span> Attach PDF</span>
                <span class="flex items-center gap-1"><span class="text-green-500">&#10003;</span> Include Doc link</span>
              </div>
            </div>
          </div>

          <!-- Crew Snapshot -->
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <div class="flex items-start gap-3 mb-3">
              <div class="shrink-0 w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">&#128221;</div>
              <div>
                <h4 class="font-semibold text-gray-900 text-sm">Crew Snapshot</h4>
                <p class="text-xs text-gray-500 mt-0.5">Generate a scope-only document for your crew — no pricing, just what to do. Multi-language support.</p>
              </div>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <div class="flex flex-wrap gap-1.5">
                {#each ['English', 'Espanol', 'Portugues', 'Romana', '粵語'] as lang, i}
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium {i === 0 ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-200 text-gray-400'}">{lang}</span>
                {/each}
              </div>
              <div class="mt-2 flex gap-2">
                <span class="text-[10px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-500">Download PDF</span>
                <span class="text-[10px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-500">Open in Sheets</span>
              </div>
            </div>
          </div>

          <!-- Price Adjustments -->
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <div class="flex items-start gap-3 mb-3">
              <div class="shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm">&#36;</div>
              <div>
                <h4 class="font-semibold text-gray-900 text-sm">Price Adjustments</h4>
                <p class="text-xs text-gray-500 mt-0.5">Override the total and all line items scale proportionally. Regenerates a new version instantly.</p>
              </div>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1.5">
              <div class="flex justify-between text-[10px]">
                <span class="text-gray-500">Calculated price</span>
                <span class="text-gray-500 line-through">${Math.round(result.quote.grand_total).toLocaleString()}</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-gray-500">Adjustment</span>
                <span class="text-red-500">-8% (-${Math.round(result.quote.grand_total * 0.08).toLocaleString()})</span>
              </div>
              <div class="flex justify-between text-xs font-bold border-t border-gray-200 pt-1.5">
                <span class="text-gray-800">Final price</span>
                <span class="text-green-600">${Math.round(result.quote.grand_total * 0.92).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Status Tracking -->
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <div class="flex items-start gap-3 mb-3">
              <div class="shrink-0 w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">&#9670;</div>
              <div>
                <h4 class="font-semibold text-gray-900 text-sm">Pipeline Tracking</h4>
                <p class="text-xs text-gray-500 mt-0.5">Track every estimate from draft to close. Record win/loss with close price and decline reasons.</p>
              </div>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">Draft</span>
                <span class="text-gray-300 text-xs">&rarr;</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Sent</span>
                <span class="text-gray-300 text-xs">&rarr;</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">Viewed</span>
                <span class="text-gray-300 text-xs">&rarr;</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Won</span>
              </div>
              <div class="mt-2 flex gap-3 text-[10px] text-gray-500">
                <span>Close price tracking</span>
                <span>&middot;</span>
                <span>Decline reasons</span>
                <span>&middot;</span>
                <span>Version history</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quote breakdown (collapsible) -->
        {#if result.quote.sections.length > 0}
          <details class="rounded-xl bg-white border border-gray-200">
            <summary class="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 rounded-xl select-none">
              Quote Breakdown <span class="text-sm font-normal text-gray-400 ml-2">{result.quote.sections.length} sections &middot; ${Math.round(result.quote.grand_total).toLocaleString()}</span>
            </summary>
            <div class="px-6 pb-5 space-y-3">
              {#each result.quote.sections as section}
                <div>
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
                <div class="border-t border-gray-100 pt-3">
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
                <div class="border-t border-gray-100 pt-3">
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

              <div class="border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-900">
                <span>Grand Total</span>
                <span>${Math.round(result.quote.grand_total).toLocaleString()}</span>
              </div>
            </div>
          </details>
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
            <h3 class="text-lg font-bold mb-2">Build estimates like this for your business</h3>
            <p class="text-sm text-blue-100 mb-4">Branded PDF estimates, crew snapshots, pipeline tracking — from scope to close. 14-day free trial, no credit card.</p>
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
          <InteriorScopeForm demo onSubmit={(scope) => handleGenerate('interior', scope)} />
        {:else if selectedTrade === 'exterior'}
          <ExteriorScopeForm demo onSubmit={(scope) => handleGenerate('exterior', scope)} />
        {:else if selectedTrade === 'epoxy'}
          <EpoxyScopeForm demo onSubmit={(scope) => handleGenerate('epoxy', scope)} />
        {/if}
      </div>
    {/if}
  </div>
</div>
