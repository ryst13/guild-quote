<svelte:head>
  <title>Pricing — GuildQuote Docs</title>
  <meta name="description" content="How GuildQuote pricing works. Two engines: rate-based (top-down $/sqft) and cost-based (bottom-up hours x wage). Quick Calibrate onboarding, catalog editor, and surcharges." />
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Pricing</h1>
    <p class="text-lg text-gray-600">GuildQuote gives you two ways to price work. Pick the one that matches how you think about your numbers, or use both and cross-check.</p>
  </div>

  <!-- Pricing Engines -->
  <section id="pricing-engines">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Pricing Engines</h2>
        <p>GuildQuote has two pricing engines. They reach the same destination -- an accurate estimate -- from different starting points.</p>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-gray-200 p-5">
          <h3 class="font-bold text-gray-900 mb-2">Rate-Based (Top-Down)</h3>
          <div class="prose prose-sm prose-gray max-w-none">
            <p>You set a <strong>price per square foot</strong> for each surface type. GuildQuote multiplies your rate by the measured area to calculate the price.</p>
            <p><strong>Best for:</strong> contractors who have been in business a while and already know what they charge. "I charge $3.50/sqft for walls" -- that is rate-based pricing.</p>
            <p><strong>How it works:</strong></p>
            <ul>
              <li>You set rates per surface type in your pricing catalog</li>
              <li>Scope entry captures measurements</li>
              <li>Price = rate x measured area (adjusted for condition grade and LOSP tier)</li>
              <li>GuildQuote back-calculates estimated production hours and margins</li>
            </ul>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 p-5">
          <h3 class="font-bold text-gray-900 mb-2">Cost-Based (Bottom-Up)</h3>
          <div class="prose prose-sm prose-gray max-w-none">
            <p>You set your <strong>crew's hourly wage, production rates, and target margin</strong>. GuildQuote calculates how long the job takes, what it costs you, and what to charge.</p>
            <p><strong>Best for:</strong> contractors who want to understand their true cost structure, or newer contractors who do not have established per-sqft rates yet.</p>
            <p><strong>How it works:</strong></p>
            <ul>
              <li>You set wage rate, production speed (sqft/hour), and target margin</li>
              <li>Scope entry captures measurements</li>
              <li>Hours = measured area / production rate (adjusted for condition grade)</li>
              <li>Cost = hours x wage rate + materials</li>
              <li>Price = cost / (1 - margin)</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <strong>Both engines produce the same output.</strong> Your client sees line items with prices. The engine just determines how those prices are calculated. You can switch engines or use both to cross-reference.
      </div>
    </div>
  </section>

  <!-- Quick Calibrate -->
  <section id="quick-calibrate">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Quick Calibrate</h2>
        <p>Quick Calibrate is the onboarding flow that sets up your pricing in about 60 seconds. It asks one question first:</p>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-2">"I know what I charge"</div>
          <p class="text-sm text-gray-500 mb-2">Enter a few key rates (like your price per sqft for walls and trim). GuildQuote populates your entire catalog from those anchor points.</p>
          <p class="text-xs text-gray-400">Sets up the rate-based engine.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-2">"I know what it costs me"</div>
          <p class="text-sm text-gray-500 mb-2">Enter your crew's hourly rate and your target profit margin. GuildQuote calculates prices from your costs.</p>
          <p class="text-xs text-gray-400">Sets up the cost-based engine.</p>
        </div>
      </div>

      <div class="mt-4 prose prose-sm prose-gray max-w-none">
        <p>Quick Calibrate gives you a working baseline. It does not lock you in. After onboarding, you can adjust any rate, production speed, or margin in the full catalog editor.</p>
        <p>If you are not sure where to start, pick "I know what I charge" and enter your most common rate. You can always refine later.</p>
      </div>
    </div>
  </section>

  <!-- Catalog & Surcharges -->
  <section id="catalog-surcharges">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Catalog & Surcharges</h2>

        <h3>Pricing Catalog</h3>
        <p>Your pricing catalog is the master list of rates for every surface type, prep item, and accessory in each trade. Quick Calibrate creates the initial catalog; the catalog editor lets you fine-tune it.</p>
        <p>In the catalog editor you can:</p>
        <ul>
          <li>Set per-sqft or per-unit rates for each surface type</li>
          <li>Adjust production rates (sqft per hour) for the cost-based engine</li>
          <li>Set condition-grade multipliers (how much more a C-grade surface costs vs. an A-grade)</li>
          <li>Configure LOSP tier adjustments</li>
          <li>Add or remove surface types</li>
        </ul>

        <h3>Surcharges</h3>
        <p>Surcharges are additional charges added to the estimate total. GuildQuote supports:</p>
        <ul>
          <li><strong>Trash removal / disposal</strong> -- flat fee or percentage for job-site cleanup and waste disposal</li>
          <li><strong>Transportation / fuel</strong> -- for jobs that are far from your base of operations</li>
          <li><strong>Credit card processing fees</strong> -- if you accept card payments and want to pass the processing cost through. Typically 2.9% + $0.30 per transaction.</li>
        </ul>
        <p>Surcharges appear as separate line items on the estimate so your client sees exactly what they are paying for.</p>

        <h3>Material Tracking</h3>
        <p>GuildQuote tracks materials for each estimate:</p>
        <ul>
          <li><strong>Products</strong> -- paint, primer, caulk, epoxy, flake. Pulled from your catalog or entered per-estimate.</li>
          <li><strong>Coverage rates</strong> -- sqft per gallon, which determines how many gallons the job needs.</li>
          <li><strong>Costs</strong> -- per-gallon pricing. GuildQuote calculates total material cost including a 10% wastage factor.</li>
        </ul>
        <p>Material costs flow into the cost-based engine as a direct cost, and into the rate-based engine as a margin check.</p>
      </div>
    </div>
  </section>

  <!-- Production Hours -->
  <section id="production-hours">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Production Hours & Crew Estimates</h2>
        <p>Every estimate includes production calculations:</p>
        <ul>
          <li><strong>Total painting hours</strong> -- the estimated labor hours for the job, shown as a range (e.g., 24-36 hours)</li>
          <li><strong>Crew size</strong> -- recommended number of painters based on job size</li>
          <li><strong>Duration</strong> -- how many working days the job should take with the recommended crew, shown as a range (e.g., 3-5 days)</li>
        </ul>
        <p>Production hours are calculated from your production rates (sqft per hour per painter) and adjusted for surface condition. Ranges account for real-world variability -- weather delays, access issues, drying time between coats.</p>
        <p>These numbers appear on your estimate and help you schedule work accurately. They also appear on crew snapshots so your team knows what to expect.</p>
      </div>
    </div>
  </section>

  <!-- Navigation -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-200">
    <a href="/docs/scope-entry" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Previous: Scope Entry</a>
    <a href="/docs/output" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Next: Output & Delivery</a>
  </div>
</div>
