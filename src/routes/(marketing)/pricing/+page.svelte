<svelte:head>
  <title>Pricing — Smart Quote Pro</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
  <div class="text-center mb-16">
    <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">Simple, transparent pricing</h1>
    <p class="mt-4 text-lg text-gray-600">Start free. Upgrade when you're ready.</p>
  </div>

  <div class="grid md:grid-cols-3 gap-8">
    <!-- Free -->
    <div class="rounded-2xl border border-gray-200 p-8">
      <h3 class="text-lg font-bold text-gray-900">Free</h3>
      <div class="mt-4"><span class="text-4xl font-extrabold text-gray-900">$0</span><span class="text-gray-500">/mo</span></div>
      <p class="mt-2 text-sm text-gray-500">Perfect for trying it out</p>
      <ul class="mt-6 space-y-3 text-sm text-gray-600">
        <li>&#10003; 5 quotes per month</li>
        <li>&#10003; Embeddable quote wizard</li>
        <li>&#10003; Basic dashboard</li>
        <li>&#10003; PDF estimates</li>
        <li>&#10003; Email notifications</li>
      </ul>
      <a href="/auth/register" class="mt-8 block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">
        Start free
      </a>
    </div>

    <!-- Pro -->
    <div class="rounded-2xl border-2 border-blue-600 p-8 relative">
      <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Most popular</span>
      <h3 class="text-lg font-bold text-gray-900">Pro</h3>
      <div class="mt-4"><span class="text-4xl font-extrabold text-gray-900">$99</span><span class="text-gray-500">/mo</span></div>
      <p class="mt-2 text-sm text-gray-500">For growing painting businesses</p>
      <ul class="mt-6 space-y-3 text-sm text-gray-600">
        <li>&#10003; <strong>Unlimited</strong> quotes</li>
        <li>&#10003; Embeddable quote wizard</li>
        <li>&#10003; Full dashboard + analytics</li>
        <li>&#10003; Branded PDF estimates</li>
        <li>&#10003; Client portal</li>
        <li>&#10003; Stage management</li>
        <li>&#10003; Email notifications</li>
        <li>&#10003; Priority support</li>
      </ul>
      <a href="/auth/register" class="mt-8 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700">
        Start free trial
      </a>
    </div>

    <!-- Enterprise -->
    <div class="rounded-2xl border border-gray-200 p-8">
      <h3 class="text-lg font-bold text-gray-900">Enterprise</h3>
      <div class="mt-4"><span class="text-4xl font-extrabold text-gray-900">Custom</span></div>
      <p class="mt-2 text-sm text-gray-500">For multi-location operations</p>
      <ul class="mt-6 space-y-3 text-sm text-gray-600">
        <li>&#10003; Everything in Pro</li>
        <li>&#10003; Multiple locations</li>
        <li>&#10003; Custom branding</li>
        <li>&#10003; API access</li>
        <li>&#10003; Dedicated support</li>
        <li>&#10003; Self-hosted option</li>
      </ul>
      <a href="mailto:hello@smartquotepro.com" class="mt-8 block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">
        Contact us
      </a>
    </div>
  </div>
</div>
