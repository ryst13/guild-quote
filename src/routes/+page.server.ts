import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  // Logged-in users go straight to dashboard
  if (locals.user && locals.user.tenant_id) {
    throw redirect(303, '/dashboard');
  }
};
