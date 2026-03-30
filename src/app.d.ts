declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: 'contractor_admin' | 'contractor_staff' | 'homeowner';
        tenant_id: string | null;
      };
      tenant?: {
        id: string;
        slug: string;
        company_name: string;
        primary_color: string;
        accent_color: string;
        logo_url: string | null;
      };
    }
  }
}

export {};
