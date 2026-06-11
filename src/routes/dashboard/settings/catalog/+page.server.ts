import { redirect } from '@sveltejs/kit';
import { getTenantById, defaultCatalog } from '$lib/server/tenant.js';
import { buildPriceBook } from '$lib/server/price-book.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  // Tenants who customized the retired catalog editor get a one-time note.
  // Their edits never changed a price (the engines never read catalog_json).
  const hadCustomCatalog =
    tenant.catalog !== defaultCatalog &&
    JSON.stringify(tenant.catalog) !== JSON.stringify(defaultCatalog);

  return {
    priceBook: buildPriceBook(tenant),
    hadCustomCatalog,
  };
};
