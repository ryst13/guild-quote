import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TenantConfig } from '$lib/types/index.js';
import type { EstimateDocument } from './estimate-templates.js';

/**
 * Professional 8-section estimate PDF generator.
 * Matches the Ryan Painting estimate format adapted for GuildQuote multi-tenant use.
 *
 * Sections:
 * 1. Header (company info, client info, date, reference)
 * 2. Surface Grade (selected grade with description + legend)
 * 3. Work Description (per-room narratives with bullet points + notes)
 * 4. Prep Level (selected level with description + options)
 * 5. Project Recap Table (per-room pricing breakdown)
 * 6. Payment Terms ("Your Home Investment")
 * 7. Signature Block
 * 8. Footer
 */
export async function generateEstimatePDF(
  doc: EstimateDocument,
  tenant: TenantConfig,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const accent = hexToRgb(tenant.primary_color) || { r: 0.15, g: 0.35, b: 0.65 };
  const darkGray = rgb(0.15, 0.15, 0.15);
  const medGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const accentColor = rgb(accent.r, accent.g, accent.b);
  const lineColor = rgb(0.85, 0.85, 0.85);
  const bulletColor = rgb(0.3, 0.3, 0.3);

  function text(str: string, x: number, yPos: number, opts: { font?: typeof font; size?: number; color?: typeof darkGray; maxWidth?: number } = {}) {
    const f = opts.font || font;
    const s = opts.size || 10;
    const c = opts.color || darkGray;
    const maxW = opts.maxWidth || contentWidth;

    const lines = wrapText(str, f, s, maxW);
    for (const line of lines) {
      checkPage(s + 4);
      page.drawText(line, { x, y: yPos, font: f, size: s, color: c });
      yPos -= s + 3;
    }
    return yPos;
  }

  function drawLine(yPos: number, color = lineColor) {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 0.5, color });
  }

  function sectionHeader(title: string) {
    checkPage(40);
    y -= 8;
    page.drawText(title.toUpperCase(), { x: margin, y, font: fontBold, size: 11, color: accentColor });
    y -= 6;
    drawLine(y, accentColor);
    y -= 16;
  }

  function checkPage(needed: number) {
    if (y - needed < margin + 40) {
      // Footer on current page
      drawFooter();
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawFooter() {
    const footerY = margin + 10;
    drawLine(footerY + 14);
    const parts = [doc.header.company_name, doc.header.phone, doc.header.email].filter(Boolean);
    page.drawText(parts.join('  |  '), { x: margin, y: footerY, font, size: 7, color: lightGray });
  }

  // ─── SECTION 1: HEADER ────────────────────────────────────────

  page.drawText(doc.header.company_name, { x: margin, y, font: fontBold, size: 20, color: accentColor });
  y -= 22;
  page.drawText(`${doc.header.trade_label} Estimate`, { x: margin, y, font, size: 12, color: medGray });

  // Right-aligned info
  const rightX = pageWidth - margin;
  const infoStartY = pageHeight - margin;
  const rText = (str: string, yPos: number, opts: { bold?: boolean } = {}) => {
    const f = opts.bold ? fontBold : font;
    const w = f.widthOfTextAtSize(str, 9);
    page.drawText(str, { x: rightX - w, y: yPos, font: f, size: 9, color: medGray });
  };
  if (doc.header.phone) rText(doc.header.phone, infoStartY);
  if (doc.header.email) rText(doc.header.email, infoStartY - 13);
  rText(`Date: ${doc.header.date}`, infoStartY - 30);
  rText(`Ref: ${doc.header.reference}`, infoStartY - 43);
  rText('Valid for 30 days', infoStartY - 56);

  y -= 20;
  drawLine(y);
  y -= 18;

  // Client info
  page.drawText('Prepared for:', { x: margin, y, font: fontBold, size: 9, color: medGray });
  y -= 15;
  page.drawText(doc.header.client_name, { x: margin, y, font: fontBold, size: 11, color: darkGray });
  y -= 14;
  page.drawText(doc.header.client_address, { x: margin, y, font, size: 10, color: darkGray });
  if (doc.header.client_email) { y -= 13; page.drawText(doc.header.client_email, { x: margin, y, font, size: 9, color: medGray }); }
  if (doc.header.client_phone) { y -= 13; page.drawText(doc.header.client_phone, { x: margin, y, font, size: 9, color: medGray }); }
  y -= 20;

  // ─── SECTION 2: SURFACE GRADE ─────────────────────────────────

  sectionHeader('Existing Surface Grade');

  page.drawText(`Grade: ${doc.surface_grade.selected}`, { x: margin, y, font: fontBold, size: 11, color: darkGray });
  const gradeLabel = ` — ${doc.surface_grade.label}`;
  const gradeX = margin + fontBold.widthOfTextAtSize(`Grade: ${doc.surface_grade.selected}`, 11);
  page.drawText(gradeLabel, { x: gradeX, y, font, size: 11, color: medGray });
  y -= 18;

  // Description paragraph
  const descLines = wrapText(doc.surface_grade.description, font, 9, contentWidth - 10);
  for (const line of descLines) {
    checkPage(14);
    page.drawText(line, { x: margin + 5, y, font, size: 9, color: medGray });
    y -= 12;
  }
  y -= 8;

  // Grade legend
  for (const g of doc.surface_grade.all_grades) {
    checkPage(14);
    const indicator = g.selected ? '  \u261B ' : '    ';
    const labelText = `${indicator}${g.grade}  ${g.label}`;
    page.drawText(labelText, {
      x: margin + 10, y,
      font: g.selected ? fontBold : font,
      size: 8.5,
      color: g.selected ? darkGray : lightGray,
    });
    y -= 13;
  }
  y -= 6;

  // ─── SECTION 3: WORK DESCRIPTION ──────────────────────────────

  sectionHeader('Work Description');

  for (const room of doc.work_description) {
    checkPage(30);
    page.drawText(room.area, { x: margin, y, font: fontBold, size: 10, color: darkGray });
    y -= 15;

    for (const bullet of room.bullets) {
      const bulletLines = wrapText(bullet, font, 8.5, contentWidth - 30);
      for (let li = 0; li < bulletLines.length; li++) {
        checkPage(12);
        if (li === 0) {
          page.drawText('\u25C9', { x: margin + 8, y: y + 1, font, size: 7, color: accentColor });
        }
        page.drawText(bulletLines[li], { x: margin + 22, y, font, size: 8.5, color: bulletColor });
        y -= 11;
      }
    }

    if (room.notes) {
      checkPage(14);
      y -= 2;
      page.drawText('Note:', { x: margin + 22, y, font: fontBold, size: 8, color: medGray });
      const noteX = margin + 22 + fontBold.widthOfTextAtSize('Note: ', 8);
      const noteLines = wrapText(room.notes, fontItalic, 8, contentWidth - 30 - fontBold.widthOfTextAtSize('Note: ', 8));
      page.drawText(noteLines[0] || '', { x: noteX, y, font: fontItalic, size: 8, color: medGray });
      y -= 11;
      for (let i = 1; i < noteLines.length; i++) {
        checkPage(12);
        page.drawText(noteLines[i], { x: margin + 22, y, font: fontItalic, size: 8, color: medGray });
        y -= 11;
      }
    }
    y -= 6;
  }

  // ─── SECTION 4: PREP LEVEL ────────────────────────────────────

  sectionHeader('Level of Surface Preparation');

  page.drawText(`Selected: ${doc.prep_level.label}`, { x: margin, y, font: fontBold, size: 11, color: darkGray });
  y -= 18;

  const prepLines = wrapText(doc.prep_level.description, font, 9, contentWidth - 10);
  for (const line of prepLines) {
    checkPage(14);
    page.drawText(line, { x: margin + 5, y, font, size: 9, color: medGray });
    y -= 12;
  }
  y -= 8;

  for (const level of doc.prep_level.all_levels) {
    checkPage(14);
    const indicator = level.selected ? '  \u261B ' : '    ';
    const adjText = level.adjustment === 'Included' ? '' : `  (${level.adjustment})`;
    page.drawText(`${indicator}${level.label}${adjText}`, {
      x: margin + 10, y,
      font: level.selected ? fontBold : font,
      size: 8.5,
      color: level.selected ? darkGray : lightGray,
    });
    y -= 13;
  }
  y -= 6;

  // ─── SECTION 5: PROJECT RECAP TABLE ───────────────────────────

  sectionHeader('Project Recap');

  // Table header
  const cols = [
    { label: 'Area', x: margin, w: 140 },
    { label: 'Price', x: margin + 145, w: 60 },
    { label: 'Walls', x: margin + 210, w: 50 },
    { label: 'Ceilings', x: margin + 260, w: 50 },
    { label: 'Doors', x: margin + 315, w: 40 },
    { label: 'Windows', x: margin + 358, w: 45 },
    { label: 'Trim', x: margin + 405, w: 40 },
    { label: 'Repairs', x: margin + 450, w: 45 },
  ];

  for (const col of cols) {
    page.drawText(col.label, { x: col.x, y, font: fontBold, size: 7.5, color: medGray });
  }
  y -= 6;
  drawLine(y);
  y -= 14;

  // Table rows
  for (const row of doc.recap_table.rows) {
    checkPage(16);
    page.drawText(row.area, { x: cols[0].x, y, font: fontBold, size: 8.5, color: darkGray });
    page.drawText(`$${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: cols[1].x, y, font, size: 8.5, color: darkGray });
    page.drawText(row.walls, { x: cols[2].x, y, font, size: 7.5, color: medGray });
    page.drawText(row.ceilings, { x: cols[3].x, y, font, size: 7.5, color: medGray });
    page.drawText(row.doors, { x: cols[4].x, y, font, size: 7.5, color: medGray });
    page.drawText(row.windows, { x: cols[5].x, y, font, size: 7.5, color: medGray });
    page.drawText(row.trim, { x: cols[6].x, y, font, size: 7.5, color: medGray });
    page.drawText(row.repairs, { x: cols[7].x, y, font, size: 7.5, color: medGray });
    y -= 15;
  }

  // Totals
  drawLine(y + 4);
  y -= 10;
  checkPage(50);

  const totalsX = cols[1].x;
  page.drawText('Materials', { x: cols[0].x, y, font, size: 9, color: medGray });
  page.drawText(`$${doc.recap_table.materials_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: totalsX, y, font, size: 9, color: darkGray });
  y -= 16;

  drawLine(y + 4);
  y -= 6;
  page.drawText('TOTAL', { x: cols[0].x, y, font: fontBold, size: 13, color: accentColor });
  page.drawText(`$${doc.recap_table.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: totalsX, y, font: fontBold, size: 13, color: accentColor });
  y -= 24;

  // Production estimate (ranges)
  if (doc.production.hours_low > 0) {
    page.drawText(
      `Estimated: ${doc.production.hours_low}-${doc.production.hours_high} hours, ${doc.production.crew_size}-person crew, ${doc.production.days_low}-${doc.production.days_high} days`,
      { x: margin, y, font, size: 8.5, color: medGray }
    );
    y -= 20;
  }

  // ─── SECTION 6: PAYMENT TERMS ─────────────────────────────────

  sectionHeader('Your Home Investment');

  const payCol1 = margin;
  const payCol2 = margin + 130;
  const payCol3 = pageWidth - margin - 120;
  const payCol4 = pageWidth - margin - 40;

  page.drawText('Deposit', { x: payCol1, y, font: fontBold, size: 10, color: darkGray });
  page.drawText('Due at signing of contract', { x: payCol2, y, font, size: 9, color: medGray });
  page.drawText(`$${doc.payment_terms.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: payCol3, y, font: fontBold, size: 10, color: darkGray });
  page.drawText(`${Math.round(doc.payment_terms.deposit_pct * 100)}%`, { x: payCol4, y, font, size: 9, color: medGray });
  y -= 18;

  if (doc.payment_terms.progress_pct && doc.payment_terms.progress_amount) {
    page.drawText('Progress', { x: payCol1, y, font: fontBold, size: 10, color: darkGray });
    page.drawText('Due at 50% completion', { x: payCol2, y, font, size: 9, color: medGray });
    page.drawText(`$${doc.payment_terms.progress_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: payCol3, y, font: fontBold, size: 10, color: darkGray });
    page.drawText(`${Math.round(doc.payment_terms.progress_pct * 100)}%`, { x: payCol4, y, font, size: 9, color: medGray });
    y -= 18;
  }

  page.drawText('Completion', { x: payCol1, y, font: fontBold, size: 10, color: darkGray });
  page.drawText('Due at 100% project completion', { x: payCol2, y, font, size: 9, color: medGray });
  page.drawText(`$${doc.payment_terms.completion_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: payCol3, y, font: fontBold, size: 10, color: darkGray });
  page.drawText(`${Math.round(doc.payment_terms.completion_pct * 100)}%`, { x: payCol4, y, font, size: 9, color: medGray });
  y -= 24;

  // Total investment line
  drawLine(y + 8);
  y -= 4;
  page.drawText('Total Investment:', { x: payCol1, y, font: fontBold, size: 11, color: darkGray });
  page.drawText(`$${doc.payment_terms.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { x: payCol3, y, font: fontBold, size: 11, color: accentColor });
  y -= 28;

  // ─── SECTION 7: SIGNATURE BLOCK ───────────────────────────────

  checkPage(80);
  drawLine(y + 8);
  y -= 16;

  page.drawText('Prepared by:', { x: margin, y, font, size: 9, color: medGray });
  y -= 14;
  page.drawText(doc.header.company_name, { x: margin, y, font: fontBold, size: 10, color: darkGray });
  y -= 14;
  page.drawText(doc.header.date, { x: margin, y, font, size: 9, color: medGray });
  y -= 24;

  page.drawText('Accepted by:', { x: margin, y, font, size: 9, color: medGray });
  y -= 4;
  drawLine(y, medGray);
  y -= 14;
  page.drawText('Signature', { x: margin, y, font, size: 7, color: lightGray });
  page.drawText('Date', { x: margin + 350, y, font, size: 7, color: lightGray });
  y -= 18;

  const bySignText = `By signing, you authorize ${doc.header.company_name} to proceed with the work described above at the stated investment.`;
  const bySignLines = wrapText(bySignText, fontItalic, 7.5, contentWidth);
  for (const line of bySignLines) {
    page.drawText(line, { x: margin, y, font: fontItalic, size: 7.5, color: lightGray });
    y -= 10;
  }

  // ─── SECTION 8: FOOTER ────────────────────────────────────────
  drawFooter();

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Legacy wrapper for backward compatibility with existing generate endpoint
export async function generateEstimatePDFLegacy(
  client: any,
  quote: any,
  submissionId: string,
  tenant: TenantConfig,
): Promise<Buffer> {
  // For non-interior/exterior trades or when template engine isn't wired up yet,
  // fall back to a simple format
  const { assembleInteriorEstimate } = await import('./estimate-templates.js');

  const scope = {
    client,
    rooms: [],
    project: { surface_grade: 'B' as const, prep_level: 'Standard' as const, color_samples: false, transportation: false, notes: '' },
  };

  const doc = assembleInteriorEstimate(scope, quote, {
    company_name: tenant.company_name,
    contact_phone: tenant.contact_phone,
    contact_email: tenant.contact_email,
    website_url: tenant.website_url,
  }, submissionId);

  // Override header with actual client data
  doc.header.client_name = client.name;
  doc.header.client_address = client.address;
  doc.header.client_email = client.email || '';
  doc.header.client_phone = client.phone || '';

  return generateEstimatePDF(doc, tenant);
}

function wrapText(str: string, fontObj: any, fontSize: number, maxWidth: number): string[] {
  const words = str.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const w = fontObj.widthOfTextAtSize(test, fontSize);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}
