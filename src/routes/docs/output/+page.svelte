<svelte:head>
  <title>Output & Delivery — GuildQuote Docs</title>
  <meta name="description" content="GuildQuote output formats: PDF, Google Docs, Google Sheets. White-label branding, Gmail email delivery, and multilingual crew snapshots for your painting crew." />
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Output & Delivery</h1>
    <p class="text-lg text-gray-600">Generate professional documents, brand them with your logo, and deliver them to your client -- all from one screen.</p>
  </div>

  <!-- Document Formats -->
  <section id="document-formats">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Document Formats</h2>
        <p>Every estimate can be output in three formats. You can generate all three from the same estimate -- they stay in sync.</p>
      </div>

      <div class="mt-4 space-y-3">
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">PDF</div>
          <p class="text-sm text-gray-500">A polished, branded document ready to email or print. Includes your logo, colors, line items, production estimates, and terms. This is what most clients expect to receive.</p>
          <p class="text-xs text-gray-400 mt-2">Best for: email delivery, in-person presentations, printing.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Google Docs</div>
          <p class="text-sm text-gray-500">A formatted document saved to your Google Drive. You can share it via link, make edits after the fact, or use it as a starting point for a more detailed proposal. Useful if you want to add custom notes or contract language.</p>
          <p class="text-xs text-gray-400 mt-2">Best for: collaborative editing, detailed proposals, contracts.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Google Sheets</div>
          <p class="text-sm text-gray-500">A full line-item spreadsheet in your Drive. Every section, item, quantity, and price broken out in rows and columns. Useful for your own records, for sharing with a bookkeeper, or for clients who want to see every detail.</p>
          <p class="text-xs text-gray-400 mt-2">Best for: internal records, bookkeeping, detail-oriented clients.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Branding -->
  <section id="branding">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">White-Label Branding</h2>
        <p>Every document GuildQuote generates carries your branding, not ours. Your client sees your business -- not a software tool.</p>

        <h3>What you can customize</h3>
        <ul>
          <li><strong>Company name</strong> -- appears in the header of every estimate</li>
          <li><strong>Logo</strong> -- upload your logo (PNG, JPG, or SVG). It appears on PDFs and documents.</li>
          <li><strong>Primary color</strong> -- your brand color is used for headers, accents, and highlight elements in the PDF</li>
          <li><strong>Accent color</strong> -- secondary color for additional visual elements</li>
          <li><strong>Contact information</strong> -- phone, email, website, and license number</li>
        </ul>

        <h3>Where branding appears</h3>
        <ul>
          <li>PDF estimate header and footer</li>
          <li>Google Docs title block</li>
          <li>Email sender name and signature</li>
          <li>Client-facing estimate view</li>
        </ul>

        <p>Set up your branding in <strong>Settings &gt; Branding</strong>. Changes apply to all future estimates. Existing estimates keep the branding they were generated with.</p>
      </div>
    </div>
  </section>

  <!-- Email Delivery -->
  <section id="email-delivery">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Email Delivery</h2>
        <p>Send estimates directly from GuildQuote using your connected Gmail account. The email comes from your actual email address, not from a generic noreply.</p>

        <h3>How it works</h3>
        <ol>
          <li>Connect your Gmail account in <strong>Settings &gt; Integrations</strong> (one-time setup via Google OAuth).</li>
          <li>When you are ready to send an estimate, click <strong>Send to Client</strong>.</li>
          <li>GuildQuote composes the email with the PDF attached and a link to the Google Doc (if generated).</li>
          <li>The email sends from your Gmail address. It shows up in your Sent folder.</li>
        </ol>

        <h3>What the client receives</h3>
        <ul>
          <li>A professional email with your company name and branding</li>
          <li>The PDF estimate as an attachment</li>
          <li>Optionally, a link to the Google Doc version for online viewing</li>
        </ul>

        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 not-prose text-sm text-blue-800 my-4">
          <strong>Why Gmail?</strong> Emails from your real address get better deliverability than emails from a generic SaaS sender. Your client sees your name and can reply directly to you. No middleman.
        </div>

        <p>If you have not connected Gmail, you can still download the PDF and send it yourself from your regular email client.</p>
      </div>
    </div>
  </section>

  <!-- Crew Snapshots -->
  <section id="crew-snapshots">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Multilingual Crew Snapshots</h2>
        <p>A crew snapshot is a scope-only document designed for your painting crew. It tells them <strong>what to do</strong> -- rooms, surfaces, prep, coats, colors -- without showing any pricing.</p>

        <h3>What is included</h3>
        <ul>
          <li>Job address and client name</li>
          <li>Room-by-room or surface-by-surface scope breakdown</li>
          <li>Prep requirements for each area</li>
          <li>Paint products, colors, and number of coats</li>
          <li>Production hour estimates and duration</li>
          <li>Crew size recommendation</li>
        </ul>

        <h3>Language support</h3>
        <p>Crew snapshots can be generated in multiple languages:</p>
        <ul>
          <li><strong>English (EN)</strong></li>
          <li><strong>Spanish (ES)</strong></li>
          <li><strong>Portuguese (PT)</strong></li>
        </ul>
        <p>Select the language when generating the snapshot. The scope content is translated; your company name and branding stay in English.</p>

        <h3>Output options</h3>
        <p>Crew snapshots are available as a PDF download or a Google Sheets document. The Sheets version is useful if your crew lead wants to check off rooms as they complete them.</p>

        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 not-prose text-sm text-blue-800 my-4">
          <strong>Why this matters.</strong> If your crew's first language is Spanish or Portuguese, handing them a scope document in their language means fewer mistakes, fewer callbacks, and faster execution. It takes 10 seconds to generate.
        </div>
      </div>
    </div>
  </section>

  <!-- Navigation -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-200">
    <a href="/docs/pricing" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Previous: Pricing</a>
    <a href="/docs/tracking" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Next: Tracking & Analytics</a>
  </div>
</div>
