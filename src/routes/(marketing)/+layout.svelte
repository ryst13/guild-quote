<script>
  let { children, data } = $props();
</script>

<div class="min-h-screen bg-white">
  <nav class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="flex items-center gap-2">
          <span class="text-2xl">🎨</span>
          <span class="text-xl font-bold text-gray-900">Smart Quote Pro</span>
        </a>
        <div class="hidden sm:flex items-center gap-6">
          <a href="/features" class="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
          <a href="/pricing" class="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="/for-painters" class="text-sm font-medium text-gray-600 hover:text-gray-900">For Painters</a>
          <a href="/demo" class="text-sm font-medium text-gray-600 hover:text-gray-900">Demo</a>
        </div>
        <div class="flex items-center gap-3">
          {#if data.user}
            <a href="/dashboard" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Dashboard</a>
          {:else}
            <a href="/auth/login" class="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</a>
            <a href="/auth/register" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Sign up free</a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  {@render children()}

  <footer class="border-t border-gray-200 bg-gray-50 py-12 mt-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">🎨</span>
          <span class="font-bold text-gray-900">Smart Quote Pro</span>
        </div>
        <div class="flex gap-6 text-sm text-gray-500">
          <a href="/features" class="hover:text-gray-700">Features</a>
          <a href="/pricing" class="hover:text-gray-700">Pricing</a>
          <a href="/for-painters" class="hover:text-gray-700">For Painters</a>
        </div>
        <p class="text-sm text-gray-400">&copy; {new Date().getFullYear()} Smart Quote Pro</p>
      </div>
    </div>
  </footer>
</div>
