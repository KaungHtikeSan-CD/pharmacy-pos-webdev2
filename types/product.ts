export interface Product {
  productId: string;
  productCode: string;
  barcode?: string;
  medicineName: string;
  category: string;
  quantity: number;
  cardsPerBox: number;
  wholesalePrice: number;
  profitPercentage: number;
  salePrice: number;
  wholesaleShop: string;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export const plannedProductFields = [
  "productId",
  "productCode",
  "barcode",
  "medicineName",
  "category",
  "quantity",
  "cardsPerBox",
  "wholesalePrice",
  "profitPercentage",
  "salePrice",
  "wholesaleShop",
  "lowStockThreshold",
  "createdAt",
  "updatedAt",
] as const;
