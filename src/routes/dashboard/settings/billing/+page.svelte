<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let loading = $state('');

  const planLabels: Record<string, string> = {
    trial: 'Free Trial',
    gq: 'GQ ($49/mo)',
    gq_pro: 'GQ Pro ($149/mo)',
  };

  const statusLabels: Record<string, string> = {
    none: 'No subscription',
    trialing: 'Free trial',
    active: 'Active',
    past_due: 'Past due',
    canceled: 'Canceled',
    expired: 'Expired',
  };

  function trialDaysText(): string {
    if (!data.trialEndsAt) return '';
    const days = Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000));
    return days === 0 ? 'Trial expired' : `${days} day${days === 1 ? '' : 's'} left`;
  }

  async function checkout(plan: 'gq' | 'gq_pro', interval: 'month' | 'year' = 'month') {
    loading = `${plan}-${interval}`;
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval }),
    });
    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    }
    loading = '';
  }

  async function openPortal() {
    loading = 'portal';
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    }
    loading = '';
  }

  function copyReferralLink() {
    if (data.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/r/${data.referralCode}`);
    }
  }
</script>

<svelte:head>
  <title>Billing — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-3 flex items-center gap-4">
      <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
      <h1 class="font-bold text-gray-900">Billing & Subscription</h1>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Current Plan -->
    <div class="rounded-xl bg-white border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Current Plan</h2>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-gray-900">{planLabels[data.plan] || data.plan}</div>
          <div class="text-sm text-gray-500 mt-1">
            Status: <span class="font-medium {data.paymentStatus === 'active' ? 'text-green-600' : data.paymentStatus === 'past_due' ? 'text-red-600' : 'text-gray-600'}">{statusLabels[data.paymentStatus] || data.paymentStatus}</span>
          </div>
          {#if data.lifetimeAccess}
            <div class="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Lifetime Access</div>
          {/if}
          {#if data.access.isTrialing}
            <div class="text-sm text-orange-600 mt-1">{trialDaysText()}</div>
          {/if}
        </div>
        {#if data.hasStripeCustomer}
          <button onclick={openPortal} disabled={loading === 'portal'} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
          </button>
        {/if}
      </div>
    </div>

    <!-- Upgrade Options -->
    {#if data.paymentStatus !== 'active' || data.plan === 'gq'}
      <div class="rounded-xl bg-white border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-900 mb-4">{data.paymentStatus === 'active' ? 'Upgrade' : 'Choose a Plan'}</h2>
        <div class="grid grid-cols-2 gap-4">
          <!-- GQ -->
          <div class="rounded-xl border border-gray-200 p-5">
            <div class="text-lg font-bold text-gray-900">GQ</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">$49<span class="text-sm font-normal text-gray-500">/mo</span></div>
            <ul class="mt-4 space-y-2 text-sm text-gray-600">
              <li>Scope entry (3 trades)</li>
              <li>Pricing engine + catalog</li>
              <li>PDF output</li>
              <li>Win/loss tracking</li>
              <li>1 user seat</li>
            </ul>
            <button
              onclick={() => checkout('gq')}
              disabled={loading !== '' || data.plan === 'gq'}
              class="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading === 'gq-month' ? 'Loading...' : data.plan === 'gq' ? 'Current Plan' : 'Subscribe — $49/mo'}
            </button>
          </div>

          <!-- GQ Pro -->
          <div class="rounded-xl border-2 border-blue-500 p-5 relative">
            <div class="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">RECOMMENDED</div>
            <div class="text-lg font-bold text-gray-900">GQ Pro</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">$149<span class="text-sm font-normal text-gray-500">/mo</span></div>
            <ul class="mt-4 space-y-2 text-sm text-gray-600">
              <li>Everything in GQ, plus:</li>
              <li>Google Docs/Sheets output</li>
              <li>Email delivery</li>
              <li>White-label branding</li>
              <li>Multilingual output</li>
              <li>Analytics dashboard</li>
              <li>3 user seats</li>
            </ul>
            <button
              onclick={() => checkout('gq_pro')}
              disabled={loading !== '' || data.plan === 'gq_pro'}
              class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'gq_pro-month' ? 'Loading...' : data.plan === 'gq_pro' ? 'Current Plan' : 'Subscribe — $149/mo'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Referral -->
    {#if data.referralCode}
      <div class="rounded-xl bg-white border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-900 mb-2">Referral Program</h2>
        <p class="text-sm text-gray-500 mb-4">Share your link. When someone signs up, you both get 1 month free.</p>
        <div class="flex gap-2">
          <input type="text" readonly value="{window.location.origin}/r/{data.referralCode}" class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
          <button onclick={copyReferralLink} class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Copy</button>
        </div>
        {#if data.referralCredits > 0}
          <p class="text-sm text-green-600 mt-3">You've earned {data.referralCredits} month{data.referralCredits === 1 ? '' : 's'} of free access from referrals.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
