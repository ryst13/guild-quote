import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
  // Support both {id} (adds .pdf) and {id}.pdf (already has extension, e.g. snapshots)
  const filename = params.id.endsWith('.pdf') ? params.id : `${params.id}.pdf`;
  const pdfPath = resolve(`./data/pdfs/${filename}`);

  if (!existsSync(pdfPath)) {
    throw error(404, 'PDF not found');
  }

  const pdfBuffer = readFileSync(pdfPath);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="estimate-${params.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
