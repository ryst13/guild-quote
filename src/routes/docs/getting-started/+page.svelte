<svelte:head>
  <title>Getting Started — GuildQuote Docs</title>
  <meta name="description" content="Get your first estimate out the door in under 5 minutes. Sign up, pick your trades, set your pricing, scope a job, and send a branded PDF to your client." />
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Getting Started</h1>
    <p class="text-lg text-gray-600">Your first estimate in 5 minutes. Here is what to do.</p>
  </div>

  <!-- Step 1 -->
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-lg font-bold text-gray-900 mt-0 mb-2">Create your account</h2>
        <p>Go to the registration page, enter your email, and create a password. You get a 14-day free trial with full access -- no credit card required.</p>
        <p>During registration, you will set your company name. This is what appears on every estimate you send, so use your real business name.</p>
      </div>
    </div>
  </div>

  <!-- Step 2 -->
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-lg font-bold text-gray-900 mt-0 mb-2">Pick your trades</h2>
        <p>GuildQuote supports three trades:</p>
        <ul>
          <li><strong>Interior Painting</strong> -- walls, ceilings, trim, doors, windows, closets</li>
          <li><strong>Exterior Painting</strong> -- siding, trim, windows, doors, decks, carpentry repairs</li>
          <li><strong>Epoxy & Garage Coatings</strong> -- garage floors, commercial spaces, flake coatings, cove base</li>
        </ul>
        <p>Turn on the trades you offer. You can change this later in settings.</p>
      </div>
    </div>
  </div>

  <!-- Step 3 -->
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-lg font-bold text-gray-900 mt-0 mb-2">Set your pricing with Quick Calibrate</h2>
        <p>GuildQuote uses <strong>Quick Calibrate</strong> to get you started in about 60 seconds. You answer one question:</p>
        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 not-prose text-sm text-blue-800 my-4">
          <strong>Do you know your costs or your prices?</strong> If you know what you charge per square foot, start there. If you know your crew's hourly wage and your target margin, start there instead. Either way gets you to accurate pricing.
        </div>
        <p><strong>Know your prices?</strong> Enter your rate per square foot for each surface type. GuildQuote works backward to calculate costs and margins. This is the rate-based engine.</p>
        <p><strong>Know your costs?</strong> Enter your crew's wage, production rates, and target margin. GuildQuote builds prices from the bottom up. This is the cost-based engine.</p>
        <p>You can fine-tune everything later in the pricing catalog. Quick Calibrate just gets you a working baseline fast. See <a href="/docs/pricing" class="text-blue-600 hover:text-blue-700">Pricing</a> for full details.</p>
      </div>
    </div>
  </div>

  <!-- Step 4 -->
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-lg font-bold text-gray-900 mt-0 mb-2">Create your first estimate</h2>
        <p>From your dashboard, click <strong>New Estimate</strong>. Pick the trade, then scope the job:</p>
        <ul>
          <li><strong>Interior:</strong> Add rooms one at a time. Set dimensions, select surfaces (walls, ceiling, trim, doors, windows), and grade the condition.</li>
          <li><strong>Exterior:</strong> Add surfaces (siding, trim, windows, doors). Set square footage or linear footage and condition grades.</li>
          <li><strong>Epoxy:</strong> Add floors. Set square footage, choose coating type, and select options like flake and cove base.</li>
        </ul>
        <p>Enter the client's name, address, and contact info. GuildQuote calculates the price, production hours, crew size, and duration automatically.</p>
      </div>
    </div>
  </div>

  <!-- Step 5 -->
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">5</div>
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-lg font-bold text-gray-900 mt-0 mb-2">Send it to your client</h2>
        <p>GuildQuote generates a professional, branded estimate. You have three delivery options:</p>
        <ul>
          <li><strong>PDF</strong> -- download it or email it as an attachment</li>
          <li><strong>Google Docs</strong> -- saved to your Drive, shareable link</li>
          <li><strong>Google Sheets</strong> -- full line-item breakdown in spreadsheet format</li>
        </ul>
        <p>If you have connected Gmail, you can email the estimate directly from GuildQuote. The email includes your branding and the PDF as an attachment.</p>
        <p>Once sent, the estimate moves to "Sent" in your pipeline. Track it through viewed, accepted, or declined. See <a href="/docs/tracking" class="text-blue-600 hover:text-blue-700">Tracking & Analytics</a> for details.</p>
      </div>
    </div>
  </div>

  <!-- What's next -->
  <div class="rounded-xl bg-gray-100 p-6">
    <h2 class="font-semibold text-gray-900 mb-3">Next steps</h2>
    <div class="grid gap-3 sm:grid-cols-2">
      <a href="/docs/scope-entry" class="block rounded-lg bg-white border border-gray-200 px-4 py-3 text-sm hover:border-blue-300 transition-colors">
        <div class="font-medium text-gray-900">Scope Entry</div>
        <div class="text-gray-500 text-xs mt-0.5">Learn how each trade's scope form works</div>
      </a>
      <a href="/docs/pricing" class="block rounded-lg bg-white border border-gray-200 px-4 py-3 text-sm hover:border-blue-300 transition-colors">
        <div class="font-medium text-gray-900">Pricing</div>
        <div class="text-gray-500 text-xs mt-0.5">Understand both pricing engines in depth</div>
      </a>
      <a href="/docs/output" class="block rounded-lg bg-white border border-gray-200 px-4 py-3 text-sm hover:border-blue-300 transition-colors">
        <div class="font-medium text-gray-900">Output & Delivery</div>
        <div class="text-gray-500 text-xs mt-0.5">Set up branding, templates, and email</div>
      </a>
      <a href="/docs/tracking" class="block rounded-lg bg-white border border-gray-200 px-4 py-3 text-sm hover:border-blue-300 transition-colors">
        <div class="font-medium text-gray-900">Tracking & Analytics</div>
        <div class="text-gray-500 text-xs mt-0.5">Follow every estimate from send to close</div>
      </a>
    </div>
  </div>
</div>
