import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { TenantConfig } from '$lib/types/index.js';
import type { SnapshotDocument } from './snapshot-templates.js';

/**
 * Creates a Project Snapshot as a Google Sheet in the contractor's Drive.
 * Crew-facing document: scope table with checkmarks, production, materials. No pricing.
 */
export async function createSnapshotSheet(
  tenant: TenantConfig,
  doc: SnapshotDocument,
): Promise<string | null> {
  if (!tenant.google_refresh_token) return null;

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Ensure folder exists
  let folderId = tenant.google_drive_folder_id;
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

  const title = `Snapshot - ${doc.client.name} - ${doc.client.address} - ${doc.header.date}`;

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Project Snapshot', gridProperties: { columnCount: 10, rowCount: 200 } } }],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;
  const sheetId = spreadsheet.data.sheets![0].properties!.sheetId!;

  // Move to folder
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: folderId,
    fields: 'id, parents',
  });

  // Parse accent color
  const hex = tenant.primary_color || '#2563eb';
  const accent = {
    red: parseInt(hex.slice(1, 3), 16) / 255,
    green: parseInt(hex.slice(3, 5), 16) / 255,
    blue: parseInt(hex.slice(5, 7), 16) / 255,
  };
  const headerBg = { red: 0.95, green: 0.95, blue: 0.95 };

  // Build rows
  const rows: (string | number)[][] = [];
  const boldRows: number[] = [];
  const accentRows: number[] = [];

  function addRow(cells: (string | number)[], opts?: { bold?: boolean; accent?: boolean }) {
    const idx = rows.length;
    rows.push(cells);
    if (opts?.bold) boldRows.push(idx);
    if (opts?.accent) accentRows.push(idx);
    return idx;
  }

  function addBlank() { rows.push([]); }

  // Header
  addRow([doc.header.company_name], { bold: true, accent: true });
  addRow([`${doc.header.trade_label} — Project Snapshot`]);
  addRow([`${doc.header.date}  |  Ref: ${doc.header.reference}`]);
  addBlank();

  // Client info
  addRow(['Client Information'], { bold: true, accent: true });
  addRow(['Name', doc.client.name]);
  addRow(['Address', doc.client.address]);
  if (doc.client.phone) addRow(['Phone', doc.client.phone]);
  if (doc.client.email) addRow(['Email', doc.client.email]);
  addBlank();

  // Scope table
  addRow(['Scope Detail'], { bold: true, accent: true });
  const tableHeaderRow = addRow(doc.scope_table.headers, { bold: true });
  for (const row of doc.scope_table.rows) {
    addRow(row.cells);
  }
  addBlank();

  // Production
  if (doc.production.hours_low > 0) {
    addRow(['Production Estimate'], { bold: true, accent: true });
    addRow(['Hours', `${doc.production.hours_low}-${doc.production.hours_high}`]);
    addRow(['Crew', `${doc.production.crew_size}-person`]);
    addRow(['Duration', `${doc.production.days_low}-${doc.production.days_high} days`]);
    addBlank();
  }

  // Materials
  if (doc.materials.length > 0) {
    addRow(['Materials'], { bold: true, accent: true });
    addRow(['Product', 'Coverage'], { bold: true });
    for (const m of doc.materials) {
      addRow([m.label, m.coverage]);
    }
    addBlank();
  }

  // Notes
  if (doc.estimator_notes) {
    addRow(['Estimator Notes'], { bold: true, accent: true });
    addRow([doc.estimator_notes]);
    addBlank();
  }

  // Footer
  addRow([`${doc.header.company_name}  |  ${doc.header.phone}  |  ${doc.header.email}`]);

  // Write all data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'Project Snapshot'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  // Format requests
  const formatRequests: any[] = [];

  // Bold rows
  for (const r of boldRows) {
    formatRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: r, endRowIndex: r + 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: 'userEnteredFormat.textFormat.bold',
      },
    });
  }

  // Accent text rows
  for (const r of accentRows) {
    formatRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: accent } } },
        fields: 'userEnteredFormat.textFormat(bold,foregroundColor)',
      },
    });
  }

  // Scope table header background
  formatRequests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: tableHeaderRow, endRowIndex: tableHeaderRow + 1 },
      cell: { userEnteredFormat: { backgroundColor: headerBg, textFormat: { bold: true } } },
      fields: 'userEnteredFormat(backgroundColor,textFormat.bold)',
    },
  });

  // Make checkmarks green in scope table rows
  const tableStart = tableHeaderRow + 1;
  const tableEnd = tableStart + doc.scope_table.rows.length;
  for (let r = tableStart; r < tableEnd; r++) {
    const rowData = rows[r];
    for (let c = 0; c < rowData.length; c++) {
      if (rowData[c] === '✓') {
        formatRequests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: c, endColumnIndex: c + 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: { red: 0.13, green: 0.55, blue: 0.13 } }, horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat(textFormat(bold,foregroundColor),horizontalAlignment)',
          },
        });
      }
    }
  }

  // Column widths
  formatRequests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 160 },
      fields: 'pixelSize',
    },
  });

  if (formatRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
