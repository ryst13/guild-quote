<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
  let sub = data.submission;

  let recipientEmail = $state(sub.email || '');
  let subject = $state(`Your ${data.tradeLabel} Estimate from ${data.tenant.company_name}`);
  let message = $state(
    `Hi ${sub.first_name},\n\nPlease find your ${data.tradeLabel.toLowerCase()} estimate attached. This is based on the scope we discussed during our walkthrough.\n\nThe estimated total is $${Math.round(sub.grand_total).toLocaleString()}.\n\nIf you have any questions, please don't hesitate to reply to this email${data.tenant.contact_phone ? ` or call us at ${data.tenant.contact_phone}` : ''}.\n\nBest regards,\n${data.tenant.company_name}`
  );
  let attachPdf = $state(true);
  let includeDocLink = $state(false);
  let sending = $state(false);
  let sent = $state(false);
  let sendError = $state('');

  async function sendEstimate() {
    if (!recipientEmail) {
      sendError = 'Recipient email is required.';
      return;
    }
    sending = true;
    sendError = '';

    const res = await fetch(`/api/submissions/${sub.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        message,
        attach_pdf: attachPdf,
        include_doc_link: includeDocLink,
      }),
    });

    if (res.ok) {
      sent = true;
    } else {
      const result = await res.json().catch(() => ({ error: 'Send failed' }));
      sendError = result.error || 'Failed to send email.';
    }
    sending = false;
  }
</script>

<svelte:head>
  <title>Send Estimate — GuildQuote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-2xl px-4 py-3 flex items-center gap-4">
      <a href="/dashboard/{sub.id}" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Estimate</a>
      <h1 class="font-bold text-gray-900">Send to Client</h1>
    </div>
  </div>

  <div class="mx-auto max-w-2xl px-4 py-8">
    {#if sent}
      <div class="rounded-2xl bg-white border border-gray-200 p-10 text-center">
        <div class="text-4xl mb-4">&#9989;</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Estimate Sent</h2>
        <p class="text-sm text-gray-500 mb-6">
          Sent to <strong>{recipientEmail}</strong> with your {data.tradeLabel.toLowerCase()} estimate for ${Math.round(sub.grand_total).toLocaleString()}.
        </p>
        <div class="flex justify-center gap-3">
          <a href="/dashboard/{sub.id}" class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            View Estimate
          </a>
          <a href="/dashboard" class="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Dashboard
          </a>
        </div>
      </div>
    {:else}
      <!-- Estimate Summary -->
      <div class="rounded-xl bg-white border border-gray-200 p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-gray-900">{sub.first_name} {sub.last_name}</div>
            <div class="text-sm text-gray-500">{sub.address}</div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold text-green-700">${Math.round(sub.grand_total).toLocaleString()}</div>
            <div class="text-xs text-gray-500">{data.tradeLabel}</div>
          </div>
        </div>
      </div>

      {#if sendError}
        <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 mb-4">{sendError}</div>
      {/if}

      <div class="rounded-xl bg-white border border-gray-200 p-6 space-y-5">
        <!-- Recipient -->
        <div>
          <label for="send-to" class="block text-sm font-medium text-gray-700 mb-1">Send to</label>
          <input id="send-to" type="email" bind:value={recipientEmail} placeholder="client@email.com" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          {#if !sub.email}
            <p class="text-xs text-yellow-600 mt-1">No email was provided during scope entry. Add the client's email above.</p>
          {/if}
        </div>

        <!-- Subject -->
        <div>
          <label for="send-subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input id="send-subject" type="text" bind:value={subject} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>

        <!-- Message -->
        <div>
          <label for="send-message" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea id="send-message" bind:value={message} rows={8} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"></textarea>
        </div>

        <!-- Attachments -->
        <div class="border-t border-gray-100 pt-4">
          <div class="text-sm font-medium text-gray-700 mb-3">Include with email</div>
          <div class="space-y-2">
            {#if sub.estimate_pdf_url}
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" bind:checked={attachPdf} class="rounded border-gray-300" />
                Attach estimate PDF
              </label>
            {/if}
            {#if sub.google_doc_url}
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" bind:checked={includeDocLink} class="rounded border-gray-300" />
                Include Google Doc link in message
              </label>
            {/if}
          </div>
        </div>

        <!-- Send method indicator -->
        <div class="border-t border-gray-100 pt-4">
          <div class="text-xs text-gray-400">
            {#if data.tenant.has_google}
              Sending via your connected Gmail account
            {:else}
              Sending via GuildQuote email
            {/if}
          </div>
        </div>

        <!-- Send button -->
        <button
          onclick={sendEstimate}
          disabled={sending || !recipientEmail}
          class="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Estimate'}
        </button>
      </div>
    {/if}
  </div>
</div>
