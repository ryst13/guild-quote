<svelte:head>
  <title>Log In — Smart Quote Pro</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="inline-flex items-center gap-2">
        <span class="text-3xl">🎨</span>
        <span class="text-2xl font-bold text-gray-900">Smart Quote Pro</span>
      </a>
    </div>
    <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Sign in to your account</h1>

      {#if message}
        <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</div>
      {/if}
      {#if error}
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
      {/if}

      <form onsubmit={handleSubmit}>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          type="email"
          bind:value={email}
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading}
          class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Don't have an account? <a href="/auth/register" class="text-blue-600 hover:text-blue-700 font-medium">Sign up free</a>
      </p>
    </div>
  </div>
</div>

<script lang="ts">
  let email = $state('');
  let loading = $state(false);
  let message = $state('');
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    message = '';

    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        message = data.message || 'Check your email for a login link!';
      } else {
        error = data.error || 'Something went wrong.';
      }
    } catch {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>
