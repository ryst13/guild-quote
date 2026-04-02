<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  let tradeFilter = $state('all');
  let statusFilter = $state('all');

  let filteredSubmissions = $derived(
    data.submissions.filter(s => {
      if (tradeFilter !== 'all' && s.trade_type !== tradeFilter) return false;
      if (statusFilter !== 'all' && s.estimate_status !== statusFilter) return false;
      return true;
    })
  );

  // Action-needed counts
  let draftsCount = $derived(data.submissions.filter(s => s.estimate_status === 'draft').length);
  let sentCount = $derived(data.submissions.filter(s => s.estimate_status === 'sent').length);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    expired: 'bg-yellow-100 text-yellow-700',
  };

  const filterActiveColors: Record<string, string> = {
    draft: 'bg-gray-700 text-white',
    sent: 'bg-blue-600 text-white',
    accepted: 'bg-green-600 text-white',
    declined: 'bg-red-600 text-white',
  };

  const tradeLabels: Record<string, string> = {
    interior: 'Interior',
    exterior: 'Exterior',
    epoxy: 'Epoxy',
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

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
      <div class="flex items-center gap-1">
        <a href="/dashboard/settings/profile" class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">Profile</a>
        <a href="/dashboard/settings/pricing" class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">Pricing</a>
        <a href="/dashboard/settings/catalog" class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">Catalog</a>
        <span class="text-gray-200 mx-1">|</span>
        <button onclick={logout} class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">Log out</button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Action-needed banner (only shows when there are drafts or unsent) -->
    {#if draftsCount > 0 || sentCount > 0}
      <div class="flex gap-3 mb-6">
        {#if draftsCount > 0}
          <button onclick={() => { statusFilter = 'draft'; tradeFilter = 'all'; }}
            class="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm hover:bg-yellow-100">
            <span class="font-semibold text-yellow-800">{draftsCount}</span>
            <span class="text-yellow-700">{draftsCount === 1 ? 'draft' : 'drafts'} not sent</span>
          </button>
        {/if}
        {#if sentCount > 0}
          <button onclick={() => { statusFilter = 'sent'; tradeFilter = 'all'; }}
            class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm hover:bg-blue-100">
            <span class="font-semibold text-blue-800">{sentCount}</span>
            <span class="text-blue-700">sent, awaiting response</span>
          </button>
        {/if}
      </div>
    {/if}

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

    <!-- Pro Tease: Pipeline + Analytics (subtle, between analytics and table) -->
    {#if !data.benchmarks}
      <div class="rounded-xl border border-dashed border-gray-200 bg-white p-4 mb-6 flex items-center justify-between opacity-80">
        <div>
          <span class="text-sm text-gray-500">With <span class="font-semibold text-blue-600">GQ Pro</span>: job pipeline, payment tracking, scheduling, follow-up automation, and analytics.</span>
        </div>
        <a href="/upgrade" class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap ml-4 hover:bg-blue-200">Learn More</a>
      </div>
    {/if}

    <!-- Self-Benchmarking (shows after 10+ estimates) -->
    {#if data.benchmarks}
      <div class="rounded-xl bg-white border border-gray-200 p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-900">Your Pricing Benchmarks</h3>
          <span class="text-xs text-gray-400">{data.benchmarks.totalEstimates} estimates</span>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-gray-500">Average estimate</div>
            <div class="text-lg font-bold text-gray-900">${data.benchmarks.avgEstimate.toLocaleString()}</div>
          </div>
          {#each Object.entries(data.benchmarks.tradeAvgs) as [trade, stats]}
            {#if stats.count >= 3}
              <div>
                <div class="text-xs text-gray-500 capitalize">{trade} avg</div>
                <div class="text-lg font-bold text-gray-900">${stats.avg.toLocaleString()}</div>
                <div class="text-xs text-gray-400">{stats.winRate}% won &middot; {stats.count} estimates</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Estimates Table -->
    <div class="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="font-semibold text-gray-900">Estimates</h2>
          <!-- Trade filter -->
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
          <span class="text-gray-300">|</span>
          <!-- Status filter -->
          <div class="flex gap-1">
            <button onclick={() => statusFilter = 'all'}
              class="px-3 py-1 text-xs font-medium rounded-full {statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
              All
            </button>
            {#each ['draft', 'sent', 'accepted', 'declined'] as status}
              <button onclick={() => statusFilter = status}
                class="px-3 py-1 text-xs font-medium rounded-full {statusFilter === status ? filterActiveColors[status] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            {/each}
          </div>
        </div>
        <a href="/dashboard/new" class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          + New Estimate
        </a>
      </div>

      {#if data.submissions.length === 0}
        <!-- Empty state: funnel to creation -->
        <div class="p-16 text-center">
          <div class="text-4xl mb-4">&#128196;</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Create your first estimate</h3>
          <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Scope a job, generate a professional estimate, and send it to your client in minutes.</p>
          <a href="/dashboard/new" class="inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            + New Estimate
          </a>
        </div>
      {:else if filteredSubmissions.length === 0}
        <div class="p-12 text-center">
          <p class="text-gray-500">No estimates match these filters.</p>
          <button onclick={() => { tradeFilter = 'all'; statusFilter = 'all'; }} class="mt-2 text-sm text-blue-600 hover:text-blue-700">Clear filters</button>
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
                <th class="px-4 py-2 text-left font-medium text-gray-500">Created</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each filteredSubmissions as sub}
                <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onclick={() => window.location.href = `/dashboard/${sub.id}`}>
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">{sub.first_name} {sub.last_name}</div>
                    {#if sub.email}<div class="text-xs text-gray-500">{sub.email}</div>{/if}
                  </td>
                  <td class="px-4 py-3 text-gray-700">{sub.address}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {tradeLabels[sub.trade_type] || sub.trade_type}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-gray-900">{sub.sales_price ? `$${Math.round(sub.sales_price).toLocaleString()}` : '—'}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[sub.estimate_status] || 'bg-gray-100 text-gray-700'}">
                      {sub.estimate_status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{timeAgo(sub.created_at)}</td>
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
