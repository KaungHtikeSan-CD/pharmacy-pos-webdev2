import { NextResponse } from "next/server";

import { type Sale, type SoldItem } from "@/types/sale";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isSoldItem(value: unknown): value is SoldItem {
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

export async function GET() {
  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const sales = await db.collection<Sale>("sales").find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ sales });
  } catch {
    return NextResponse.json({ message: "Unable to load sales." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !isText(body.saleId) ||
    !Array.isArray(body.soldItems) ||
    body.soldItems.length === 0 ||
    !body.soldItems.every(isSoldItem) ||
    !isAmount(body.totalAmount)
  ) {
    return NextResponse.json(
      {
        message:
          "Provide saleId, totalAmount, and non-empty soldItems. Each item requires productCode or barcode, medicineName, a positive integer quantity, unit (box/card), and non-negative salePrice, discount, and totalAmount.",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const sale: Sale = {
    saleId: body.saleId.trim(),
    soldItems: body.soldItems.map((item: SoldItem) => ({
      ...(item.productCode !== undefined ? { productCode: item.productCode.trim() } : {}),
      ...(item.barcode !== undefined ? { barcode: item.barcode.trim() } : {}),
      medicineName: item.medicineName.trim(),
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice,
      discount: item.discount,
      totalAmount: item.totalAmount,
    })),
    totalAmount: body.totalAmount,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const result = await db.collection<Sale>("sales").insertOne(sale);

    return NextResponse.json({ sale: { ...sale, _id: result.insertedId } }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to create sale." }, { status: 500 });
  }
}
