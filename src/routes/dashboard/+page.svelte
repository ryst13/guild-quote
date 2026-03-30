<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>Dashboard — Smart Quote Pro</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Top nav -->
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-xl">🎨</span>
        <span class="font-bold text-gray-900">{data.tenant.company_name}</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/dashboard/settings/catalog" class="text-sm text-gray-500 hover:text-gray-700">Settings</a>
        <button onclick={logout} class="text-sm text-gray-500 hover:text-gray-700">Log out</button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Analytics Bar -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Quotes this month</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{data.analytics.quotesThisMonth}</div>
      </div>
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total value</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">${data.analytics.totalValue.toLocaleString()}</div>
      </div>
      <div class="rounded-xl bg-white border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Conversion rate</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{data.analytics.conversionRate}%</div>
      </div>
    </div>


    <!-- Submissions Table -->
    <div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">Submissions</h2>
        <span class="text-sm text-gray-500">{data.submissions.length} total</span>
      </div>

      {#if data.submissions.length === 0}
        <div class="p-12 text-center">
          <p class="text-gray-500 mb-2">No submissions yet.</p>
          <p class="text-sm text-gray-400">Create your first estimate to get started.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Address</th>
                <th class="px-4 py-2 text-right font-medium text-gray-500">Quote</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Stage</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {#each data.submissions as sub}
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">{sub.first_name} {sub.last_name}</div>
                    <div class="text-xs text-gray-500">{sub.email}</div>
                  </td>
                  <td class="px-4 py-3 text-gray-700">{sub.address}</td>
                  <td class="px-4 py-3 text-right font-medium text-gray-900">{sub.sales_price ? `$${sub.sales_price.toLocaleString()}` : '-'}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {sub.estimator_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                      {sub.stage_key.replace(/_/g, ' ')}
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
