import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { TenantConfig, QuoteResult, ClientInfo } from '$lib/types/index.js';

export async function createEstimateDoc(
  tenant: TenantConfig,
  client: ClientInfo,
  quote: QuoteResult,
  submissionId: string,
): Promise<string | null> {
  if (!tenant.google_refresh_token) return null;

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const docs = google.docs({ version: 'v1', auth: oauth2Client });

  // Ensure folder exists
  let folderId = tenant.google_drive_folder_id;
  if (!folderId) {
    // Create GuildQuote/Estimates folder
    const gqFolder = await drive.files.create({
      requestBody: { name: 'GuildQuote', mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    const estFolder = await drive.files.create({
      requestBody: { name: 'Estimates', mimeType: 'application/vnd.google-apps.folder', parents: [gqFolder.data.id!] },
      fields: 'id',
    });
    folderId = estFolder.data.id!;
  }

  const tradeLabel = quote.trade_type === 'interior' ? 'Interior Painting' :
    quote.trade_type === 'exterior' ? 'Exterior Painting' : 'Epoxy & Garage Coatings';

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docTitle = `Estimate - ${client.name} - ${client.address} - ${dateStr}`;

  // Create the doc
  const doc = await docs.documents.create({
    requestBody: { title: docTitle },
  });

  const docId = doc.data.documentId!;

  // Move to folder
  await drive.files.update({
    fileId: docId,
    addParents: folderId,
    fields: 'id, parents',
  });

  // Build doc content
  const requests: any[] = [];
  let idx = 1;

  function insertText(text: string, bold = false, fontSize = 11) {
    requests.push({
      insertText: { location: { index: idx }, text: text + '\n' },
    });
    requests.push({
      updateTextStyle: {
        range: { startIndex: idx, endIndex: idx + text.length },
        textStyle: { bold, fontSize: { magnitude: fontSize, unit: 'PT' } },
        fields: 'bold,fontSize',
      },
    });
    idx += text.length + 1;
  }

  // Header
  insertText(tenant.company_name, true, 18);
  insertText(`${tradeLabel} Estimate`, false, 14);
  insertText('');

  // Client
  insertText('Prepared for:', true, 11);
  insertText(`${client.name}`);
  insertText(`${client.address}`);
  if (client.email) insertText(client.email);
  if (client.phone) insertText(client.phone);
  insertText('');
  insertText(`Date: ${dateStr}  |  Ref: ${submissionId.slice(0, 8).toUpperCase()}`);
  insertText('');

  // Line items by section
  for (const section of quote.sections) {
    insertText(section.label, true, 12);
    for (const item of section.items) {
      insertText(`  ${item.label}  x${item.quantity}  $${Math.round(item.sales_price).toLocaleString()}`);
    }
    insertText(`  Section Total: $${Math.round(section.sales_price).toLocaleString()}`, true);
    insertText('');
  }

  // Surcharges
  if (quote.surcharges.length > 0) {
    insertText('Surcharges', true, 12);
    for (const s of quote.surcharges) {
      insertText(`  ${s.label}: $${Math.round(s.sales_amount).toLocaleString()}`);
    }
    insertText('');
  }

  // Labor total
  insertText(`Labor Total: $${Math.round(quote.labor_total).toLocaleString()}`, true, 13);
  insertText('');

  // Materials
  if (quote.materials.length > 0) {
    insertText('Materials', true, 12);
    for (const m of quote.materials) {
      insertText(`  ${m.label}${m.gallons ? ` (${m.gallons} gal)` : ''}: $${Math.round(m.cost).toLocaleString()}`);
    }
    insertText(`Materials Total: $${Math.round(quote.materials_total).toLocaleString()}`, true);
    insertText('');
  }

  // Grand total
  insertText(`GRAND TOTAL: $${Math.round(quote.grand_total).toLocaleString()}`, true, 16);
  insertText('');

  // Production
  if (quote.production.painting_hours > 0) {
    insertText(`Estimated: ${quote.production.painting_hours.toFixed(1)} hours, ${quote.production.crew_size}-person crew, ~${quote.production.duration_days.toFixed(1)} days`);
    insertText('');
  }

  // Footer
  insertText('---');
  const footerParts = [tenant.company_name, tenant.contact_phone, tenant.contact_email].filter(Boolean);
  insertText(footerParts.join(' | '));

  // Apply all requests
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }

  return `https://docs.google.com/document/d/${docId}/edit`;
}
