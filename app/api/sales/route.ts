import { NextResponse } from "next/server";

import { type Sale } from "@/types/sale";
import { isRecord, isText, isAmount, isSoldItem, normalizeSoldItems } from "@/lib/sales";

export async function GET() {
  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const sales = await db.collection<Sale>("sales").find({}).sort({ createdAt: -1, _id: -1 }).toArray();

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
    soldItems: normalizeSoldItems(body.soldItems),
    totalAmount: body.totalAmount,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const result = await db.collection<Sale>("sales").insertOne(sale);
    await Promise.all(
      sale.soldItems.map((item) => {
        if (!item.productCode) return Promise.resolve();

        return db.collection("products").updateOne(
          { productCode: item.productCode },
          {
            $inc: { quantity: -item.quantity },
            $set: { updatedAt: now },
          },
        );
      }),
    );

    return NextResponse.json({ sale: { ...sale, _id: result.insertedId } }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to create sale." }, { status: 500 });
  }
}
