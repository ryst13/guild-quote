import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

// The Price Book now lives as the first tab of My Prices. Old links keep working.
export const load: PageServerLoad = async () => {
  throw redirect(308, '/dashboard/settings/pricing?tab=pricebook');
};
