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
  let selectedStage = $state(sub.stage_key);

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
        stage_key: selectedStage,
      }),
    });
    if (res.ok) {
      saved = true;
      setTimeout(() => { saved = false; }, 2000);
    }
    saving = false;
  }

  async function approveQuote() {
    saving = true;
    await fetch(`/api/submissions/${sub.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimator_approved: true, stage_key: 'approved' }),
    });
    sub = { ...sub, estimator_approved: true, stage_key: 'approved' };
    selectedStage = 'approved';
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function sendStatusEmail() {
    await fetch(`/api/submissions/${sub.id}/notify`, { method: 'POST' });
    alert('Status update email sent!');
  }
</script>

<svelte:head>
  <title>Submission {sub.id.slice(0, 8)} — Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
      <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
      <h1 class="font-bold text-gray-900">Submission {sub.id.slice(0, 8).toUpperCase()}</h1>
      {#if saved}
        <span class="text-sm text-green-600 font-medium">Saved!</span>
      {/if}
    </div>
  </div>

  <div class="mx-auto max-w-5xl px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
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

        <!-- Room Breakdown -->
        {#if sub.quote}
          <div class="rounded-xl bg-white border border-gray-200 p-6">
            <h2 class="font-semibold text-gray-900 mb-3">Quote Breakdown</h2>
            <div class="space-y-3">
              {#each sub.quote.rooms as room}
                <div class="flex justify-between items-start py-2 border-b border-gray-100">
                  <div>
                    <span class="font-medium text-gray-900">{room.room_label}</span>
                    {#each room.modifiers as mod}
                      <div class="text-xs text-gray-500 ml-2">{mod.label}: +${mod.amount.toLocaleString()}</div>
                    {/each}
                  </div>
                  <span class="font-medium">${room.subtotal.toLocaleString()}</span>
                </div>
              {/each}
              {#each sub.quote.project_adders as adder}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-700">{adder.label}</span>
                  <span>${adder.amount.toLocaleString()}</span>
                </div>
              {/each}
              <div class="flex justify-between pt-2 text-lg font-bold">
                <span>Total</span>
                <span>${sub.quote.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Rooms Detail -->
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h2 class="font-semibold text-gray-900 mb-3">Rooms ({sub.rooms.length})</h2>
          <div class="space-y-3">
            {#each sub.rooms as room}
              <div class="rounded-lg bg-gray-50 p-3 text-sm">
                <div class="font-medium text-gray-900">{room.room_name || room.room_type} — {room.room_size}</div>
                <div class="text-gray-500 mt-1">
                  Ceiling: {room.ceiling_height} | Condition: {room.condition}
                  {#if room.surfaces.walls} | Walls{/if}
                  {#if room.surfaces.ceiling} | Ceiling{/if}
                  {#if room.surfaces.trim} | Trim{/if}
                  {#if room.surfaces.doors > 0} | {room.surfaces.doors} door(s){/if}
                  {#if room.surfaces.windows > 0} | {room.surfaces.windows} window(s){/if}
                </div>
                {#if room.notes}
                  <div class="text-gray-500 mt-1 italic">{room.notes}</div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Sidebar Actions -->
      <div class="space-y-6">
        <div class="rounded-xl bg-white border border-gray-200 p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Actions</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Adjusted price ($)</label>
              <input type="number" bind:value={adjustedPrice} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea bind:value={notes} rows={3} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Assign crew</label>
              <input type="text" bind:value={assignedCrew} placeholder="Crew name or member" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled start</label>
              <input type="date" bind:value={scheduledDate} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select bind:value={selectedStage} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none">
                {#each data.stages as stage}
                  <option value={stage.key}>{stage.label}</option>
                {/each}
              </select>
            </div>

            <div class="flex flex-col gap-2 pt-2">
              <button onclick={saveChanges} disabled={saving} class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {#if !sub.estimator_approved}
                <button onclick={approveQuote} disabled={saving} class="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  Approve Quote
                </button>
              {/if}
              <button onclick={sendStatusEmail} class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Send Status Email
              </button>
            </div>
          </div>
        </div>

        <!-- PDF -->
        {#if sub.estimate_pdf_url}
          <a href={sub.estimate_pdf_url} target="_blank" class="block rounded-xl bg-white border border-gray-200 p-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50">
            Download Estimate PDF
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
