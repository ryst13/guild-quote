<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Pricing — GuildQuote</title>
  <meta name="description" content="GuildQuote pricing: GQ $49/mo for fast branded estimates, GQ Pro $129/mo adds email delivery, Google Docs, and more languages." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
      <a href="/" class="text-sm text-gray-500 hover:text-gray-700">&larr; GuildQuote</a>
      <h1 class="font-bold text-gray-900">Pricing</h1>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-gray-900 mb-3">Two plans. No surprises.</h2>
      <p class="text-gray-500 max-w-xl mx-auto">Every plan makes professional estimates from a walkthrough in minutes. Pro adds the tools to get them to your client and keep your brand on everything.</p>
    </div>

    <!-- Tier comparison -->
    <div class="grid grid-cols-2 gap-6 mb-10">
      <!-- GQ -->
      <div class="rounded-2xl border border-gray-200 bg-white p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-1">GQ</h3>
        <div class="text-gray-500 mb-6">$49/mo</div>
        <ul class="space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Estimates for all 3 trades — interior, exterior, epoxy</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Automatic pricing + your own Price Book</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Professional PDF estimates with your logo and colors</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Win/loss tracking</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> 1 user</li>
        </ul>
        <a href={data.loggedIn ? '/dashboard/settings/billing' : '/auth/register'} class="mt-6 block w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 text-center">
          {data.loggedIn ? 'Choose GQ in Billing' : 'Start Free Trial'}
        </a>
      </div>

      <!-- GQ Pro -->
      <div class="rounded-2xl border-2 border-blue-600 bg-white p-8 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">RECOMMENDED</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-1">GQ Pro</h3>
        <div class="text-gray-500 mb-6">$129/mo</div>
        <ul class="space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Everything in GQ, plus:</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Email estimates with one tap</strong> — PDF attached, replies go to your inbox</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Google Docs &amp; Sheets output</strong> — saved to your Drive, editable before you send</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Crew snapshots in other languages</strong> — Spanish, Portuguese, Romanian, Cantonese</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Your numbers dashboard</strong> — close rate and pricing trends from your own jobs</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>3 user seats</strong> included</li>
        </ul>
        <a href={data.loggedIn ? '/dashboard/settings/billing' : '/auth/register'} class="mt-6 block w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 text-center">
          {data.loggedIn ? 'Upgrade to Pro in Billing' : 'Start Free Trial'}
        </a>
        {#if !data.loggedIn}
          <p class="text-xs text-gray-400 text-center mt-2">Already have an account? <a href="/dashboard/settings/billing" class="text-blue-600 hover:text-blue-700">Upgrade in Billing</a></p>
        {/if}
      </div>
    </div>

    <!-- FAQ -->
    <div class="space-y-4 max-w-2xl mx-auto">
      <h3 class="font-bold text-gray-900 text-center mb-4">Common Questions</h3>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">Can I try Pro before paying?</div>
        <p class="text-sm text-gray-500">Yes. New accounts get 14 days with every Pro feature, free, no credit card. After that, you pick your plan.</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">What happens to my estimates if I downgrade?</div>
        <p class="text-sm text-gray-500">Nothing. Your estimates, prices, and client history stay. You keep making PDF estimates on GQ — you just lose the Pro extras like email sending and Google Docs.</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">Can I add more team members?</div>
        <p class="text-sm text-gray-500">GQ Pro includes 3 seats. Need more? Contact us and we'll work something out.</p>
      </div>
    </div>
  </div>
</div>
