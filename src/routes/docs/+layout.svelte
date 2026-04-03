<script lang="ts">
  import { page } from '$app/state';

  let { children } = $props();

  let mobileNavOpen = $state(false);

  const sections = [
    {
      title: 'Getting Started',
      href: '/docs/getting-started',
      children: [],
    },
    {
      title: 'Scope Entry',
      href: '/docs/scope-entry',
      children: [
        { title: 'Interior', href: '/docs/scope-entry#interior' },
        { title: 'Exterior', href: '/docs/scope-entry#exterior' },
        { title: 'Epoxy', href: '/docs/scope-entry#epoxy' },
      ],
    },
    {
      title: 'Pricing',
      href: '/docs/pricing',
      children: [
        { title: 'Pricing Engines', href: '/docs/pricing#pricing-engines' },
        { title: 'Quick Calibrate', href: '/docs/pricing#quick-calibrate' },
        { title: 'Catalog & Surcharges', href: '/docs/pricing#catalog-surcharges' },
      ],
    },
    {
      title: 'Output & Delivery',
      href: '/docs/output',
      children: [
        { title: 'Document Formats', href: '/docs/output#document-formats' },
        { title: 'Branding', href: '/docs/output#branding' },
        { title: 'Email Delivery', href: '/docs/output#email-delivery' },
        { title: 'Crew Snapshots', href: '/docs/output#crew-snapshots' },
      ],
    },
    {
      title: 'Tracking & Analytics',
      href: '/docs/tracking',
      children: [
        { title: 'Status Pipeline', href: '/docs/tracking#status-pipeline' },
        { title: 'Benchmarks', href: '/docs/tracking#benchmarks' },
        { title: 'Subcontractor Mode', href: '/docs/tracking#subcontractor-mode' },
      ],
    },
  ];

  function isActive(href: string): boolean {
    const path = page.url.pathname;
    // For section hrefs (no hash), check if current path starts with or matches it
    const basePath = href.split('#')[0];
    return path === basePath || path.startsWith(basePath + '/');
  }
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="sticky top-0 z-30 border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Mobile menu toggle -->
        <button
          class="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          onclick={() => mobileNavOpen = !mobileNavOpen}
          aria-label="Toggle navigation"
        >
          {#if mobileNavOpen}
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          {:else}
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          {/if}
        </button>

        <a href="/" class="flex items-center gap-2">
          <span class="text-xl font-bold text-gray-900">GuildQuote</span>
        </a>
        <span class="text-sm text-gray-400 hidden sm:inline">/</span>
        <a href="/docs" class="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:inline">Docs</a>
      </div>
      <div class="flex items-center gap-3">
        <a href="/demo" class="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:inline">Demo</a>
        <a href="/auth/register" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Start Free Trial
        </a>
      </div>
    </div>
  </header>

  <div class="mx-auto max-w-7xl">
    <div class="lg:flex">
      <!-- Sidebar — Desktop -->
      <aside class="hidden lg:block lg:w-64 shrink-0">
        <nav class="sticky top-14 overflow-y-auto max-h-[calc(100vh-3.5rem)] px-4 py-6 space-y-1">
          {#each sections as section}
            <div class="mb-3">
              <a
                href={section.href}
                class="block px-3 py-2 text-sm font-semibold rounded-lg transition-colors {isActive(section.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-900 hover:bg-gray-100'}"
              >
                {section.title}
              </a>
              {#if section.children.length > 0}
                <div class="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                  {#each section.children as child}
                    <a
                      href={child.href}
                      class="block px-2 py-1 text-sm rounded transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {child.title}
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </nav>
      </aside>

      <!-- Sidebar — Mobile overlay -->
      {#if mobileNavOpen}
        <div class="fixed inset-0 z-40 lg:hidden">
          <!-- Backdrop -->
          <button
            class="absolute inset-0 bg-black/30"
            onclick={() => mobileNavOpen = false}
            aria-label="Close navigation"
          ></button>
          <!-- Panel -->
          <nav class="relative z-50 w-72 max-h-full overflow-y-auto bg-white border-r border-gray-200 p-4 space-y-1 shadow-xl">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <span class="font-bold text-gray-900">Docs</span>
              <button
                class="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                onclick={() => mobileNavOpen = false}
                aria-label="Close"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {#each sections as section}
              <div class="mb-3">
                <a
                  href={section.href}
                  onclick={() => mobileNavOpen = false}
                  class="block px-3 py-2 text-sm font-semibold rounded-lg transition-colors {isActive(section.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-900 hover:bg-gray-100'}"
                >
                  {section.title}
                </a>
                {#if section.children.length > 0}
                  <div class="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                    {#each section.children as child}
                      <a
                        href={child.href}
                        onclick={() => mobileNavOpen = false}
                        class="block px-2 py-1 text-sm rounded transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      >
                        {child.title}
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </nav>
        </div>
      {/if}

      <!-- Main content -->
      <main class="flex-1 min-w-0 px-4 py-8 lg:px-8 lg:py-10">
        <div class="max-w-3xl">
          {@render children()}
        </div>
      </main>
    </div>
  </div>

  <!-- Footer -->
  <footer class="border-t border-gray-200 bg-white mt-16">
    <div class="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
      <span>GuildQuote LLC</span>
      <div class="flex items-center gap-4">
        <a href="/terms" class="hover:text-gray-900">Terms of Service</a>
        <a href="/privacy" class="hover:text-gray-900">Privacy Policy</a>
        <a href="/" class="hover:text-gray-900">Home</a>
      </div>
    </div>
  </footer>
</div>
