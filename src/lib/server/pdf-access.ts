// Access rules for /api/estimate-pdf/[id]. Pure logic, unit-tested.
//
// Valid filenames: {uuid}, {uuid}.pdf, or {uuid}-snapshot-{lang}.pdf. Anything
// else is rejected before touching the filesystem — on Windows a backslash
// inside the path segment would otherwise traverse out of data/pdfs.
const FILENAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-snapshot-[a-z-]{2,10})?(\.pdf)?$/i;

export function parsePdfFilename(
  raw: string,
): { submissionId: string; filename: string } | null {
  if (!FILENAME_RE.test(raw)) return null;
  return {
    submissionId: raw.replace(/\.pdf$/i, '').split('-snapshot-')[0],
    filename: raw.endsWith('.pdf') ? raw : `${raw}.pdf`,
  };
}

export function canAccessPdf(
  user: { tenant_id: string | null; is_platform_admin?: boolean } | null | undefined,
  submissionTenantId: string,
): boolean {
  if (!user || !user.tenant_id) return false;
  return user.tenant_id === submissionTenantId || user.is_platform_admin === true;
}
