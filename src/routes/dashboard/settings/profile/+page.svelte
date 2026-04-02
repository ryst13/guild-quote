<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let saving = $state(false);
  let saved = $state(false);

  let companyName = $state(data.tenant.company_name);
  let contactEmail = $state(data.tenant.contact_email);
  let contactPhone = $state(data.tenant.contact_phone);
  let websiteUrl = $state(data.tenant.website_url);
  let serviceAreas = $state(data.tenant.service_areas);
  let primaryColor = $state(data.tenant.primary_color);
  let accentColor = $state(data.tenant.accent_color);
  let logoUrl = $state(data.tenant.logo_url || '');
  let uploading = $state(false);

  async function save() {
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
        primary_color: primaryColor,
        accent_color: accentColor,
        logo_url: logoUrl,
      }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function uploadLogo(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
    if (res.ok) {
      const result = await res.json();
      logoUrl = result.url;
    }
    uploading = false;
  }

  function removeLogo() {
    logoUrl = '';
  }
</script>

<svelte:head>
  <title>Company Profile — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
        <h1 class="font-bold text-gray-900">Company Profile</h1>
      </div>
      <div class="flex items-center gap-3">
        {#if saved}<span class="text-sm text-green-600 font-medium">Saved</span>{/if}
        <button onclick={save} disabled={saving} class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Logo -->
    <div class="rounded-xl bg-white border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-1">Logo</h2>
      <p class="text-sm text-gray-500 mb-4">Appears on your estimates, emails, and documents.</p>
      <div class="flex items-center gap-6">
        {#if logoUrl}
          <div class="h-20 w-20 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-white">
            <img src={logoUrl} alt="Company logo" class="max-h-full max-w-full object-contain" />
          </div>
          <div class="space-y-2">
            <label class="block">
              <span class="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Replace</span>
              <input type="file" accept="image/*" onchange={uploadLogo} class="hidden" />
            </label>
            <button onclick={removeLogo} class="block text-xs text-red-600 hover:text-red-700">Remove logo</button>
          </div>
        {:else}
          <div class="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span class="text-2xl text-gray-300">+</span>
          </div>
          <label class="block">
            <span class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </span>
            <input type="file" accept="image/*" onchange={uploadLogo} class="hidden" />
          </label>
        {/if}
      </div>
    </div>

    <!-- Company Info -->
    <div class="rounded-xl bg-white border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Company Information</h2>
      <div class="space-y-4">
        <div>
          <label for="company-name" class="block text-sm font-medium text-gray-700 mb-1">Company name</label>
          <input id="company-name" type="text" bind:value={companyName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="contact-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="contact-email" type="email" bind:value={contactEmail} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label for="contact-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="contact-phone" type="tel" bind:value={contactPhone} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input id="website" type="url" bind:value={websiteUrl} placeholder="https://yourcompany.com" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
        <div>
          <label for="areas" class="block text-sm font-medium text-gray-700 mb-1">Service areas</label>
          <input id="areas" type="text" bind:value={serviceAreas} placeholder="e.g., Philadelphia metro area" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
      </div>
    </div>

    <!-- Branding -->
    <div class="rounded-xl bg-white border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-1">Brand Colors</h2>
      <p class="text-sm text-gray-500 mb-4">Applied to your estimate headers, section dividers, and totals.</p>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label for="primary-color" class="block text-sm font-medium text-gray-700 mb-2">Primary color</label>
          <div class="flex items-center gap-3">
            <input id="primary-color" type="color" bind:value={primaryColor} class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
            <input type="text" bind:value={primaryColor} class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>
        </div>
        <div>
          <label for="accent-color" class="block text-sm font-medium text-gray-700 mb-2">Accent color</label>
          <div class="flex items-center gap-3">
            <input id="accent-color" type="color" bind:value={accentColor} class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
            <input type="text" bind:value={accentColor} class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>
        </div>
      </div>
      <!-- Preview -->
      <div class="mt-6 rounded-xl border border-gray-200 p-6" style="background: linear-gradient(135deg, {primaryColor}11, {accentColor}11)">
        <div class="flex items-center gap-3 mb-3">
          {#if logoUrl}
            <img src={logoUrl} alt="Logo" class="h-10 w-10 object-contain rounded" />
          {:else}
            <div class="h-10 w-10 rounded-full" style="background: {primaryColor}"></div>
          {/if}
          <span class="text-lg font-bold" style="color: {primaryColor}">{companyName}</span>
        </div>
        <div class="rounded-lg p-3 text-center" style="background: {primaryColor}; color: white">
          <span class="text-sm font-semibold">EXISTING SURFACE GRADE</span>
        </div>
        <div class="mt-2 text-sm font-bold" style="color: {primaryColor}">TOTAL: $7,089</div>
      </div>
    </div>
  </div>
</div>
