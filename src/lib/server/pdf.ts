import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { QuoteResult, ClientInfo, TenantConfig } from '$lib/types/index.js';

export async function generateEstimatePDF(
  client: ClientInfo,
  quote: QuoteResult,
  submissionId: string,
  tenant: TenantConfig
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

  function drawText(text: string, x: number, yPos: number, options: { font?: typeof font; size?: number; color?: typeof darkGray } = {}) {
    page.drawText(text, { x, y: yPos, font: options.font || font, size: options.size || 10, color: options.color || darkGray });
  }

  function drawLine(yPos: number) {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 0.5, color: lineColor });
  }

  function checkPage(needed: number) {
    if (y - needed < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  const tradeLabel = quote.trade_type === 'interior' ? 'Interior Painting' :
    quote.trade_type === 'exterior' ? 'Exterior Painting' : 'Epoxy & Garage Coatings';

  // Header
  drawText(tenant.company_name, margin, y, { font: fontBold, size: 18, color: accentColor });
  y -= 18;
  drawText(`${tradeLabel} Estimate`, margin, y, { size: 12, color: medGray });
  y -= 24;
  drawLine(y);
  y -= 20;

  // Client info
  drawText('Prepared for:', margin, y, { font: fontBold, size: 10, color: medGray });
  y -= 16;
  drawText(client.name, margin, y, { size: 11 });
  y -= 14;
  drawText(client.email, margin, y, { size: 10, color: medGray });
  if (client.phone) { y -= 14; drawText(client.phone, margin, y, { size: 10, color: medGray }); }

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  drawText(`Date: ${dateStr}`, pageWidth - margin - 200, pageHeight - margin - 42, { size: 9, color: medGray });
  drawText(`Ref: ${submissionId.slice(0, 8).toUpperCase()}`, pageWidth - margin - 200, pageHeight - margin - 54, { size: 9, color: medGray });
  drawText('Valid for 30 days', pageWidth - margin - 200, pageHeight - margin - 66, { size: 9, color: medGray });

  y -= 10;
  drawText('Property:', margin, y, { font: fontBold, size: 10, color: medGray });
  y -= 14;
  drawText(client.address, margin, y, { size: 10 });
  y -= 24;
  drawLine(y);
  y -= 20;

  // Section breakdown
  drawText('Item', margin, y, { font: fontBold, size: 9, color: medGray });
  drawText('Qty', pageWidth - margin - 160, y, { font: fontBold, size: 9, color: medGray });
  drawText('Amount', pageWidth - margin - 60, y, { font: fontBold, size: 9, color: medGray });
  y -= 8;
  drawLine(y);
  y -= 16;

  for (const section of quote.sections) {
    checkPage(40);
    drawText(section.label, margin, y, { font: fontBold, size: 10 });
    drawText(`$${Math.round(section.sales_price).toLocaleString()}`, pageWidth - margin - 60, y, { size: 10 });
    y -= 14;
    for (const item of section.items) {
      checkPage(16);
      drawText(`  ${item.label}`, margin + 10, y, { size: 8, color: medGray });
      drawText(`${item.quantity}`, pageWidth - margin - 160, y, { size: 8, color: medGray });
      drawText(`$${Math.round(item.sales_price).toLocaleString()}`, pageWidth - margin - 60, y, { size: 8, color: medGray });
      y -= 12;
    }
    y -= 4;
  }

  // Surcharges
  if (quote.surcharges.length > 0) {
    checkPage(40);
    drawLine(y);
    y -= 16;
    drawText('Surcharges', margin, y, { font: fontBold, size: 10 });
    y -= 14;
    for (const s of quote.surcharges) {
      drawText(`  ${s.label}`, margin + 10, y, { size: 9, color: medGray });
      drawText(`$${Math.round(s.sales_amount).toLocaleString()}`, pageWidth - margin - 60, y, { size: 9 });
      y -= 14;
    }
  }

  // Labor total
  checkPage(30);
  drawLine(y);
  y -= 16;
  drawText('Labor Total', margin, y, { font: fontBold, size: 11 });
  drawText(`$${Math.round(quote.labor_total).toLocaleString()}`, pageWidth - margin - 60, y, { font: fontBold, size: 11 });
  y -= 20;

  // Materials
  if (quote.materials.length > 0) {
    checkPage(40);
    drawText('Materials', margin, y, { font: fontBold, size: 10 });
    y -= 14;
    for (const mat of quote.materials) {
      drawText(`  ${mat.label} (${mat.gallons} gal)`, margin + 10, y, { size: 9, color: medGray });
      drawText(`$${Math.round(mat.cost).toLocaleString()}`, pageWidth - margin - 60, y, { size: 9 });
      y -= 14;
    }
    drawText('Materials Total', margin, y, { font: fontBold, size: 10 });
    drawText(`$${Math.round(quote.materials_total).toLocaleString()}`, pageWidth - margin - 60, y, { font: fontBold, size: 10 });
    y -= 20;
  }

  // Grand Total
  checkPage(40);
  drawLine(y);
  y -= 20;
  drawText('GRAND TOTAL', margin, y, { font: fontBold, size: 14, color: accentColor });
  drawText(`$${Math.round(quote.grand_total).toLocaleString()}`, pageWidth - margin - 80, y, { font: fontBold, size: 14, color: accentColor });
  y -= 16;

  // Production estimate
  if (quote.production.painting_hours > 0) {
    y -= 10;
    drawText(`Estimated: ${quote.production.painting_hours.toFixed(1)} hrs, ${quote.production.crew_size}-person crew, ~${quote.production.duration_days.toFixed(1)} days`, margin, y, { size: 9, color: medGray });
  }

  y -= 30;
  drawLine(y);
  y -= 16;

  // Footer
  const footerParts = [tenant.company_name, tenant.contact_phone, tenant.contact_email].filter(Boolean);
  drawText(footerParts.join(' | '), margin, y, { size: 8, color: lightGray });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
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
