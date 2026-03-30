import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { QuoteResult, IntakeFormData, TenantConfig } from '$lib/types/index.js';

export async function generateEstimatePDF(
  formData: IntakeFormData,
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

  // Parse tenant primary color for PDF accent
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

  // Header
  drawText(tenant.company_name, margin, y, { font: fontBold, size: 18, color: accentColor });
  y -= 18;
  drawText('Interior Painting Estimate', margin, y, { size: 12, color: medGray });
  y -= 24;
  drawLine(y);
  y -= 20;

  // Client info
  drawText('Prepared for:', margin, y, { font: fontBold, size: 10, color: medGray });
  y -= 16;
  drawText(`${formData.first_name} ${formData.last_name}`, margin, y, { size: 11 });
  y -= 14;
  drawText(formData.email, margin, y, { size: 10, color: medGray });
  if (formData.phone) { y -= 14; drawText(formData.phone, margin, y, { size: 10, color: medGray }); }

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  drawText(`Date: ${dateStr}`, pageWidth - margin - 200, pageHeight - margin - 42, { size: 9, color: medGray });
  drawText(`Ref: ${submissionId.slice(0, 8).toUpperCase()}`, pageWidth - margin - 200, pageHeight - margin - 54, { size: 9, color: medGray });
  drawText('Valid for 30 days', pageWidth - margin - 200, pageHeight - margin - 66, { size: 9, color: medGray });

  y -= 10;
  drawText('Property:', margin, y, { font: fontBold, size: 10, color: medGray });
  y -= 14;
  drawText(formData.address, margin, y, { size: 10 });
  y -= 24;
  drawLine(y);
  y -= 20;

  // Room breakdown header
  drawText('Room', margin, y, { font: fontBold, size: 9, color: medGray });
  drawText('Amount', pageWidth - margin - 60, y, { font: fontBold, size: 9, color: medGray });
  y -= 8;
  drawLine(y);
  y -= 16;

  for (const room of quote.rooms) {
    checkPage(60);
    drawText(room.room_label, margin, y, { font: fontBold, size: 10 });
    drawText(`$${room.subtotal.toLocaleString()}`, pageWidth - margin - 60, y, { size: 10 });
    y -= 14;
    for (const mod of room.modifiers) {
      drawText(`  ${mod.label}: +$${mod.amount.toLocaleString()}`, margin + 10, y, { size: 8, color: medGray });
      y -= 12;
    }
    y -= 4;
  }

  if (quote.project_adders.length > 0) {
    checkPage(40);
    drawLine(y);
    y -= 16;
    for (const adder of quote.project_adders) {
      drawText(adder.label, margin, y, { size: 10 });
      drawText(`$${adder.amount.toLocaleString()}`, pageWidth - margin - 60, y, { size: 10 });
      y -= 16;
    }
  }

  // Total
  checkPage(40);
  drawLine(y);
  y -= 20;
  drawText('TOTAL', margin, y, { font: fontBold, size: 14, color: accentColor });
  drawText(`$${quote.total.toLocaleString()}`, pageWidth - margin - 80, y, { font: fontBold, size: 14, color: accentColor });
  y -= 30;
  drawLine(y);
  y -= 24;

  // Assumptions
  checkPage(80);
  drawText('Assumptions', margin, y, { font: fontBold, size: 11, color: darkGray });
  y -= 16;
  for (const assumption of quote.assumptions) {
    checkPage(30);
    const lines = wrapText(assumption, font, 9, contentWidth - 15);
    for (const line of lines) {
      drawText(`• ${line}`, margin + 5, y, { size: 9, color: medGray });
      y -= 13;
    }
    y -= 2;
  }
  y -= 10;

  // Exclusions
  checkPage(60);
  drawText("What's not included", margin, y, { font: fontBold, size: 11, color: darkGray });
  y -= 16;
  for (const exclusion of quote.exclusions) {
    checkPage(16);
    drawText(`• ${exclusion}`, margin + 5, y, { size: 9, color: medGray });
    y -= 13;
  }
  y -= 20;

  // Footer
  checkPage(40);
  drawLine(y);
  y -= 16;
  drawText('Final pricing is confirmed after a brief pre-project walkthrough or virtual review.', margin, y, { size: 9, font: fontBold, color: medGray });
  y -= 14;
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
