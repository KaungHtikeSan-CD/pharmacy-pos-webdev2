export type SaleUnit = "box" | "card";

export interface SoldItem {
  productCode: string;
  barcode?: string;
  medicineName: string;
  quantity: number;
  unit: SaleUnit;
  salePrice: number;
  // Planned monetary discount for this line, rather than a percentage.
  discount: number;
  totalAmount: number;
}

// Purchase History will display completed POS sales using this same record.
export interface Sale {
  saleId: string;
  soldItems: SoldItem[];
  // Planned sum of line totals after their discounts.
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const plannedSaleFields = [
  "saleId",
  "soldItems",
  "totalAmount",
  "createdAt",
  "updatedAt",
] as const;

export const plannedSoldItemFields = [
  "productCode",
  "barcode",
  "medicineName",
  "quantity",
  "unit",
  "salePrice",
  "discount",
  "totalAmount",
] as const;
