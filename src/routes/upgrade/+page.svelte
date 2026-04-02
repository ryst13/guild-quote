<script lang="ts">
</script>

<svelte:head>
  <title>GQ Pro — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
      <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
      <h1 class="font-bold text-gray-900">Upgrade to GQ Pro</h1>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-gray-900 mb-3">You estimate. Pro runs the job.</h2>
      <p class="text-gray-500 max-w-xl mx-auto">GQ generates professional estimates. GQ Pro tracks every job from accepted to paid — scheduling, payments, follow-ups, crew management. One tool instead of five.</p>
    </div>

    <!-- Tier comparison -->
    <div class="grid grid-cols-2 gap-6 mb-10">
      <!-- GQ -->
      <div class="rounded-2xl border border-gray-200 bg-white p-8">
        <div class="text-sm font-medium text-gray-500 mb-1">Current plan</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-1">GQ</h3>
        <div class="text-gray-500 mb-6">$49/mo</div>
        <ul class="space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Scope entry (3 trades)</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Pricing engine + catalog</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Google Sheets / Docs / PDF output</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Professional estimate format</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> White-label branding</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Email delivery (Gmail API)</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Win/loss tracking</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Multilingual output</li>
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> 1 user seat</li>
        </ul>
      </div>

      <!-- GQ Pro -->
      <div class="rounded-2xl border-2 border-blue-600 bg-white p-8 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">RECOMMENDED</div>
        <div class="text-sm font-medium text-blue-600 mb-1">Upgrade</div>
        <h3 class="text-2xl font-bold text-gray-900 mb-1">GQ Pro</h3>
        <div class="text-gray-500 mb-6">$149/mo</div>
        <ul class="space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">&#10003;</span> Everything in GQ, plus:</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Job tracker pipeline</strong> — Kanban board, 6 stages from estimate to paid</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Follow-up automation</strong> — 2-day, 5-day, 14-day email sequences</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Payment tracking</strong> — deposit/progress/completion milestones</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Google Calendar sync</strong> — 2-way, duration-aware scheduling</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Analytics dashboard</strong> — close rate, pipeline value, trends</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>eSignature</strong> — Google Docs approval + formal eSign</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Crew/sub portal</strong> — shareable project briefs, accept/decline</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>Client status page</strong> — shareable job progress link</li>
          <li class="flex items-start gap-2"><span class="text-blue-600 mt-0.5 font-bold">+</span> <strong>3 user seats</strong> included</li>
        </ul>
        <button class="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Upgrade to GQ Pro — $149/mo
        </button>
        <p class="text-xs text-gray-400 text-center mt-2">Annual: $1,490/yr (2 months free)</p>
      </div>
    </div>

    <!-- The moment -->
    <div class="rounded-xl bg-gray-100 p-8 text-center mb-10">
      <h3 class="text-lg font-bold text-gray-900 mb-2">The estimate is done. Now what?</h3>
      <p class="text-sm text-gray-600 max-w-lg mx-auto">You won the job. Now you need to schedule it, track payments, manage your crew, and keep the client informed. That's GQ Pro — the system that runs the job after the estimate closes it.</p>
    </div>

    <!-- FAQ -->
    <div class="space-y-4 max-w-2xl mx-auto">
      <h3 class="font-bold text-gray-900 text-center mb-4">Common Questions</h3>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">Can I try Pro before committing?</div>
        <p class="text-sm text-gray-500">Yes. New accounts get 14 days of Pro features free. After that, you choose your plan.</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">What happens to my estimates if I downgrade?</div>
        <p class="text-sm text-gray-500">Nothing. Your estimates, pricing catalog, and client history stay. You lose access to job tracking, scheduling, and follow-up automation.</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5">
        <div class="font-medium text-gray-900 text-sm mb-1">Can I add more team members?</div>
        <p class="text-sm text-gray-500">GQ Pro includes 3 seats. Need more? Contact us — we'll work out volume pricing for your team.</p>
      </div>
    </div>
  </div>
</div>
