export type MetadataResponse = {
  departmentGroups: Array<{
    id: string;
    name: string;
    order: number;
    departments: Array<{ id: string; name: string; order: number; groupId: string }>;
  }>;
};

export type DepartmentDetailResponse = {
  year: number;
  breakdown: Record<string, Record<string, number[]>>;
};

export type ActualResponse = {
  year: number;
  series: Record<string, number[]>;
};

export type BudgetScope = "company" | "unallocated" | "group" | "department";

export type BudgetDetailResponse = {
  year: number;
  scope: BudgetScope;
  level: "detail";
  breakdown: Record<string, Record<string, number[]>>;
};

export type ActualDetailResponse = {
  year: number;
  scope: BudgetScope;
  breakdown: Record<string, Record<string, number[]>>;
};

export type BalanceAccountKey =
  | "cash"
  | "dep"
  | "sec"
  | "rec"
  | "oth"
  | "res"
  | "ppe"
  | "dta"
  | "cap"
  | "ap"
  | "acc"
  | "def"
  | "share"
  | "ret";
