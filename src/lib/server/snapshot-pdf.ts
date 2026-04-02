import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { SnapshotDocument } from './snapshot-templates.js';
import type { TenantConfig } from '$lib/types/index.js';

export async function generateSnapshotPDF(doc: SnapshotDocument, tenant: TenantConfig): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // 8.5"
  const pageHeight = 792; // 11"
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const darkGray = rgb(0.15, 0.15, 0.15);
  const medGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);

  // Parse accent color
  const hex = tenant.primary_color || '#2563eb';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const accentColor = rgb(r, g, b);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const t = doc.t;

  function checkPage(needed: number) {
    if (y - needed < margin + 40) {
      // Footer on current page
      page.drawText(`${doc.header.company_name}`, { x: margin, y: margin - 10, font, size: 7, color: lightGray });
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawText(text: string, options: { bold?: boolean; size?: number; color?: typeof darkGray; indent?: number } = {}) {
    const f = options.bold ? fontBold : font;
    const sz = options.size || 9;
    const clr = options.color || darkGray;
    const x = margin + (options.indent || 0);

    // Word wrap
    const words = text.split(' ');
    let line = '';
    const maxW = contentWidth - (options.indent || 0);

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, sz) > maxW && line) {
        checkPage(sz + 4);
        page.drawText(line, { x, y, font: f, size: sz, color: clr });
        y -= sz + 4;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      checkPage(sz + 4);
      page.drawText(line, { x, y, font: f, size: sz, color: clr });
      y -= sz + 4;
    }
  }

  function drawSectionHeader(text: string) {
    checkPage(30);
    y -= 8;
    page.drawText(text, { x: margin, y, font: fontBold, size: 12, color: accentColor });
    y -= 3;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 1, color: accentColor });
    y -= 14;
  }

  // === HEADER ===
  page.drawText(doc.header.company_name, { x: margin, y, font: fontBold, size: 16, color: accentColor });
  y -= 18;
  page.drawText(`${t.snapshot.title} — ${doc.header.trade_label}`, { x: margin, y, font, size: 11, color: medGray });
  y -= 14;
  page.drawText(`${t.estimate.date}: ${doc.header.date}  |  ${t.estimate.reference}: ${doc.header.reference}`, { x: margin, y, font, size: 8, color: lightGray });
  y -= 20;

  // === CLIENT INFO ===
  drawSectionHeader(t.snapshot.client_info);
  drawText(`${t.snapshot.name}: ${doc.client.name}`, { bold: true });
  drawText(`${t.snapshot.address}: ${doc.client.address}`);
  if (doc.client.phone) drawText(`${t.snapshot.phone}: ${doc.client.phone}`);
  if (doc.client.email) drawText(`${t.snapshot.email}: ${doc.client.email}`);
  y -= 8;

  // === SCOPE SUMMARY ===
  drawSectionHeader(t.snapshot.scope_summary);
  drawText(`${t.snapshot.trade}: ${doc.scope_summary.trade}`);
  drawText(`${doc.scope_summary.count_label}: ${doc.scope_summary.count}`);
  if (doc.scope_summary.total_sqft > 0) {
    drawText(`${t.snapshot.total_sqft}: ${doc.scope_summary.total_sqft.toLocaleString()}`);
  }
  y -= 8;

  // === SCOPE TABLE ===
  if (doc.scope_table && doc.scope_table.rows.length > 0) {
    drawSectionHeader(t.snapshot.detail);
    const colCount = doc.scope_table.headers.length;
    const colWidth = contentWidth / colCount;
    const rowHeight = 16;
    const tableBg = rgb(0.95, 0.95, 0.95);
    const borderClr = rgb(0.82, 0.82, 0.82);

    // Header row
    checkPage(rowHeight * (doc.scope_table.rows.length + 2));
    page.drawRectangle({ x: margin, y: y - rowHeight + 4, width: contentWidth, height: rowHeight, color: tableBg });
    for (let c = 0; c < colCount; c++) {
      page.drawText(doc.scope_table.headers[c], { x: margin + c * colWidth + 4, y: y - 8, font: fontBold, size: 7, color: darkGray });
    }
    page.drawLine({ start: { x: margin, y: y - rowHeight + 4 }, end: { x: margin + contentWidth, y: y - rowHeight + 4 }, thickness: 0.5, color: borderClr });
    y -= rowHeight;

    // Data rows
    for (let r = 0; r < doc.scope_table.rows.length; r++) {
      const row = doc.scope_table.rows[r];
      checkPage(rowHeight);
      // Alternate row background
      if (r % 2 === 1) {
        page.drawRectangle({ x: margin, y: y - rowHeight + 4, width: contentWidth, height: rowHeight, color: rgb(0.98, 0.98, 0.98) });
      }
      for (let c = 0; c < row.cells.length; c++) {
        const cell = row.cells[c];
        const cellColor = cell === '✓' ? rgb(0.13, 0.55, 0.13) : medGray;
        const cellFont = cell === '✓' ? fontBold : font;
        page.drawText(cell, { x: margin + c * colWidth + 4, y: y - 8, font: cellFont, size: 7.5, color: cellColor });
      }
      page.drawLine({ start: { x: margin, y: y - rowHeight + 4 }, end: { x: margin + contentWidth, y: y - rowHeight + 4 }, thickness: 0.3, color: borderClr });
      y -= rowHeight;
    }
    y -= 8;
  }

  // === PRODUCTION ===
  if (doc.production.hours_low > 0) {
    drawSectionHeader(t.snapshot.production);
    drawText(`${doc.production.hours_low}-${doc.production.hours_high} ${t.estimate.hours}  |  ${doc.production.crew_size}${t.estimate.person_crew}  |  ${doc.production.days_low}-${doc.production.days_high} ${t.estimate.days}`);
    y -= 8;
  }

  // === MATERIALS ===
  if (doc.materials.length > 0) {
    drawSectionHeader(t.snapshot.materials_list);
    for (const m of doc.materials) {
      drawText(`${m.label} — ${m.coverage}`);
    }
    y -= 8;
  }

  // === NOTES ===
  if (doc.estimator_notes) {
    drawSectionHeader(t.snapshot.estimator_notes);
    drawText(doc.estimator_notes);
    y -= 8;
  }

  // === FOOTER ===
  const footerY = margin - 10;
  page.drawText(`${doc.header.company_name}  |  ${doc.header.phone}  |  ${doc.header.email}`, { x: margin, y: footerY, font, size: 7, color: lightGray });

  return Buffer.from(await pdfDoc.save());
}
