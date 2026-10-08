import { NextResponse } from "next/server";

import { type Sale } from "@/types/sale";
import { type Product } from "@/types/product";
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
    const requestedQuantities = new Map<string, number>();

    for (const item of sale.soldItems) {
      if (!item.productCode) continue;
      requestedQuantities.set(
        item.productCode,
        (requestedQuantities.get(item.productCode) ?? 0) + item.quantity,
      );
    }

    const products = await db
      .collection<Product>("products")
      .find({ productCode: { $in: [...requestedQuantities.keys()] } })
      .toArray();
    const productsByCode = new Map(products.map((product) => [product.productCode, product]));
    const insufficientItem = [...requestedQuantities.entries()].find(([productCode, quantity]) => {
      const product = productsByCode.get(productCode);
      return !product || product.quantity < quantity;
    });

    if (insufficientItem) {
      const [productCode, quantity] = insufficientItem;
      const product = productsByCode.get(productCode);

      return NextResponse.json(
        {
          message: `${product?.medicineName ?? productCode} has only ${Math.max(0, product?.quantity ?? 0)} item(s) in stock. Requested ${quantity}.`,
        },
        { status: 409 },
      );
    }

    const decrementedItems: { productCode: string; quantity: number }[] = [];

    for (const [productCode, quantity] of requestedQuantities.entries()) {
      const decrementResult = await db.collection<Product>("products").updateOne(
        { productCode, quantity: { $gte: quantity } },
        {
          $inc: { quantity: -quantity },
          $set: { updatedAt: now },
        },
      );

      if (decrementResult.matchedCount === 0) {
        await Promise.all(
          decrementedItems.map((item) =>
            db.collection<Product>("products").updateOne(
              { productCode: item.productCode },
              {
                $inc: { quantity: item.quantity },
                $set: { updatedAt: now },
              },
            ),
          ),
        );

        const product = productsByCode.get(productCode);
        return NextResponse.json(
          {
            message: `${product?.medicineName ?? productCode} has only ${Math.max(0, product?.quantity ?? 0)} item(s) in stock. Requested ${quantity}.`,
          },
          { status: 409 },
        );
      }

      decrementedItems.push({ productCode, quantity });
    }

    try {
      const result = await db.collection<Sale>("sales").insertOne(sale);
      return NextResponse.json({ sale: { ...sale, _id: result.insertedId } }, { status: 201 });
    } catch (error) {
      await Promise.all(
        decrementedItems.map((item) =>
          db.collection<Product>("products").updateOne(
            { productCode: item.productCode },
            {
              $inc: { quantity: item.quantity },
              $set: { updatedAt: now },
            },
          ),
        ),
      );

      throw error;
    }
  } catch {
    return NextResponse.json({ message: "Unable to create sale." }, { status: 500 });
  }
}
