export interface Category {
  id: string;
  company_id: string;
  code: string;
  name: string;
  account_code: string;
  active: boolean;
}

export interface CategoryInput {
  name: string;
  accountCode: string;
  active: boolean;
}
