export type OrderStatus = "Ordered" | "Arrived";

export interface Order {
  orderId: string;
  productCode: string;
  barcode?: string;
  medicineName: string;
  category: string;
  quantity: number;
  cardsPerBox: number;
  wholesalePrice: number;
  wholesaleShop: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const plannedOrderFields = [
  "orderId",
  "productCode",
  "barcode",
  "medicineName",
  "category",
  "quantity",
  "cardsPerBox",
  "wholesalePrice",
  "wholesaleShop",
  "status",
  "createdAt",
  "updatedAt",
] as const;
