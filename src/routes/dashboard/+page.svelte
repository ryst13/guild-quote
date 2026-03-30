<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  let tradeFilter = $state('all');

  let filteredSubmissions = $derived(
    tradeFilter === 'all'
      ? data.submissions
      : data.submissions.filter(s => s.trade_type === tradeFilter)
  );

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };

  const tradeLabels: Record<string, string> = {
    interior: 'Interior',
    exterior: 'Exterior',
    epoxy: 'Epoxy',
  };

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  }
</script>

<svelte:head>
  <title>Dashboard — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="font-bold text-gray-900">GuildQuote</span>
        <span class="text-sm text-gray-400">|</span>
        <span class="text-sm text-gray-600">{data.tenant.company_name}</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/dashboard/settings/catalog" class="text-sm text-gray-500 hover:text-gray-700">Settings</a>
        <button onclick={logout} class="text-sm text-gray-500 hover:text-gray-700">Log out</button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Analytics -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Estimates this month</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{data.analytics.quotesThisMonth}</div>
      </div>
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total value</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">${data.analytics.totalValue.toLocaleString()}</div>
      </div>
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Acceptance rate</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{data.analytics.conversionRate}%</div>
      </div>
    </div>

    <!-- Estimates Table -->
    <div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="font-semibold text-gray-900">Estimates</h2>
          <!-- Trade filter tabs -->
          <div class="flex gap-1">
            <button onclick={() => tradeFilter = 'all'}
              class="px-3 py-1 text-xs font-medium rounded-full {tradeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
              All
            </button>
            {#each data.tenant.enabled_trades as trade}
              <button onclick={() => tradeFilter = trade}
                class="px-3 py-1 text-xs font-medium rounded-full {tradeFilter === trade ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                {tradeLabels[trade] || trade}
              </button>
            {/each}
          </div>
        </div>
        <a href="/dashboard/new" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + New Estimate
        </a>
      </div>

      {#if filteredSubmissions.length === 0}
        <div class="p-12 text-center">
          <p class="text-gray-500 mb-2">No estimates yet.</p>
          <p class="text-sm text-gray-400">Create your first estimate to get started.</p>
          <a href="/dashboard/new" class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            + New Estimate
          </a>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Address</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Trade</th>
                <th class="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each filteredSubmissions as sub}
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">{sub.first_name} {sub.last_name}</div>
                    <div class="text-xs text-gray-500">{sub.email}</div>
                  </td>
                  <td class="px-4 py-3 text-gray-700">{sub.address}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {tradeLabels[sub.trade_type] || sub.trade_type}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-gray-900">{sub.sales_price ? `$${Math.round(sub.sales_price).toLocaleString()}` : '-'}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[sub.estimate_status] || 'bg-gray-100 text-gray-800'}">
                      {sub.estimate_status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                  <td class="px-4 py-3">
                    <a href="/dashboard/{sub.id}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View</a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>
