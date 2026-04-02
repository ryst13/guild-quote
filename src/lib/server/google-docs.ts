import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { TenantConfig, QuoteResult, ClientInfo } from '$lib/types/index.js';

export async function createEstimateDoc(
  tenant: TenantConfig,
  client: ClientInfo,
  quote: QuoteResult,
  submissionId: string,
  projectFolderId?: string | null,
): Promise<string | null> {
  if (!tenant.google_refresh_token) return null;

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const docs = google.docs({ version: 'v1', auth: oauth2Client });

  // Determine target folder: project folder (new structure) > legacy Estimates folder > create legacy
  let folderId = projectFolderId || tenant.google_drive_folder_id;
  if (!folderId) {
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
      insertText(`  ${item.label}  x${item.quantity}  $${item.sales_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    insertText(`  Section Total: $${section.sales_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true);
    insertText('');
  }

  // Surcharges
  if (quote.surcharges.length > 0) {
    insertText('Surcharges', true, 12);
    for (const s of quote.surcharges) {
      insertText(`  ${s.label}: $${s.sales_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    insertText('');
  }

  // Labor total
  insertText(`Labor Total: $${quote.labor_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true, 13);
  insertText('');

  // Materials
  if (quote.materials.length > 0) {
    insertText('Materials', true, 12);
    for (const m of quote.materials) {
      insertText(`  ${m.label}${m.gallons ? ` (${m.gallons} gal)` : ''}: $${m.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    insertText(`Materials Total: $${quote.materials_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true);
    insertText('');
  }

  // Grand total
  insertText(`GRAND TOTAL: $${quote.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true, 16);
  insertText('');

  // Production (show ranges ±20%)
  if (quote.production.painting_hours > 0) {
    const hrs = quote.production.painting_hours;
    const days = quote.production.duration_days;
    const hrsLow = Math.max(1, Math.round(hrs * 0.80));
    const hrsHigh = Math.max(hrsLow + 1, Math.round(hrs * 1.20));
    const dLow = Math.max(0.5, Math.round(days * 0.80 * 2) / 2);
    const dHigh = Math.max(dLow + 0.5, Math.round(days * 1.20 * 2) / 2);
    insertText(`Estimated: ${hrsLow}-${hrsHigh} hours, ${quote.production.crew_size}-person crew, ${dLow}-${dHigh} days`);
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
