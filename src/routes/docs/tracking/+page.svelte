<svelte:head>
  <title>Tracking & Analytics — GuildQuote Docs</title>
  <meta name="description" content="Track every estimate from draft to close. Win/loss tracking, self-benchmarking after 10+ estimates, and subcontractor mode for sub pricing." />
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Tracking & Analytics</h1>
    <p class="text-lg text-gray-600">Every estimate you send has a lifecycle. GuildQuote tracks it from creation to close so you know where your money is and where it went.</p>
  </div>

  <!-- Status Pipeline -->
  <section id="status-pipeline">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Status Pipeline</h2>
        <p>Every estimate moves through a pipeline of statuses. You update the status as the estimate progresses.</p>
      </div>

      <!-- Pipeline visual -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Draft</span>
        <span class="text-gray-300">&rarr;</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sent</span>
        <span class="text-gray-300">&rarr;</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Viewed</span>
        <span class="text-gray-300">&rarr;</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Accepted</span>
        <span class="text-sm text-gray-400 ml-1">or</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Declined</span>
      </div>

      <div class="mt-5 space-y-3">
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Draft</div>
          <p class="text-sm text-gray-500">The estimate exists but has not been sent to the client. You can still edit scope, adjust pricing, or regenerate the document.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Sent</div>
          <p class="text-sm text-gray-500">The estimate has been emailed or delivered to the client. The clock starts on your follow-up timeline.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Viewed</div>
          <p class="text-sm text-gray-500">The client has opened the estimate. This is tracked when they view the Google Doc link or open the email.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Accepted</div>
          <p class="text-sm text-gray-500">The client said yes. Record the <strong>close price</strong> (which may differ from the estimate if you negotiated). This data feeds into your benchmarks.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Declined</div>
          <p class="text-sm text-gray-500">The client passed. Record a <strong>decline reason</strong> -- too expensive, went with someone else, project canceled, etc. Over time, decline reasons reveal patterns you can act on.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Benchmarks -->
  <section id="benchmarks">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Self-Benchmarking</h2>
        <p>After you have tracked <strong>10 or more estimates</strong> through to accepted or declined, GuildQuote unlocks your benchmarking dashboard. This is your data about your business -- not industry averages.</p>

        <h3>What benchmarking shows you</h3>
        <ul>
          <li><strong>Close rate</strong> -- what percentage of estimates you send turn into jobs. Broken down by trade, by month, and overall.</li>
          <li><strong>Average estimate value</strong> -- what your typical estimate is worth, by trade.</li>
          <li><strong>Average close price vs. estimate price</strong> -- how much you negotiate down (or up) from your initial estimate.</li>
          <li><strong>Decline reasons breakdown</strong> -- the most common reasons clients say no. If 40% of declines are "too expensive," that is actionable. If 40% are "project canceled," that is out of your control.</li>
          <li><strong>Pipeline value</strong> -- total value of estimates currently in "Sent" or "Viewed" status. This is your pending revenue.</li>
          <li><strong>Trend lines</strong> -- how your close rate, average value, and volume are trending over time.</li>
        </ul>

        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 not-prose text-sm text-blue-800 my-4">
          <strong>Why 10 estimates?</strong> With fewer than 10 data points, the numbers are not meaningful. A 50% close rate on 2 estimates is a coin flip. A 50% close rate on 40 estimates is a signal. GuildQuote waits until the data actually tells you something useful.
        </div>

        <h3>How to use it</h3>
        <p>Check your benchmarks monthly. Look for two things:</p>
        <ol>
          <li><strong>Is my close rate where I want it?</strong> Most painting contractors close between 30-50% of estimates. Below 30% might mean you are pricing too high or not following up. Above 60% might mean you are leaving money on the table.</li>
          <li><strong>Why are people saying no?</strong> Decline reasons tell you what to fix. Price objections suggest you need to present value better (or adjust pricing). "Went with someone else" means you are competing -- and you can ask what the other guy offered.</li>
        </ol>
      </div>
    </div>
  </section>

  <!-- Subcontractor Mode -->
  <section id="subcontractor-mode">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Subcontractor Mode</h2>
        <p>If you use subcontractors for some jobs, GuildQuote handles sub pricing separately from your standard pricing.</p>

        <h3>How it works</h3>
        <p>When you create an estimate, you can toggle <strong>Subcontractor Mode</strong>. This adjusts the pricing:</p>
        <ul>
          <li><strong>Sub cost</strong> is calculated using lower margins than your standard rates, reflecting the fact that the sub handles labor and you handle the client relationship.</li>
          <li><strong>Your margin on sub work</strong> is the difference between what you charge the client and what you pay the sub. This is typically lower than your margin on crew work, but you have zero labor management overhead.</li>
          <li>The estimate the client sees looks identical -- same branding, same format. The sub pricing is internal only.</li>
        </ul>

        <h3>When to use it</h3>
        <ul>
          <li>You won a job but your crew is booked and you want to sub it out</li>
          <li>The job is outside your service area but you have a trusted sub there</li>
          <li>You are a GC coordinating painting as part of a larger project</li>
          <li>You want to compare your crew cost vs. sub cost for the same job before deciding who does the work</li>
        </ul>

        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 not-prose text-sm text-blue-800 my-4">
          <strong>Sub estimates are tracked separately in your benchmarks.</strong> Your close rate and margins for sub work are reported independently from your crew work, so one does not distort the other.
        </div>
      </div>
    </div>
  </section>

  <!-- Navigation -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-200">
    <a href="/docs/output" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Previous: Output & Delivery</a>
    <a href="/docs" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to Docs Home</a>
  </div>
</div>
