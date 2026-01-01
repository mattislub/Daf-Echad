export interface CustomerAccount {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  fax?: string | null;
  language?: 'he' | 'en' | null;
  customerType?: string | null;
}
