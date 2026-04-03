<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let sub = $state(data.submission);
  let saving = $state(false);
  let saved = $state(false);
  let regenerating = $state(false);
  let regeneratingDoc = $state(false);
  let docRegenError = $state('');
  let deleting = $state(false);
  let showDeleteConfirm = $state(false);
  let showAcceptModal = $state(false);
  let showDeclineModal = $state(false);
  let closePrice = $state(sub.sales_price?.toFixed(2) || '');
  let declineReason = $state('');

  const DECLINE_REASONS = ['Price too high', 'Went with competitor', 'Project cancelled', 'Timing / scheduling', 'Scope changed', 'No response', 'Other'];

  let adjustedPrice = $state(sub.sales_price?.toFixed(2) || '');
  let notes = $state(sub.estimator_notes || '');
  let originalPrice = sub.quote?.grand_total || sub.sales_price || 0;
  let priceChanged = $derived(parseFloat(adjustedPrice) !== originalPrice && adjustedPrice !== '');
  let editingClient = $state(false);
  let clientName = $state(`${sub.first_name} ${sub.last_name}`);
  let clientEmail = $state(sub.email || '');
  let clientPhone = $state(sub.phone || '');
  let clientAddress = $state(sub.address || '');

  let googleLinkLabel = $derived(data.tenant.output_format === 'google_sheets' ? 'Open Sheet' : 'Open Doc');
  let showLineItems = $state(true);
  let snapshotLang = $state('en');
  let generatingSnapshot = $state(false);
  let snapshotUrl = $state(sub.snapshot_pdf_url || '');
  let snapshotDocUrl = $state(sub.snapshot_doc_url || '');
  let editingPricing = $state(false);
  let savingPricing = $state(false);
  let showVersionHistory = $state(false);
  let deleteConfirmText = $state('');
  let justMarkedWon = $state(false);
  let snapshotPanel: HTMLDivElement | undefined = $state();

  function recalcTotals() {
    if (!sub.quote) return;
    let laborSubtotal = 0;
    for (const section of sub.quote.sections) {
      section.sales_price = section.items.reduce((s: number, i: any) => s + i.sales_price, 0);
      section.sub_cost = section.items.reduce((s: number, i: any) => s + i.sub_cost, 0);
      laborSubtotal += section.sales_price;
    }
    sub.quote.labor_subtotal = laborSubtotal;
    const surchargeTotal = sub.quote.surcharges.reduce((s: number, x: any) => s + x.sales_amount, 0);
    sub.quote.labor_total = laborSubtotal + surchargeTotal;
    sub.quote.materials_total = sub.quote.materials.reduce((s: number, m: any) => s + m.cost, 0);
    sub.quote.grand_total = sub.quote.labor_total + sub.quote.materials_total;
  }

  async function savePricingEdits() {
    if (!sub.quote) return;
    savingPricing = true;
    // Save updated quote_json
    await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_json: JSON.stringify(sub.quote), sales_price: sub.quote.grand_total }),
    });
    // Regenerate PDF/Doc with new prices
    const res = await fetch(`/api/submissions/${sub.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjusted_price: null }),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.pdf_url) sub.estimate_pdf_url = result.pdf_url;
      if (result.google_doc_url) sub.google_doc_url = result.google_doc_url;
    }
    sub.sales_price = sub.quote.grand_total;
    adjustedPrice = sub.quote.grand_total.toFixed(2);
    originalPrice = sub.quote.grand_total;
    editingPricing = false;
    savingPricing = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  const SNAPSHOT_LANGS = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ro', label: 'Română' },
    { code: 'zh-yue', label: '粵語' },
  ];

  async function generateSnapshot() {
    generatingSnapshot = true;
    const res = await fetch(`/api/submissions/${sub.id}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: snapshotLang }),
    });
    const result = await res.json();
    if (result.pdf_url) {
      snapshotUrl = result.pdf_url;
    }
    if (result.snapshot_doc_url) {
      snapshotDocUrl = result.snapshot_doc_url;
    }
    generatingSnapshot = false;
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    expired: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
  };

  const tradeLabels: Record<string, string> = {
    interior: 'Interior Painting',
    exterior: 'Exterior Painting',
    epoxy: 'Epoxy & Garage Coatings',
  };

  async function saveNotes() {
    saving = true;
    const res = await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimator_notes: notes }),
    });
    if (res.ok) {
      saved = true;
      setTimeout(() => { saved = false; }, 2000);
    }
    saving = false;
  }

  async function regenerateEstimate() {
    regenerating = true;
    const res = await fetch(`/api/submissions/${sub.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjusted_price: parseFloat(adjustedPrice) || null }),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.pdf_url) sub.estimate_pdf_url = result.pdf_url;
      if (result.google_doc_url) sub.google_doc_url = result.google_doc_url;
      if (result.quote) {
        sub.quote = result.quote;
        sub.sales_price = result.quote.grand_total;
      }
      originalPrice = parseFloat(adjustedPrice) || originalPrice;
      saved = true;
      setTimeout(() => { saved = false; }, 2000);
    } else {
      console.error('[regenerate] Failed:', await res.text());
    }
    regenerating = false;
  }

  async function regenerateDocuments() {
    regeneratingDoc = true;
    docRegenError = '';
    try {
      const res = await fetch(`/api/submissions/${sub.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjusted_price: null }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.pdf_url) sub.estimate_pdf_url = result.pdf_url;
        if (result.google_doc_url) sub.google_doc_url = result.google_doc_url;
        // Check if the expected outputs were actually generated
        const pdfStillMissing = !sub.estimate_pdf_url;
        const docStillMissing = data.tenant.output_format && !sub.google_doc_url;
        if (pdfStillMissing || docStillMissing) {
          docRegenError = 'Some documents could not be generated. Check your Google connection or try again.';
        } else {
          saved = true;
          setTimeout(() => { saved = false; }, 2000);
        }
      } else {
        docRegenError = 'Regeneration failed. Please try again.';
      }
    } catch {
      docRegenError = 'Network error. Please check your connection and try again.';
    }
    regeneratingDoc = false;
  }

  async function duplicateEstimate() {
    const res = await fetch(`/api/submissions/${sub.id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const result = await res.json();
      window.location.href = `/dashboard/${result.id}`;
    }
  }

  async function deleteEstimate() {
    deleting = true;
    const res = await fetch(`/api/submissions/${sub.id}/delete`, { method: 'POST' });
    if (res.ok) {
      window.location.href = '/dashboard';
    }
    deleting = false;
  }

  async function markAccepted() {
    await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimate_status: 'accepted',
        close_price: parseFloat(closePrice) || sub.sales_price,
        outcome_date: new Date().toISOString(),
      }),
    });
    sub.estimate_status = 'accepted';
    sub.close_price = parseFloat(closePrice) || sub.sales_price;
    showAcceptModal = false;
    justMarkedWon = true;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
    // Scroll to snapshot panel after a tick
    setTimeout(() => { snapshotPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
  }

  async function markDeclined() {
    await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimate_status: 'declined',
        decline_reason: declineReason,
        outcome_date: new Date().toISOString(),
      }),
    });
    sub.estimate_status = 'declined';
    showDeclineModal = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function saveClient() {
    saving = true;
    const parts = clientName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email: clientEmail, phone: clientPhone, address: clientAddress }),
    });
    sub.first_name = firstName;
    sub.last_name = lastName;
    sub.email = clientEmail;
    sub.phone = clientPhone;
    sub.address = clientAddress;

    // Also update scope_json with new client info and regenerate outputs
    const scope = sub.scope;
    if (scope?.client) {
      scope.client.name = clientName.trim();
      scope.client.email = clientEmail;
      scope.client.phone = clientPhone;
      scope.client.address = clientAddress;
      await fetch(`/api/submissions/${sub.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope_json: JSON.stringify(scope) }),
      });
    }

    // Regenerate PDF and Sheet/Doc with updated client info
    const regenRes = await fetch(`/api/submissions/${sub.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjusted_price: null }),
    });
    if (regenRes.ok) {
      const result = await regenRes.json();
      if (result.pdf_url) sub.estimate_pdf_url = result.pdf_url;
      if (result.google_doc_url) sub.google_doc_url = result.google_doc_url;
    }

    editingClient = false;
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  function sendToClient() {
    window.location.href = `/dashboard/${sub.id}/send`;
  }

  function fmt(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Estimate {sub.id.slice(0, 8)} — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
      <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
      <h1 class="font-bold text-gray-900">Estimate {sub.id.slice(0, 8).toUpperCase()}</h1>
      <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tradeLabels[sub.trade_type] || sub.trade_type}</span>
      <span class="text-xs font-medium px-2.5 py-0.5 rounded-full {statusColors[sub.estimate_status] || 'bg-gray-100 text-gray-600'}">{statusLabels[sub.estimate_status] || sub.estimate_status}</span>
      {#if (sub.version || 1) > 1}
        <span class="text-xs text-gray-400">v{sub.version}</span>
      {/if}
      {#if saved}
        <span class="text-sm text-green-600 font-medium ml-auto">Saved</span>
      {/if}
    </div>
  </div>

  <div class="mx-auto max-w-5xl px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left panel: estimate content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Client Info -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-900">Client Information</h2>
            {#if !editingClient}
              <button onclick={() => editingClient = true} class="text-xs text-blue-600 hover:text-blue-700">Edit</button>
            {/if}
          </div>
          {#if editingClient}
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Name</label>
                  <input type="text" bind:value={clientName} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Email</label>
                  <input type="email" bind:value={clientEmail} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Phone</label>
                  <input type="tel" bind:value={clientPhone} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Address</label>
                  <input type="text" bind:value={clientAddress} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick={saveClient} class="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Save</button>
                <button onclick={() => editingClient = false} class="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          {:else}
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-gray-500">Name:</span> <span class="text-gray-900">{sub.first_name} {sub.last_name}</span></div>
              <div><span class="text-gray-500">Email:</span> <span class="text-gray-900">{sub.email || '—'}</span></div>
              <div><span class="text-gray-500">Phone:</span> <span class="text-gray-900">{sub.phone || '—'}</span></div>
              <div><span class="text-gray-500">Address:</span> <span class="text-gray-900">{sub.address}</span></div>
            </div>
            <div class="mt-2 text-xs text-gray-400">Created {formatDate(sub.created_at)}</div>
          {/if}
        </div>

        <!-- Quote Breakdown -->
        {#if sub.quote}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-gray-900">Quote Breakdown</h2>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" bind:checked={showLineItems} class="rounded border-gray-300" />
                  Line items
                </label>
                {#if editingPricing}
                  <button onclick={savePricingEdits} disabled={savingPricing} class="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                    {savingPricing ? 'Saving...' : 'Save & Regenerate'}
                  </button>
                  <button onclick={() => { editingPricing = false; window.location.reload(); }} class="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
                {:else}
                  <button onclick={() => { editingPricing = true; showLineItems = true; }} class="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Edit Pricing</button>
                {/if}
              </div>
            </div>
            <div class="space-y-3">
              {#each sub.quote.sections || [] as section, si}
                <div class="py-2 border-b border-gray-100">
                  <div class="flex justify-between font-medium text-gray-900">
                    <span>{section.label}</span>
                    <span>${fmt(section.sales_price)}</span>
                  </div>
                  {#if showLineItems}
                    {#each section.items || [] as item, ii}
                      <div class="flex justify-between text-xs text-gray-500 ml-3 {editingPricing ? 'py-1' : ''}">
                        <span>{item.label} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        {#if editingPricing}
                          <input
                            type="number"
                            step="0.01"
                            value={Math.round(item.sales_price * 100) / 100}
                            oninput={(e) => { sub.quote.sections[si].items[ii].sales_price = parseFloat(e.currentTarget.value) || 0; recalcTotals(); }}
                            class="w-20 text-right rounded border border-gray-300 px-2 py-0.5 text-xs focus:border-blue-500 outline-none"
                          />
                        {:else}
                          <span>${fmt(item.sales_price)}</span>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {/each}

              {#if sub.quote.surcharges?.length > 0}
                <div class="pt-2 border-t border-gray-200">
                  <div class="text-sm font-medium text-gray-700 mb-1">Surcharges</div>
                  {#each sub.quote.surcharges as s, si}
                    <div class="flex justify-between text-xs text-gray-500 {editingPricing ? 'py-1' : ''}">
                      <span>{s.label}</span>
                      {#if editingPricing}
                        <input
                          type="number"
                          step="0.01"
                          value={Math.round(s.sales_amount * 100) / 100}
                          oninput={(e) => { sub.quote.surcharges[si].sales_amount = parseFloat(e.currentTarget.value) || 0; recalcTotals(); }}
                          class="w-20 text-right rounded border border-gray-300 px-2 py-0.5 text-xs focus:border-blue-500 outline-none"
                        />
                      {:else}
                        <span>${fmt(s.sales_amount)}</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="flex justify-between pt-2 border-t border-gray-200 font-medium">
                <span>Labor Total</span>
                <span>${fmt(sub.quote.labor_total || 0)}</span>
              </div>

              {#if sub.quote.materials?.length > 0}
                <div class="pt-2">
                  <div class="text-sm font-medium text-gray-700 mb-1">Materials</div>
                  {#each sub.quote.materials as m, mi}
                    <div class="flex justify-between text-xs text-gray-500 {editingPricing ? 'py-1' : ''}">
                      <span>{m.label}{m.gallons ? ` (${m.gallons} gal)` : ''}</span>
                      {#if editingPricing}
                        <input
                          type="number"
                          step="0.01"
                          value={Math.round(m.cost * 100) / 100}
                          oninput={(e) => { sub.quote.materials[mi].cost = parseFloat(e.currentTarget.value) || 0; recalcTotals(); }}
                          class="w-20 text-right rounded border border-gray-300 px-2 py-0.5 text-xs focus:border-blue-500 outline-none"
                        />
                      {:else}
                        <span>${fmt(m.cost)}</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="flex justify-between pt-2 text-lg font-bold text-green-700 border-t border-gray-200">
                <span>Grand Total</span>
                <span>${fmt(sub.quote.grand_total || 0)}</span>
              </div>

              <!-- Sub Estimate View -->
              {#if data.tenant.sub_mode_enabled}
                {@const subMarginMult = 1 + (data.tenant.sub_margin ?? 0.10)}
                {@const subLaborTotal = sub.quote.sections.reduce((s, sec) => s + sec.sub_cost, 0) * subMarginMult}
                {@const subSurcharges = sub.quote.surcharges.reduce((s, x) => s + x.sub_amount, 0) * subMarginMult}
                {@const subGrandTotal = subLaborTotal + subSurcharges + (sub.quote.materials_total || 0)}
                <div class="mt-4 pt-4 border-t-2 border-dashed border-blue-200">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Sub Estimate</span>
                    <span class="text-xs text-gray-400">Your price when bidding to a GC ({Math.round((data.tenant.sub_margin ?? 0.10) * 100)}% margin)</span>
                  </div>
                  {#each sub.quote.sections || [] as section}
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{section.label}</span>
                      <span>${fmt(section.sub_cost * subMarginMult)}</span>
                    </div>
                  {/each}
                  <div class="flex justify-between pt-2 text-base font-bold text-blue-700 border-t border-blue-200 mt-2">
                    <span>Sub Total</span>
                    <span>${fmt(subGrandTotal)}</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-2">This is what you'd bid to a general contractor for this scope. Materials at cost, labor at your sub rate.</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Production -->
          {#if sub.quote.production?.painting_hours > 0}
            {@const hrs = sub.quote.production.painting_hours}
            {@const days = sub.quote.production.duration_days}
            {@const hrsLow = Math.max(1, Math.round(hrs * 0.80))}
            {@const hrsHigh = Math.max(hrsLow + 1, Math.round(hrs * 1.20))}
            {@const daysLow = Math.max(0.5, Math.round(days * 0.80 * 2) * 0.5)}
            {@const daysHigh = Math.max(daysLow + 0.5, Math.round(days * 1.20 * 2) * 0.5)}
            <div class="rounded-xl bg-white border border-gray-200 p-6">
              <h2 class="font-semibold text-gray-900 mb-3">Production Estimate</h2>
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">Hours:</span> <span class="font-medium">{hrsLow}-{hrsHigh}</span></div>
                <div><span class="text-gray-500">Crew:</span> <span class="font-medium">{sub.quote.production.crew_size}-person</span></div>
                <div><span class="text-gray-500">Duration:</span> <span class="font-medium">{daysLow}-{daysHigh} days</span></div>
              </div>
            </div>
          {/if}

          <!-- Notes -->
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-3">Notes</h2>
            <textarea bind:value={notes} rows={4} placeholder="Internal notes about this estimate..." class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 mb-2"></textarea>
            <button onclick={saveNotes} disabled={saving} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          <!-- Estimate Insights (ML teaser) -->
          <div class="rounded-xl bg-white border border-gray-200 p-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-gray-900">Estimate Insights</h2>
              {#if !data.isPro}
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Pro</span>
              {/if}
            </div>
            {#if data.isPro && data.estimateCount >= 10}
              <p class="text-xs text-gray-500 mb-3">Based on your {data.estimateCount} estimates:</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Your avg {sub.trade_type} estimate</span>
                  <span class="text-gray-400 italic">Coming soon</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Win rate ({sub.trade_type})</span>
                  <span class="text-gray-400 italic">Coming soon</span>
                </div>
              </div>
            {:else if data.isPro}
              <p class="text-xs text-gray-500">We're building your benchmark. Insights appear after 10 estimates ({data.estimateCount} so far).</p>
            {:else}
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Estimated range for this project</span>
                  <span class="blur-sm select-none text-gray-700 font-medium">$14,200 – $15,800</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Win probability</span>
                  <span class="blur-sm select-none text-gray-700 font-medium">78%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Suggested crew &amp; duration</span>
                  <span class="blur-sm select-none text-gray-700 font-medium">3-person, 4.5 days</span>
                </div>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
              <div class="mt-4 relative z-10">
                <a href="/upgrade" class="block w-full rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 text-center">See Full Insights</a>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right sidebar: actions -->
      <div class="space-y-4">
        <!-- Primary Action -->
        <div class="rounded-xl bg-white border border-gray-200 p-5 space-y-2">
          {#if sub.estimate_status === 'draft'}
            <button onclick={sendToClient} class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Send to Client
            </button>
          {:else if sub.estimate_status === 'sent' || sub.estimate_status === 'viewed'}
            <button onclick={sendToClient} class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Resend / Follow Up
            </button>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick={() => showAcceptModal = true} class="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Won
              </button>
              <button onclick={() => showDeclineModal = true} class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                Lost
              </button>
            </div>
          {:else if sub.estimate_status === 'accepted'}
            <div class="text-center py-2">
              <div class="text-sm font-semibold text-green-700">Won</div>
              {#if sub.close_price && sub.close_price !== sub.sales_price}
                <div class="text-xs text-gray-500 mt-1">Closed at ${fmt(sub.close_price)}</div>
              {/if}
            </div>
          {:else if sub.estimate_status === 'declined'}
            <div class="text-center py-2">
              <div class="text-sm font-semibold text-red-600">Lost</div>
              {#if sub.decline_reason}
                <div class="text-xs text-gray-500 mt-1">{sub.decline_reason}</div>
              {/if}
            </div>
          {:else}
            <button onclick={sendToClient} class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Resend Estimate
            </button>
          {/if}
        </div>

        <!-- Price Adjustment -->
        <div class="rounded-xl bg-white border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-1">Price Adjustment</h3>
          <p class="text-xs text-gray-400 mb-3">Change the total and regenerate — all line items adjust proportionally.</p>
          <div class="space-y-3">
            <div>
              <label for="detail-price" class="block text-xs text-gray-500 mb-1">Set Total Price ($)</label>
              <input id="detail-price" type="number" bind:value={adjustedPrice} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            {#if priceChanged}
              {@const adj = parseFloat(adjustedPrice) || 0}
              {@const diff = adj - originalPrice}
              {@const pct = Math.round((diff / originalPrice) * 100)}
              <div class="rounded-lg bg-gray-50 p-3 text-xs space-y-1">
                <div class="flex justify-between text-gray-500">
                  <span>Calculated total</span>
                  <span>${fmt(originalPrice)}</span>
                </div>
                <div class="flex justify-between font-medium {diff > 0 ? 'text-green-700' : 'text-red-700'}">
                  <span>{diff > 0 ? 'Markup' : 'Discount'}</span>
                  <span>{diff > 0 ? '+' : ''}{pct}% ({diff > 0 ? '+' : ''}${fmt(diff)})</span>
                </div>
                <div class="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Final price</span>
                  <span>${fmt(adj)}</span>
                </div>
              </div>
              <p class="text-xs text-gray-400">The adjustment appears as a {diff > 0 ? 'markup' : 'discount'} line on the estimate. Line item prices stay the same.</p>
              <button
                onclick={regenerateEstimate}
                disabled={regenerating}
                class="w-full rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate Estimate'}
              </button>
            {/if}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="rounded-xl bg-white border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>

          <!-- Document generation warning -->
          {#if !sub.estimate_pdf_url || (data.tenant.output_format && !sub.google_doc_url)}
            <div class="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-yellow-800">Document generation failed or hasn't completed.</p>
                  <p class="text-xs text-yellow-700 mt-0.5">
                    Missing: {[!sub.estimate_pdf_url ? 'PDF' : '', (data.tenant.output_format && !sub.google_doc_url) ? (data.tenant.output_format === 'google_sheets' ? 'Google Sheet' : 'Google Doc') : ''].filter(Boolean).join(', ')}
                  </p>
                  {#if docRegenError}
                    <p class="text-xs text-red-600 mt-1">{docRegenError}</p>
                  {/if}
                </div>
              </div>
              <button
                onclick={regenerateDocuments}
                disabled={regeneratingDoc}
                class="mt-2 w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {#if regeneratingDoc}
                  <svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Regenerating...
                {:else}
                  Regenerate Documents
                {/if}
              </button>
            </div>
          {/if}

          <div class="grid grid-cols-2 gap-2">
            {#if sub.google_doc_url}
              <a href={sub.google_doc_url} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {googleLinkLabel}
              </a>
            {:else}
              <button onclick={regenerateDocuments} disabled={regeneratingDoc} class="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50">
                {regeneratingDoc ? 'Generating...' : 'Generate Doc'}
              </button>
            {/if}
            {#if sub.estimate_pdf_url}
              <a href={sub.estimate_pdf_url} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Download PDF
              </a>
            {:else}
              <button onclick={regenerateDocuments} disabled={regeneratingDoc} class="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50">
                {regeneratingDoc ? 'Generating...' : 'Generate PDF'}
              </button>
            {/if}
            <button onclick={duplicateEstimate} class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Duplicate
            </button>
            <button onclick={() => showDeleteConfirm = true} class="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
        </div>

        <!-- Project Snapshot -->
        <div bind:this={snapshotPanel} class="rounded-xl bg-white border p-5 transition-all duration-500 {sub.estimate_status === 'accepted' && justMarkedWon ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'}">
          <h3 class="text-sm font-semibold text-gray-900 mb-1">Project Snapshot</h3>
          {#if sub.estimate_status === 'accepted' && !snapshotUrl}
            <p class="text-xs text-green-700 font-medium mb-3">Next step: Generate a Project Snapshot to share with your crew via text, WhatsApp, or print.</p>
          {:else}
            <p class="text-xs text-gray-500 mb-3">Crew-facing document with scope, materials, and hours. No pricing.</p>
          {/if}
          <div class="flex gap-2 mb-3">
            <select bind:value={snapshotLang} class="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs">
              {#each SNAPSHOT_LANGS as lang}
                <option value={lang.code}>{lang.label}</option>
              {/each}
            </select>
            <button onclick={generateSnapshot} disabled={generatingSnapshot} class="rounded-lg {sub.estimate_status === 'accepted' && !snapshotUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'} px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {generatingSnapshot ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {#if snapshotUrl || snapshotDocUrl}
            <div class="grid grid-cols-2 gap-2">
              {#if snapshotUrl}
                <a href={snapshotUrl} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Download PDF
                </a>
              {/if}
              {#if snapshotDocUrl}
                <a href={snapshotDocUrl} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Open Sheet
                </a>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Version History (collapsible) -->
        {#if sub.previous_versions && sub.previous_versions.length > 0}
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div onclick={() => showVersionHistory = !showVersionHistory} class="flex items-center justify-between w-full cursor-pointer">
              <h3 class="text-sm font-semibold text-gray-900">Version History</h3>
              <svg class="w-4 h-4 text-gray-400 transition-transform {showVersionHistory ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div class="mt-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-blue-600">v{sub.version || 1} (current)</span>
                <span class="text-gray-500">${fmt(sub.sales_price || 0)}</span>
              </div>
              {#if showVersionHistory}
                {#each [...sub.previous_versions].reverse() as pv}
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>v{pv.version}</span>
                    <span>${fmt(pv.sales_price || 0)}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}

        <!-- Scheduled Start (Pro teaser / functional for Pro) -->
        <div class="rounded-xl border {data.isPro ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 opacity-75'} p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold {data.isPro ? 'text-gray-900' : 'text-gray-500'}">Scheduled Start</h3>
            {#if !data.isPro}
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Pro</span>
            {/if}
          </div>
          {#if data.isPro}
            <p class="text-xs text-gray-500 mb-3">Set a start date and assign a crew for this project.</p>
            <div class="space-y-2">
              <input type="date" value={sub.scheduled_start_date || ''} onchange={async (e) => {
                const val = e.currentTarget.value;
                await fetch(`/api/submissions/${sub.id}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduled_start_date: val }) });
                sub.scheduled_start_date = val;
              }} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
              <input type="text" value={sub.assigned_crew || ''} placeholder="Crew name or size" onchange={async (e) => {
                const val = e.currentTarget.value;
                await fetch(`/api/submissions/${sub.id}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assigned_crew: val }) });
                sub.assigned_crew = val;
              }} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
            </div>
          {:else}
            <p class="text-xs text-gray-400 mb-3">Set a start date, assign crew, and sync to your calendar.</p>
            <a href="/upgrade" class="block w-full rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 text-center">Learn about GQ Pro</a>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}>
      <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl" onclick={(e) => e.stopPropagation()}>
        <h3 class="font-semibold text-gray-900 mb-2">Delete Estimate?</h3>
        <p class="text-sm text-gray-500 mb-3">This will permanently delete estimate {sub.id.slice(0, 8).toUpperCase()} for {sub.first_name} {sub.last_name}. This cannot be undone.</p>
        <div class="mb-4">
          <label for="delete-confirm" class="block text-xs font-medium text-gray-700 mb-1">Type <span class="font-bold text-red-600">DELETE</span> to confirm</label>
          <input id="delete-confirm" type="text" bind:value={deleteConfirmText} placeholder="DELETE" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500" autocomplete="off" />
        </div>
        <div class="flex gap-3">
          <button onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onclick={deleteEstimate} disabled={deleting || deleteConfirmText !== 'DELETE'} class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Accept Modal -->
  {#if showAcceptModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showAcceptModal = false}>
      <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl" onclick={(e) => e.stopPropagation()}>
        <h3 class="font-semibold text-gray-900 mb-2">Mark as Won</h3>
        <p class="text-sm text-gray-500 mb-4">Did the client accept at the estimated price, or a different amount?</p>
        <div class="mb-4">
          <label for="close-price" class="block text-sm font-medium text-gray-700 mb-1">Close Price ($)</label>
          <input id="close-price" type="number" bind:value={closePrice} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">Leave as-is if they accepted the estimate price.</p>
        </div>
        <div class="flex gap-3">
          <button onclick={() => showAcceptModal = false} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onclick={markAccepted} class="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Confirm Won</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Decline Modal -->
  {#if showDeclineModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showDeclineModal = false}>
      <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl" onclick={(e) => e.stopPropagation()}>
        <h3 class="font-semibold text-gray-900 mb-2">Mark as Lost</h3>
        <p class="text-sm text-gray-500 mb-4">What happened?</p>
        <div class="space-y-2 mb-4">
          {#each DECLINE_REASONS as reason}
            <button
              onclick={() => declineReason = reason}
              class="w-full text-left rounded-lg border px-3 py-2 text-sm {declineReason === reason ? 'border-red-500 bg-red-50 text-red-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}"
            >
              {reason}
            </button>
          {/each}
        </div>
        <div class="flex gap-3">
          <button onclick={() => showDeclineModal = false} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onclick={markDeclined} disabled={!declineReason} class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Confirm Lost</button>
        </div>
      </div>
    </div>
  {/if}
</div>
