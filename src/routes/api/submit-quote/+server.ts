import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateQuote } from '$lib/server/pricing.js';
import { generateEstimatePDF } from '$lib/server/pdf.js';
import { sendEmail, buildQuoteEmail } from '$lib/server/email.js';
import { getTenantBySlug } from '$lib/server/tenant.js';
import { findOrCreateUser } from '$lib/server/auth.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { RequestHandler } from './$types.js';
import type { IntakeFormData } from '$lib/types/index.js';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { slug, formData } = body as { slug: string; formData: IntakeFormData };

  if (!slug || !formData) {
    return json({ error: 'Missing slug or form data.' }, { status: 400 });
  }

  const tenant = getTenantBySlug(slug);
  if (!tenant) {
    return json({ error: 'Contractor not found.' }, { status: 404 });
  }

  // Validate basic fields
  if (!formData.first_name || !formData.last_name || !formData.email || !formData.address) {
    return json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  if (!formData.rooms || formData.rooms.length === 0) {
    return json({ error: 'Please add at least one room.' }, { status: 400 });
  }

  // Calculate quote
  const quote = calculateQuote(formData, tenant.catalog);

  // Generate PDF
  const submissionId = uuidv4();
  const pdfBuffer = await generateEstimatePDF(formData, quote, submissionId, tenant);

  // Save PDF
  const pdfsDir = resolve('./data/pdfs');
  mkdirSync(pdfsDir, { recursive: true });
  writeFileSync(resolve(pdfsDir, `${submissionId}.pdf`), pdfBuffer);

  // Create/find user for homeowner
  const user = findOrCreateUser(formData.email, formData.first_name, formData.last_name, 'homeowner', tenant.id);

  // Save submission
  db.insert(submissions).values({
    id: submissionId,
    tenant_id: tenant.id,
    user_id: user.id,
    email: formData.email.toLowerCase(),
    first_name: formData.first_name,
    last_name: formData.last_name,
    phone: formData.phone || null,
    address: formData.address,
    form_data: JSON.stringify(formData),
    rooms_json: JSON.stringify(formData.rooms),
    quote_json: JSON.stringify(quote),
    sales_price: quote.total,
    stage_key: 'quote_sent',
    estimate_pdf_url: `/api/estimate-pdf/${submissionId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).run();

  // Send email
  const html = buildQuoteEmail(formData.first_name, quote.total, submissionId, tenant);
  await sendEmail({
    to: formData.email,
    subject: `Your Interior Painting Quote from ${tenant.company_name}`,
    html,
    from: `"${tenant.company_name}" <${process.env.SMTP_USER || 'noreply@smartquotepro.com'}>`,
    attachments: [{ filename: `estimate-${submissionId.slice(0, 8)}.pdf`, content: pdfBuffer }],
  });

  return json({
    submission_id: submissionId,
    quote,
    estimate_pdf_url: `/api/estimate-pdf/${submissionId}`,
  });
};
