<svelte:head>
  <title>Sign Up — Smart Quote Pro</title>
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
      <h1 class="text-xl font-bold text-gray-900 mb-2">Create your account</h1>
      <p class="text-sm text-gray-500 mb-6">Start offering online quoting to your customers today.</p>

      {#if error}
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
      {/if}

      <form onsubmit={handleSubmit}>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              type="text"
              bind:value={companyName}
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Smith Painting Co"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input type="text" bind:value={firstName} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input type="text" bind:value={lastName} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" bind:value={email} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="you@company.com" />
          </div>
        </div>
        <button type="submit" disabled={loading} class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Already have an account? <a href="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium">Log in</a>
      </p>
    </div>
  </div>
</div>

<script lang="ts">
  let companyName = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, first_name: firstName, last_name: lastName, email }),
      });
      const data = await res.json();

      if (res.ok) {
        window.location.href = data.redirect || '/onboarding';
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
