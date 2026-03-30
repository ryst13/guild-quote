<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  let step = $state(1);
  let saving = $state(false);
  let saved = $state(false);

  // Step 1: Company Profile
  let companyName = $state(data.tenant.company_name);
  let contactEmail = $state(data.tenant.contact_email);
  let contactPhone = $state(data.tenant.contact_phone);
  let websiteUrl = $state(data.tenant.website_url);
  let serviceAreas = $state(data.tenant.service_areas);

  // Step 2: Branding
  let primaryColor = $state(data.tenant.primary_color);
  let accentColor = $state(data.tenant.accent_color);

  // Step 4: Embed
  let embedCode = $derived(`<iframe src="${data.baseUrl}/${data.tenant.slug}/quote" width="100%" height="800" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`);

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

  function nextStep() {
    step = Math.min(step + 1, 4);
  }
  function prevStep() {
    step = Math.max(step - 1, 1);
  }

  let copied = $state(false);
  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<svelte:head>
  <title>Set Up Your Account — Smart Quote Pro</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🎨</span>
        <span class="text-lg font-bold text-gray-900">Smart Quote Pro</span>
      </div>
      <span class="text-sm text-gray-500">Step {step} of 4</span>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="mx-auto max-w-3xl px-4 mt-6">
    <div class="flex gap-2">
      {#each [1, 2, 3, 4] as s}
        <div class="h-2 flex-1 rounded-full {s <= step ? 'bg-blue-600' : 'bg-gray-200'}"></div>
      {/each}
    </div>
    <div class="flex justify-between mt-2 text-xs text-gray-500">
      <span>Profile</span><span>Branding</span><span>Pricing</span><span>Embed</span>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-8">
    {#if saved}
      <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Saved!</div>
    {/if}

    {#if step === 1}
      <!-- Company Profile -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Company Profile</h2>
        <p class="text-sm text-gray-500 mb-6">Tell us about your painting business.</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input type="text" bind:value={companyName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" bind:value={contactEmail} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" bind:value={contactPhone} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="url" bind:value={websiteUrl} placeholder="https://yoursite.com" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Service areas</label>
            <input type="text" bind:value={serviceAreas} placeholder="e.g., Philadelphia metro area" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button onclick={() => { saveProfile(); nextStep(); }} disabled={saving} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>

    {:else if step === 2}
      <!-- Branding -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Branding</h2>
        <p class="text-sm text-gray-500 mb-6">Choose colors for your customer-facing pages.</p>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Primary color</label>
            <div class="flex items-center gap-3">
              <input type="color" bind:value={primaryColor} class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <input type="text" bind:value={primaryColor} class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Accent color</label>
            <div class="flex items-center gap-3">
              <input type="color" bind:value={accentColor} class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <input type="text" bind:value={accentColor} class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            </div>
          </div>
        </div>
        <!-- Preview -->
        <div class="mt-6 rounded-xl border border-gray-200 p-6" style="background: linear-gradient(135deg, {primaryColor}11, {accentColor}11)">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-full" style="background: {primaryColor}"></div>
            <span class="text-lg font-bold" style="color: {primaryColor}">{companyName}</span>
          </div>
          <div class="rounded-lg p-4" style="background: {primaryColor}; color: white">
            <span class="text-sm font-semibold">Get Your Free Quote</span>
          </div>
        </div>
        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={() => { saveBranding(); nextStep(); }} disabled={saving} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>

    {:else if step === 3}
      <!-- Pricing -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Pricing Catalog</h2>
        <p class="text-sm text-gray-500 mb-4">Your catalog has been pre-loaded with industry-standard pricing. You can customize it now or anytime from your dashboard settings.</p>
        <div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          Default pricing is active. Edit your catalog in Dashboard &rarr; Settings &rarr; Catalog.
        </div>
        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <div class="flex gap-3">
            <a href="/dashboard/settings/catalog" class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit Catalog</a>
            <button onclick={nextStep} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Continue</button>
          </div>
        </div>
      </div>

    {:else if step === 4}
      <!-- Embed Code -->
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Get Your Embed Code</h2>
        <p class="text-sm text-gray-500 mb-4">Add this code to your website to embed the quote wizard.</p>

        <div class="mb-4">
          <p class="text-sm text-gray-700 mb-2">Your quote wizard is live at:</p>
          <a href="/{data.tenant.slug}/quote" target="_blank" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
            {data.baseUrl}/{data.tenant.slug}/quote
          </a>
        </div>

        <div class="relative">
          <pre class="rounded-lg bg-gray-900 p-4 text-sm text-green-400 overflow-x-auto">{embedCode}</pre>
          <button onclick={copyEmbed} class="absolute top-2 right-2 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={finishOnboarding} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Go to Dashboard
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
