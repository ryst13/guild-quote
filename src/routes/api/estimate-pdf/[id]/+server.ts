import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
  const pdfPath = resolve(`./data/pdfs/${params.id}.pdf`);

  if (!existsSync(pdfPath)) {
    throw error(404, 'PDF not found');
  }

  const pdfBuffer = readFileSync(pdfPath);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="estimate-${params.id.slice(0, 8)}.pdf"`,
    },
  });
};
