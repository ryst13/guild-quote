import type { drive_v3 } from 'googleapis';
import { db } from './db.js';
import { tenants, submissions } from './schema.js';
import { eq } from 'drizzle-orm';
import type { TenantConfig } from '$lib/types/index.js';

/**
 * Google Drive folder management for GuildQuote.
 *
 * Target structure:
 *   GQ/
 *     Deals/
 *       Active/
 *         {Address - Client}/
 *           [estimate files]
 *           archive/
 *           images/
 *       Inactive/
 */

async function findOrCreateFolder(drive: drive_v3.Drive, name: string, parentId?: string): Promise<string> {
  // Search for existing folder
  let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const existing = await drive.files.list({ q: query, fields: 'files(id)', spaces: 'drive' });
  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  // Create folder
  const requestBody: any = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) requestBody.parents = [parentId];

  const created = await drive.files.create({ requestBody, fields: 'id' });
  return created.data.id!;
}

/**
 * Ensures the top-level folder structure exists: GQ > Deals > Active + Inactive.
 * Stores folder IDs on the tenant record and returns them.
 */
export async function ensureFolderStructure(
  drive: drive_v3.Drive,
  tenant: TenantConfig,
): Promise<{ rootId: string; activeId: string; inactiveId: string }> {
  let rootId = tenant.google_drive_root_folder_id;
  let activeId = tenant.google_drive_active_folder_id;
  let inactiveId = tenant.google_drive_inactive_folder_id;

  if (rootId && activeId && inactiveId) {
    return { rootId, activeId, inactiveId };
  }

  // Build the hierarchy
  if (!rootId) {
    rootId = await findOrCreateFolder(drive, 'GQ');
  }
  const dealsId = await findOrCreateFolder(drive, 'Deals', rootId);
  if (!activeId) {
    activeId = await findOrCreateFolder(drive, 'Active', dealsId);
  }
  if (!inactiveId) {
    inactiveId = await findOrCreateFolder(drive, 'Inactive', dealsId);
  }

  // Persist to DB
  db.update(tenants).set({
    google_drive_root_folder_id: rootId,
    google_drive_active_folder_id: activeId,
    google_drive_inactive_folder_id: inactiveId,
    updated_at: new Date().toISOString(),
  }).where(eq(tenants.id, tenant.id)).run();

  // Update in-memory tenant
  tenant.google_drive_root_folder_id = rootId;
  tenant.google_drive_active_folder_id = activeId;
  tenant.google_drive_inactive_folder_id = inactiveId;

  return { rootId, activeId, inactiveId };
}

/**
 * Finds or creates a project folder under Active, named by address.
 * Also ensures archive/ and images/ subfolders exist.
 */
export async function ensureProjectFolder(
  drive: drive_v3.Drive,
  activeId: string,
  address: string,
  submissionId: string,
): Promise<string> {
  const folderName = address.trim() || 'Unnamed Project';
  const projectId = await findOrCreateFolder(drive, folderName, activeId);

  // Ensure subfolders
  await findOrCreateFolder(drive, 'archive', projectId);
  await findOrCreateFolder(drive, 'images', projectId);

  // Save project folder ID on submission
  db.update(submissions).set({
    google_drive_project_folder_id: projectId,
    updated_at: new Date().toISOString(),
  }).where(eq(submissions.id, submissionId)).run();

  return projectId;
}

/**
 * Moves an existing Google Drive file to the archive subfolder of its project folder.
 */
export async function moveFileToArchive(
  drive: drive_v3.Drive,
  fileId: string,
  projectFolderId: string,
): Promise<void> {
  const archiveId = await findOrCreateFolder(drive, 'archive', projectFolderId);

  // Get current parents
  const file = await drive.files.get({ fileId, fields: 'parents' });
  const currentParents = (file.data.parents || []).join(',');

  await drive.files.update({
    fileId,
    addParents: archiveId,
    removeParents: currentParents,
    fields: 'id, parents',
  });
}

/**
 * Moves an entire project folder from Active to Inactive.
 */
export async function moveProjectToInactive(
  drive: drive_v3.Drive,
  projectFolderId: string,
  activeId: string,
  inactiveId: string,
): Promise<void> {
  await drive.files.update({
    fileId: projectFolderId,
    addParents: inactiveId,
    removeParents: activeId,
    fields: 'id, parents',
  });
}

/**
 * Extracts the Google Drive file ID from a Google Docs/Sheets URL.
 */
export function extractFileId(url: string): string | null {
  // Docs: https://docs.google.com/document/d/{id}/edit
  // Sheets: https://docs.google.com/spreadsheets/d/{id}/edit
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
