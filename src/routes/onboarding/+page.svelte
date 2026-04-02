<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  let step = $state(1);
  let saving = $state(false);
  let saved = $state(false);
  const totalSteps = 2;

  // Step 1: Trade Selection
  let trades = $state<Record<string, boolean>>({
    interior: data.tenant.enabled_trades.includes('interior'),
    exterior: data.tenant.enabled_trades.includes('exterior'),
    epoxy: data.tenant.enabled_trades.includes('epoxy'),
  });
  let hasTradeSelected = $derived(Object.values(trades).some(v => v));

  // Step 2: Company Profile
  let companyName = $state(data.tenant.company_name);
  let contactEmail = $state(data.tenant.contact_email);
  let contactPhone = $state(data.tenant.contact_phone);
  let websiteUrl = $state(data.tenant.website_url);
  let serviceAreas = $state(data.tenant.service_areas);

  // Step 3: Branding
  let primaryColor = $state(data.tenant.primary_color);
  let accentColor = $state(data.tenant.accent_color);

  async function saveTrades() {
    saving = true;
    const enabledTrades = Object.entries(trades).filter(([, v]) => v).map(([k]) => k);
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled_trades: JSON.stringify(enabledTrades) }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function saveProfile() {
    saving = true;
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        website_url: websiteUrl,
        service_areas: serviceAreas,
      }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function saveBranding() {
    saving = true;
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_color: primaryColor, accent_color: accentColor }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function finishOnboarding() {
    await fetch('/api/tenant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_completed: true }),
    });
    window.location.href = '/dashboard';
  }

  function nextStep() { step = Math.min(step + 1, totalSteps); }
  function prevStep() { step = Math.max(step - 1, 1); }

  const stepLabels = ['Trades', 'Google Connect'];
</script>

<svelte:head>
  <title>Set Up Your Account — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
      <span class="text-lg font-bold text-gray-900">GuildQuote</span>
      <span class="text-sm text-gray-500">Step {step} of {totalSteps}</span>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 mt-6">
    <div class="flex gap-2">
      {#each Array.from({length: totalSteps}, (_, i) => i + 1) as s}
        <div class="h-2 flex-1 rounded-full {s <= step ? 'bg-blue-600' : 'bg-gray-200'}"></div>
      {/each}
    </div>
    <div class="flex justify-between mt-2 text-xs text-gray-500">
      {#each stepLabels as label}
        <span>{label}</span>
      {/each}
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-8">
    {#if saved}
      <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Saved!</div>
    {/if}

    {#if step === 1}
      <!-- Trade Selection -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Select Your Trades</h2>
        <p class="text-sm text-gray-500 mb-6">Choose the services you offer. You can change this later.</p>
        <div class="space-y-4">
          <label class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 {trades.interior ? 'border-blue-500 bg-blue-50' : ''}">
            <input type="checkbox" bind:checked={trades.interior} class="h-5 w-5 rounded border-gray-300 text-blue-600" />
            <div>
              <div class="font-semibold text-gray-900">Interior Painting</div>
              <div class="text-sm text-gray-500">Rooms, trim, doors, windows, ceilings</div>
            </div>
          </label>
          <label class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 {trades.exterior ? 'border-blue-500 bg-blue-50' : ''}">
            <input type="checkbox" bind:checked={trades.exterior} class="h-5 w-5 rounded border-gray-300 text-blue-600" />
            <div>
              <div class="font-semibold text-gray-900">Exterior Painting</div>
              <div class="text-sm text-gray-500">Siding, trim, doors, windows, carpentry repairs</div>
            </div>
          </label>
          <label class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 {trades.epoxy ? 'border-blue-500 bg-blue-50' : ''}">
            <input type="checkbox" bind:checked={trades.epoxy} class="h-5 w-5 rounded border-gray-300 text-blue-600" />
            <div>
              <div class="font-semibold text-gray-900">Epoxy & Garage Coatings</div>
              <div class="text-sm text-gray-500">Garage floors, basements, patios, commercial</div>
            </div>
          </label>
        </div>
        <!-- Company Name (minimal — rest deferred to contextual prompts) -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <label for="company-name" class="block text-sm font-medium text-gray-700 mb-1">Company name</label>
          <input id="company-name" type="text" bind:value={companyName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 outline-none" />
        </div>

        <div class="mt-6 flex justify-end">
          <button onclick={() => { saveTrades(); saveProfile(); nextStep(); }} disabled={saving || !hasTradeSelected} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>

    {:else if step === 2}
      <!-- Connect Google Account -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Connect Google Account</h2>
        <p class="text-sm text-gray-500 mb-6">Connect your Google account to generate estimates as Google Docs in your Drive and send them from your Gmail.</p>

        {#if data.tenant.google_refresh_token}
          <div class="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3 mb-6">
            <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span class="text-sm font-medium text-green-800">Google account connected</span>
          </div>
        {:else}
          <a href="/auth/google" class="flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 mb-6">
            <svg class="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connect Google Account
          </a>
        {/if}

        <p class="text-xs text-gray-400 mb-6">You can skip this and use PDF output instead. Change anytime in Settings.</p>

        <div class="flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={finishOnboarding} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Go to Dashboard
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
