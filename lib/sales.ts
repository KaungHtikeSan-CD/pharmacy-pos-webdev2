import { type SoldItem } from "@/types/sale";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isSoldItem(value: unknown): value is SoldItem {
  return (
    isRecord(value) &&
    (isText(value.productCode) || isText(value.barcode)) &&
    (value.productCode === undefined || isText(value.productCode)) &&
    (value.barcode === undefined || isText(value.barcode)) &&
    isText(value.medicineName) &&
    typeof value.quantity === "number" &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity > 0 &&
    (value.unit === "box" || value.unit === "card") &&
    isAmount(value.salePrice) &&
    isAmount(value.discount) &&
    isAmount(value.totalAmount)
  );
}

export function normalizeSoldItems(items: SoldItem[]): SoldItem[] {
  return items.map((item) => ({
    ...(item.productCode !== undefined ? { productCode: item.productCode.trim() } : {}),
    ...(item.barcode !== undefined ? { barcode: item.barcode.trim() } : {}),
    medicineName: item.medicineName.trim(),
    quantity: item.quantity,
    unit: item.unit,
    salePrice: item.salePrice,
    discount: item.discount,
    totalAmount: item.totalAmount,
  }));
}
