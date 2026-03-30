<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let sub = $state(data.submission);
  let saving = $state(false);
  let saved = $state(false);

  let adjustedPrice = $state(sub.sales_price?.toString() || '');
  let notes = $state(sub.estimator_notes || '');
  let assignedCrew = $state(sub.assigned_crew || '');
  let scheduledDate = $state(sub.scheduled_start_date || '');
  let selectedStatus = $state(sub.estimate_status);

  const statusOptions = ['draft', 'sent', 'viewed', 'accepted', 'declined'];
  const tradeLabels: Record<string, string> = { interior: 'Interior Painting', exterior: 'Exterior Painting', epoxy: 'Epoxy & Garage Coatings' };

  async function saveChanges() {
    saving = true;
    const res = await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sales_price: parseFloat(adjustedPrice) || null,
        estimator_notes: notes,
        assigned_crew: assignedCrew,
        scheduled_start_date: scheduledDate || null,
        estimate_status: selectedStatus,
      }),
    });
    if (res.ok) {
      saved = true;
      setTimeout(() => { saved = false; }, 2000);
    }
    saving = false;
  }

  async function sendNotification() {
    await fetch(`/api/submissions/${sub.id}/notify`, { method: 'POST' });
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
      {#if saved}
        <span class="text-sm text-green-600 font-medium">Saved!</span>
      {/if}
    </div>
  </div>

  <div class="mx-auto max-w-5xl px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Client Info -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h2 class="font-semibold text-gray-900 mb-3">Client Information</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-gray-500">Name:</span> <span class="text-gray-900">{sub.first_name} {sub.last_name}</span></div>
            <div><span class="text-gray-500">Email:</span> <span class="text-gray-900">{sub.email}</span></div>
            <div><span class="text-gray-500">Phone:</span> <span class="text-gray-900">{sub.phone || '-'}</span></div>
            <div><span class="text-gray-500">Address:</span> <span class="text-gray-900">{sub.address}</span></div>
          </div>
        </div>

        <!-- Quote Breakdown -->
        {#if sub.quote}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-3">Quote Breakdown</h2>
            <div class="space-y-3">
              {#each sub.quote.sections || [] as section}
                <div class="py-2 border-b border-gray-100">
                  <div class="flex justify-between font-medium text-gray-900">
                    <span>{section.label}</span>
                    <span>${Math.round(section.sales_price).toLocaleString()}</span>
                  </div>
                  {#each section.items || [] as item}
                    <div class="flex justify-between text-xs text-gray-500 ml-3">
                      <span>{item.label} x{item.quantity}</span>
                      <span>${Math.round(item.sales_price).toLocaleString()}</span>
                    </div>
                  {/each}
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
            <div class="rounded-xl bg-white border border-gray-200 p-6">
              <h2 class="font-semibold text-gray-900 mb-3">Production Estimate</h2>
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">Hours:</span> <span class="font-medium">{sub.quote.production.painting_hours.toFixed(1)}</span></div>
                <div><span class="text-gray-500">Crew:</span> <span class="font-medium">{sub.quote.production.crew_size}-person</span></div>
                <div><span class="text-gray-500">Duration:</span> <span class="font-medium">~{sub.quote.production.duration_days.toFixed(1)} days</span></div>
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Actions</h2>
          <div class="space-y-4">
            <div>
              <label for="detail-price" class="block text-sm font-medium text-gray-700 mb-1">Adjusted price ($)</label>
              <input id="detail-price" type="number" bind:value={adjustedPrice} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label for="detail-status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="detail-status" bind:value={selectedStatus} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
                {#each statusOptions as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="detail-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="detail-notes" bind:value={notes} rows={3} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"></textarea>
            </div>
            <div>
              <label for="detail-crew" class="block text-sm font-medium text-gray-700 mb-1">Assign crew</label>
              <input id="detail-crew" type="text" bind:value={assignedCrew} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label for="detail-date" class="block text-sm font-medium text-gray-700 mb-1">Scheduled start</label>
              <input id="detail-date" type="date" bind:value={scheduledDate} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>

            <div class="flex flex-col gap-2 pt-2">
              <button onclick={saveChanges} disabled={saving} class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onclick={sendNotification} class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Send Email Notification
              </button>
            </div>
          </div>
        </div>

        <!-- Links -->
        {#if sub.google_doc_url}
          <a href={sub.google_doc_url} target="_blank" class="block rounded-xl bg-white border border-gray-200 p-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50">
            Open Google Doc
          </a>
        {/if}
        {#if sub.estimate_pdf_url}
          <a href={sub.estimate_pdf_url} target="_blank" class="block rounded-xl bg-white border border-gray-200 p-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50">
            Download PDF
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
