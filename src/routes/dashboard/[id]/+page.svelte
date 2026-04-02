<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let sub = $state(data.submission);
  let saving = $state(false);
  let saved = $state(false);
  let regenerating = $state(false);
  let deleting = $state(false);
  let showDeleteConfirm = $state(false);
  let showAcceptModal = $state(false);
  let showDeclineModal = $state(false);
  let closePrice = $state(sub.sales_price?.toString() || '');
  let declineReason = $state('');

  const DECLINE_REASONS = ['Price too high', 'Went with competitor', 'Project cancelled', 'Timing / scheduling', 'Scope changed', 'No response', 'Other'];

  let adjustedPrice = $state(sub.sales_price?.toString() || '');
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
    showAcceptModal = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
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
              <label class="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" bind:checked={showLineItems} class="rounded border-gray-300" />
                Show line items
              </label>
            </div>
            <div class="space-y-3">
              {#each sub.quote.sections || [] as section}
                <div class="py-2 border-b border-gray-100">
                  <div class="flex justify-between font-medium text-gray-900">
                    <span>{section.label}</span>
                    <span>${Math.round(section.sales_price).toLocaleString()}</span>
                  </div>
                  {#if showLineItems}
                    {#each section.items || [] as item}
                      <div class="flex justify-between text-xs text-gray-500 ml-3">
                        <span>{item.label} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        <span>${Math.round(item.sales_price).toLocaleString()}</span>
                      </div>
                    {/each}
                  {/if}
                </div>
              {/each}

              {#if sub.quote.surcharges?.length > 0}
                <div class="pt-2 border-t border-gray-200">
                  <div class="text-sm font-medium text-gray-700 mb-1">Surcharges</div>
                  {#each sub.quote.surcharges as s}
                    <div class="flex justify-between text-xs text-gray-500">
                      <span>{s.label}</span>
                      <span>${Math.round(s.sales_amount).toLocaleString()}</span>
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="flex justify-between pt-2 border-t border-gray-200 font-medium">
                <span>Labor Total</span>
                <span>${Math.round(sub.quote.labor_total || 0).toLocaleString()}</span>
              </div>

              {#if sub.quote.materials?.length > 0}
                <div class="pt-2">
                  <div class="text-sm font-medium text-gray-700 mb-1">Materials</div>
                  {#each sub.quote.materials as m}
                    <div class="flex justify-between text-xs text-gray-500">
                      <span>{m.label}{m.gallons ? ` (${m.gallons} gal)` : ''}</span>
                      <span>${Math.round(m.cost).toLocaleString()}</span>
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="flex justify-between pt-2 text-lg font-bold text-green-700 border-t border-gray-200">
                <span>Grand Total</span>
                <span>${Math.round(sub.quote.grand_total || 0).toLocaleString()}</span>
              </div>
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
                <div class="text-xs text-gray-500 mt-1">Closed at ${Math.round(sub.close_price).toLocaleString()}</div>
              {/if}
            </div>
            <button onclick={sendToClient} class="w-full rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Resend Estimate
            </button>
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
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Price Adjustment</h3>
          <div class="space-y-3">
            <div>
              <label for="detail-price" class="block text-xs text-gray-500 mb-1">Final Price ($)</label>
              <input id="detail-price" type="number" bind:value={adjustedPrice} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            {#if priceChanged}
              {@const adj = parseFloat(adjustedPrice) || 0}
              {@const diff = adj - originalPrice}
              {@const pct = Math.round((diff / originalPrice) * 100)}
              <div class="rounded-lg bg-gray-50 p-3 text-xs space-y-1">
                <div class="flex justify-between text-gray-500">
                  <span>Calculated total</span>
                  <span>${Math.round(originalPrice).toLocaleString()}</span>
                </div>
                <div class="flex justify-between font-medium {diff > 0 ? 'text-green-700' : 'text-red-700'}">
                  <span>{diff > 0 ? 'Markup' : 'Discount'}</span>
                  <span>{diff > 0 ? '+' : ''}{pct}% ({diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()})</span>
                </div>
                <div class="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Final price</span>
                  <span>${Math.round(adj).toLocaleString()}</span>
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
          <div class="grid grid-cols-2 gap-2">
            {#if sub.google_doc_url}
              <a href={sub.google_doc_url} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {googleLinkLabel}
              </a>
            {/if}
            {#if sub.estimate_pdf_url}
              <a href={sub.estimate_pdf_url} target="_blank" class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Download PDF
              </a>
            {/if}
            <button onclick={duplicateEstimate} class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Duplicate
            </button>
            <button onclick={() => showDeleteConfirm = true} class="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
        </div>

        <!-- Version History -->
        {#if sub.previous_versions && sub.previous_versions.length > 0}
          <div class="rounded-xl bg-white border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Version History</h3>
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-blue-600">v{sub.version || 1} (current)</span>
                <span class="text-gray-500">${Math.round(sub.sales_price || 0).toLocaleString()}</span>
              </div>
              {#each [...sub.previous_versions].reverse() as pv}
                <div class="flex justify-between text-xs text-gray-500">
                  <span>v{pv.version}</span>
                  <span>${Math.round(pv.sales_price || 0).toLocaleString()}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Notes -->
        <div class="rounded-xl bg-white border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
          <textarea bind:value={notes} rows={4} placeholder="Internal notes about this estimate..." class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 mb-2"></textarea>
          <button onclick={saveNotes} disabled={saving} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        <!-- Pro Tease: Follow-Up Automation -->
        <div class="rounded-xl border border-dashed border-gray-200 p-5 opacity-75">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-500">Follow-Up Automation</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Pro</span>
          </div>
          <p class="text-xs text-gray-400 mb-3">Automatic check-in at 2 days, follow-up at 5 days, final nudge at 14 days. Contractors who follow up close more.</p>
          <a href="/upgrade" class="block w-full rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 text-center">Learn about GQ Pro</a>
        </div>

        <!-- Pro Tease: Job Tracker -->
        <div class="rounded-xl border border-dashed border-gray-200 p-5 opacity-75">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-500">Job Tracker</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Pro</span>
          </div>
          <p class="text-xs text-gray-400">Track this job from accepted to completed. Scheduling, payments, crew assignment.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showDeleteConfirm = false}>
      <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl" onclick={(e) => e.stopPropagation()}>
        <h3 class="font-semibold text-gray-900 mb-2">Delete Estimate?</h3>
        <p class="text-sm text-gray-500 mb-4">This will permanently delete estimate {sub.id.slice(0, 8).toUpperCase()} for {sub.first_name} {sub.last_name}. This cannot be undone.</p>
        <div class="flex gap-3">
          <button onclick={() => showDeleteConfirm = false} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onclick={deleteEstimate} disabled={deleting} class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
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
