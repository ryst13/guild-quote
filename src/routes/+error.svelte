<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="text-center max-w-md">
    <div class="text-6xl font-bold text-gray-200 mb-4">{page.status}</div>
    {#if page.status === 404}
      <h1 class="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p class="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
    {:else}
      <h1 class="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p class="text-sm text-gray-500 mb-8">{page.error?.message || 'An unexpected error occurred.'}</p>
    {/if}
    <div class="flex items-center justify-center gap-3">
      <a href="/dashboard" class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        Go to Dashboard
      </a>
      <a href="/demo" class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Try Demo
      </a>
    </div>
  </div>
</div>
