import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { TenantConfig } from '$lib/types/index.js';
import type { EstimateDocument } from './estimate-templates.js';

/**
 * Creates a professional estimate as a Google Sheet in the contractor's Drive.
 * Formatted to look clean when printed — mirrors the RP Generator's Estimate tab.
 */
export async function createEstimateSheet(
  tenant: TenantConfig,
  doc: EstimateDocument,
  projectFolderId?: string | null,
): Promise<string | null> {
  if (!tenant.google_refresh_token) return null;

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

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

  const title = `Estimate - ${doc.header.client_name} - ${doc.header.client_address} - ${doc.header.date}`;

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Estimate', gridProperties: { columnCount: 10, rowCount: 300 } } }],
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

  const accent = hexToSheetColor(tenant.primary_color) || { red: 0.15, green: 0.35, blue: 0.65 };
  const white = { red: 1, green: 1, blue: 1 };
  const lightBg = { red: 0.97, green: 0.97, blue: 0.97 };
  const borderColor = { red: 0.85, green: 0.85, blue: 0.85 };

  const rows: (string | number)[][] = [];
  const boldRows: number[] = [];
  const sectionRows: number[] = [];
  const accentTextRows: number[] = [];
  const grayBgRows: number[] = [];
  const mergeRanges: { startRow: number; endRow: number; startCol: number; endCol: number }[] = [];
  const wrapRows: number[] = [];

  function addRow(cells: (string | number)[], opts?: { bold?: boolean; section?: boolean; accent?: boolean; grayBg?: boolean; wrap?: boolean }) {
    const idx = rows.length;
    rows.push(cells);
    if (opts?.bold) boldRows.push(idx);
    if (opts?.section) sectionRows.push(idx);
    if (opts?.accent) accentTextRows.push(idx);
    if (opts?.grayBg) grayBgRows.push(idx);
    if (opts?.wrap) wrapRows.push(idx);
    return idx;
  }

  function addBlank() { rows.push([]); }
  function mergeRow(row: number, cols = 8) { mergeRanges.push({ startRow: row, endRow: row + 1, startCol: 0, endCol: cols }); }

  // ═══════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════
  addRow([doc.header.company_name], { bold: true, accent: true });
  addRow([`${doc.header.trade_label} Estimate`]);
  addBlank();

  addRow(['Prepared for:', '', '', '', '', '', 'Date:', doc.header.date], { grayBg: true });
  addRow([doc.header.client_name, '', '', '', '', '', 'Ref:', doc.header.reference], { bold: true });
  addRow([doc.header.client_address, '', '', '', '', '', 'Valid:', '30 days']);
  if (doc.header.client_email || doc.header.client_phone) {
    addRow([doc.header.client_email || '', '', '', doc.header.client_phone || '']);
  }
  addBlank();

  // ═══════════════════════════════════════════════════════
  // SURFACE GRADE
  // ═══════════════════════════════════════════════════════
  addRow(['EXISTING SURFACE GRADE'], { section: true });
  mergeRow(rows.length - 1);
  addBlank();

  addRow([`Grade: ${doc.surface_grade.selected} — ${doc.surface_grade.label}`], { bold: true });

  const descRow = addRow([doc.surface_grade.description], { wrap: true });
  mergeRow(descRow, 9);
  addBlank();

  for (const g of doc.surface_grade.all_grades) {
    const indicator = g.selected ? '\u261B ' : '   ';
    addRow([`${indicator}${g.grade}`, g.label], g.selected ? { bold: true } : { grayBg: true });
  }
  addBlank();

  // ═══════════════════════════════════════════════════════
  // WORK DESCRIPTION
  // ═══════════════════════════════════════════════════════
  addRow(['WORK DESCRIPTION'], { section: true });
  mergeRow(rows.length - 1);
  addBlank();

  for (const room of doc.work_description) {
    addRow([room.area], { bold: true, grayBg: true });
    for (const bullet of room.bullets) {
      const bulletRow = addRow([`  \u25C9  ${bullet}`], { wrap: true });
      mergeRow(bulletRow, 9);
    }
    if (room.notes) {
      const noteRow = addRow([`  Note: ${room.notes}`], { wrap: true });
      mergeRow(noteRow, 9);
    }
    addBlank();
  }

  // ═══════════════════════════════════════════════════════
  // PROJECT RECAP TABLE
  // ═══════════════════════════════════════════════════════
  addRow(['PROJECT RECAP'], { section: true });
  mergeRow(rows.length - 1);
  addBlank();

  const recapHeaderRow = addRow(['Area', '', 'Price', 'Walls', 'Ceilings', 'Doors', 'Windows', 'Trim', 'Repairs'], { bold: true, grayBg: true });

  let isAlternate = false;
  for (const row of doc.recap_table.rows) {
    addRow(
      [row.area, '', `$${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, row.walls, row.ceilings, row.doors, row.windows, row.trim, row.repairs],
      isAlternate ? { grayBg: true } : undefined
    );
    isAlternate = !isAlternate;
  }
  addBlank();

  addRow(['', '', '', '', '', '', '', 'Materials', `$${doc.recap_table.materials_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`], { bold: true });
  addBlank();

  const totalRow = addRow(['', '', '', '', '', '', '', 'TOTAL', `$${doc.recap_table.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`], { bold: true, accent: true });
  addBlank();

  // Production
  if (doc.production.hours_low > 0) {
    addRow([`Estimated: ${doc.production.hours_low}-${doc.production.hours_high} hours  |  ${doc.production.crew_size}-person crew  |  ${doc.production.days_low}-${doc.production.days_high} days`]);
    mergeRow(rows.length - 1, 9);
    addBlank();
  }

  // ═══════════════════════════════════════════════════════
  // PAYMENT TERMS
  // ═══════════════════════════════════════════════════════
  addRow(['YOUR HOME INVESTMENT'], { section: true });
  mergeRow(rows.length - 1);
  addBlank();

  addRow(['Deposit', 'Due at signing of contract', '', '', '', `$${doc.payment_terms.deposit_amount.toLocaleString()}`, `${Math.round(doc.payment_terms.deposit_pct * 100)}%`], { bold: true });

  if (doc.payment_terms.progress_pct && doc.payment_terms.progress_amount) {
    addRow(['Progress', 'Due at 50% completion', '', '', '', `$${doc.payment_terms.progress_amount.toLocaleString()}`, `${Math.round(doc.payment_terms.progress_pct * 100)}%`], { bold: true });
  }

  addRow(['Completion', 'Due at 100% project completion', '', '', '', `$${doc.payment_terms.completion_amount.toLocaleString()}`, `${Math.round(doc.payment_terms.completion_pct * 100)}%`], { bold: true });
  addBlank();

  addRow(['', '', '', '', '', `Total: $${doc.payment_terms.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`], { bold: true, accent: true });
  addBlank();
  addBlank();

  // ═══════════════════════════════════════════════════════
  // SIGNATURE
  // ═══════════════════════════════════════════════════════
  addRow(['Prepared by:', '', doc.header.company_name]);
  addRow(['', '', doc.header.date]);
  addBlank();
  addRow(['Accepted by:', '', '________________________', '', '', 'Date:', '________']);
  addBlank();

  const sigRow = addRow([`By signing, you authorize ${doc.header.company_name} to proceed with the work described above at the stated investment.`], { wrap: true });
  mergeRow(sigRow, 9);
  addBlank();

  // Footer
  const footerParts = [doc.header.company_name, doc.header.phone, doc.header.email].filter(Boolean);
  const footerRow = addRow([footerParts.join('  |  ')]);
  mergeRow(footerRow, 9);

  // ═══════════════════════════════════════════════════════
  // WRITE DATA
  // ═══════════════════════════════════════════════════════
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Estimate!A1:J${rows.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  // ═══════════════════════════════════════════════════════
  // FORMATTING
  // ═══════════════════════════════════════════════════════
  const formatRequests: any[] = [];

  // Column widths — make it print-friendly
  const colWidths = [160, 100, 100, 70, 70, 70, 70, 80, 80, 60];
  for (let i = 0; i < colWidths.length; i++) {
    formatRequests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: colWidths[i] },
        fields: 'pixelSize',
      },
    });
  }

  // Company name — large accent
  formatRequests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
      cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: accent, fontSize: 20 } } },
      fields: 'userEnteredFormat.textFormat',
    },
  });

  // Trade label — subtitle
  formatRequests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 10 },
      cell: { userEnteredFormat: { textFormat: { fontSize: 12, foregroundColor: { red: 0.4, green: 0.4, blue: 0.4 } } } },
      fields: 'userEnteredFormat.textFormat',
    },
  });

  // Section header rows — accent background, white bold text
  for (const idx of sectionRows) {
    formatRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: idx, endRowIndex: idx + 1, startColumnIndex: 0, endColumnIndex: 10 },
        cell: {
          userEnteredFormat: {
            backgroundColor: accent,
            textFormat: { bold: true, foregroundColor: white, fontSize: 11 },
            padding: { top: 6, bottom: 6 },
          },
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.padding',
      },
    });
  }

  // Bold rows
  for (const idx of boldRows) {
    if (!sectionRows.includes(idx)) {
      formatRequests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: idx, endRowIndex: idx + 1, startColumnIndex: 0, endColumnIndex: 10 },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: 'userEnteredFormat.textFormat.bold',
        },
      });
    }
  }

  // Accent text rows
  for (const idx of accentTextRows) {
    if (!sectionRows.includes(idx)) {
      formatRequests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: idx, endRowIndex: idx + 1, startColumnIndex: 0, endColumnIndex: 10 },
          cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: accent, fontSize: 14 } } },
          fields: 'userEnteredFormat.textFormat',
        },
      });
    }
  }

  // Gray background rows
  for (const idx of grayBgRows) {
    if (!sectionRows.includes(idx)) {
      formatRequests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: idx, endRowIndex: idx + 1, startColumnIndex: 0, endColumnIndex: 10 },
          cell: { userEnteredFormat: { backgroundColor: lightBg } },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });
    }
  }

  // Wrap text rows
  for (const idx of wrapRows) {
    formatRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: idx, endRowIndex: idx + 1, startColumnIndex: 0, endColumnIndex: 10 },
        cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
        fields: 'userEnteredFormat.wrapStrategy',
      },
    });
  }

  // Merge cells
  for (const mr of mergeRanges) {
    formatRequests.push({
      mergeCells: {
        range: { sheetId, startRowIndex: mr.startRow, endRowIndex: mr.endRow, startColumnIndex: mr.startCol, endColumnIndex: mr.endCol },
        mergeType: 'MERGE_ALL',
      },
    });
  }

  // Hide gridlines for a cleaner print look
  formatRequests.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { hideGridlines: true } },
      fields: 'gridProperties.hideGridlines',
    },
  });

  // Apply all formatting
  if (formatRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

function hexToSheetColor(hex: string): { red: number; green: number; blue: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255,
  };
}
