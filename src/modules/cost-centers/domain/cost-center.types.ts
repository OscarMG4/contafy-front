export interface CostCenter {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface CostCenterInput {
  code: string;
  name: string;
}

export interface CostCenterUpdateInput {
  name: string;
  active: boolean;
}

export interface CostCenterFilters {
  search?: string;
  only_active?: boolean;
  page: number;
  perPage: number;
}
