<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let filter = $state('all');
  let editingId = $state<string | null>(null);
  let editPlan = $state('trial');
  let editStatus = $state('trialing');
  let editTrialDays = $state(14);
  let saving = $state(false);

  const filteredTenants = $derived(
    filter === 'all' ? data.tenants :
    filter === 'lifetime' ? data.tenants.filter(t => t.lifetime_access) :
    data.tenants.filter(t => t.payment_status === filter)
  );

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function startEdit(tenant: typeof data.tenants[0]) {
    editingId = tenant.id;
    editPlan = tenant.plan;
    editStatus = tenant.payment_status;
    const daysLeft = tenant.trial_ends_at ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;
    editTrialDays = daysLeft;
  }

  async function saveEdit(tenantId: string) {
    saving = true;
    const trialEnd = new Date(Date.now() + editTrialDays * 86400000).toISOString();
    await fetch(`/api/admin/tenants/${tenantId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: editPlan, payment_status: editStatus, trial_ends_at: trialEnd }),
    });
    saving = false;
    editingId = null;
    window.location.reload();
  }

  async function toggleLifetime(tenantId: string, current: boolean) {
    await fetch(`/api/admin/tenants/${tenantId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifetime_access: !current }),
    });
    window.location.reload();
  }
</script>

<svelte:head>
  <title>Admin — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="font-bold text-gray-900">Platform Admin</h1>
      </div>
      <div class="flex items-center gap-3">
        <a href="/dashboard/settings/profile" class="text-sm text-gray-500 hover:text-gray-700">Profile</a>
        <a href="/dashboard/settings/pricing" class="text-sm text-gray-500 hover:text-gray-700">Pricing</a>
        <a href="/dashboard/settings/catalog" class="text-sm text-gray-500 hover:text-gray-700">Catalog</a>
        <a href="/dashboard/settings/billing" class="text-sm text-gray-500 hover:text-gray-700">Billing</a>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Stats -->
    <div class="grid grid-cols-5 gap-4 mb-6">
      <button onclick={() => filter = 'all'} class="rounded-xl bg-white border p-4 text-center {filter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}">
        <div class="text-2xl font-bold text-gray-900">{data.stats.total}</div>
        <div class="text-xs text-gray-500">Total</div>
      </button>
      <button onclick={() => filter = 'trialing'} class="rounded-xl bg-white border p-4 text-center {filter === 'trialing' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}">
        <div class="text-2xl font-bold text-orange-600">{data.stats.trialing}</div>
        <div class="text-xs text-gray-500">Trialing</div>
      </button>
      <button onclick={() => filter = 'active'} class="rounded-xl bg-white border p-4 text-center {filter === 'active' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}">
        <div class="text-2xl font-bold text-green-600">{data.stats.active}</div>
        <div class="text-xs text-gray-500">Active</div>
      </button>
      <button onclick={() => filter = 'canceled'} class="rounded-xl bg-white border p-4 text-center {filter === 'canceled' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}">
        <div class="text-2xl font-bold text-red-600">{data.stats.canceled}</div>
        <div class="text-xs text-gray-500">Canceled</div>
      </button>
      <button onclick={() => filter = 'lifetime'} class="rounded-xl bg-white border p-4 text-center {filter === 'lifetime' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}">
        <div class="text-2xl font-bold text-purple-600">{data.stats.lifetime}</div>
        <div class="text-xs text-gray-500">Lifetime</div>
      </button>
    </div>

    <!-- Tenant Table -->
    <div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Company</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-500">Estimates</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Trial Ends</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredTenants as tenant}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{tenant.company_name}</td>
              <td class="px-4 py-3 text-gray-600">{tenant.contact_email}</td>
              <td class="px-4 py-3">
                {#if editingId === tenant.id}
                  <select bind:value={editPlan} class="rounded border border-gray-300 px-2 py-1 text-xs">
                    <option value="trial">Trial</option>
                    <option value="gq">GQ</option>
                    <option value="gq_pro">Pro</option>
                  </select>
                {:else}
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                    {tenant.plan === 'gq_pro' ? 'bg-blue-100 text-blue-700' : tenant.plan === 'gq' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}">
                    {tenant.plan === 'gq_pro' ? 'Pro' : tenant.plan === 'gq' ? 'GQ' : 'Trial'}
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3">
                {#if editingId === tenant.id}
                  <select bind:value={editStatus} class="rounded border border-gray-300 px-2 py-1 text-xs">
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="none">None</option>
                  </select>
                {:else}
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                    {tenant.payment_status === 'active' ? 'bg-green-100 text-green-700' :
                     tenant.payment_status === 'trialing' ? 'bg-orange-100 text-orange-700' :
                     tenant.payment_status === 'past_due' ? 'bg-red-100 text-red-700' :
                     'bg-gray-100 text-gray-700'}">
                    {tenant.lifetime_access ? 'Lifetime' : tenant.payment_status}
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 text-right text-gray-600">{tenant.estimates_count}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">
                {#if editingId === tenant.id}
                  <div class="flex items-center gap-1">
                    <input type="number" bind:value={editTrialDays} min="0" max="365" class="w-14 rounded border border-gray-300 px-2 py-1 text-xs" />
                    <span class="text-xs">days</span>
                  </div>
                {:else}
                  {formatDate(tenant.trial_ends_at)}
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{formatDate(tenant.created_at)}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  {#if editingId === tenant.id}
                    <button onclick={() => saveEdit(tenant.id)} disabled={saving} class="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onclick={() => editingId = null} class="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  {:else}
                    <button onclick={() => startEdit(tenant)} class="text-xs font-medium text-blue-600 hover:text-blue-700">Edit</button>
                    <button
                      onclick={() => toggleLifetime(tenant.id, tenant.lifetime_access)}
                      class="text-xs font-medium {tenant.lifetime_access ? 'text-purple-600 hover:text-purple-700' : 'text-gray-500 hover:text-gray-700'}"
                    >
                      {tenant.lifetime_access ? 'Revoke Lifetime' : 'Lifetime'}
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if filteredTenants.length === 0}
        <div class="p-8 text-center text-gray-400 text-sm">No contractors match this filter.</div>
      {/if}
    </div>
  </div>
</div>
