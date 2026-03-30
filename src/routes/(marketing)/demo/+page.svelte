<svelte:head>
  <title>Demo — Smart Quote Pro</title>
  <meta name="description" content="Try the Smart Quote Pro quote wizard with sample data." />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
  <div class="text-center mb-12">
    <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">See it in action</h1>
    <p class="mt-4 text-lg text-gray-600">Try the quote wizard below. This is exactly what your customers will see, branded to your company.</p>
  </div>

  <div class="rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
    <div class="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
      <div class="w-3 h-3 rounded-full bg-red-400"></div>
      <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
      <div class="w-3 h-3 rounded-full bg-green-400"></div>
      <span class="ml-2 text-xs text-gray-500">smartquotepro.com/demo-painting/quote</span>
    </div>
    <div class="bg-white p-4 text-center">
      <p class="text-gray-500 text-sm mb-4">To try a live demo, sign up for a free account and test your own quote wizard.</p>
      <a href="/auth/register" class="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Create free account to try
      </a>
    </div>
  </div>

  <div class="mt-16 grid md:grid-cols-2 gap-8">
    <div class="rounded-2xl bg-gray-50 p-8">
      <h3 class="font-bold text-gray-900 mb-3">What your customers see:</h3>
      <ul class="space-y-2 text-sm text-gray-600">
        <li>&#10003; Your logo and brand colors</li>
        <li>&#10003; 5-step guided form (Welcome, Contact, Rooms, Details, Review)</li>
        <li>&#10003; Instant on-screen quote with room breakdown</li>
        <li>&#10003; PDF estimate emailed automatically</li>
        <li>&#10003; Mobile-friendly, loads fast</li>
      </ul>
    </div>
    <div class="rounded-2xl bg-gray-50 p-8">
      <h3 class="font-bold text-gray-900 mb-3">What you see in your dashboard:</h3>
      <ul class="space-y-2 text-sm text-gray-600">
        <li>&#10003; New submission with full details</li>
        <li>&#10003; Room-by-room pricing breakdown</li>
        <li>&#10003; Ability to adjust and approve quotes</li>
        <li>&#10003; Assign crew and schedule dates</li>
        <li>&#10003; Send status updates to clients</li>
      </ul>
    </div>
  </div>
</div>
