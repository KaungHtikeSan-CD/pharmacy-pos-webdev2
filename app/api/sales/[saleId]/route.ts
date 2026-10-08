import { NextResponse } from "next/server";

import { isAmount, isRecord, isSoldItem, normalizeSoldItems } from "@/lib/sales";
import { type Sale } from "@/types/sale";

type RouteContext = {
  params: Promise<{ saleId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const saleId = (await context.params).saleId.trim();
  if (!saleId) {
    return NextResponse.json({ message: "Sale ID is required." }, { status: 400 });
  }

  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const sale = await db.collection<Sale>("sales").findOne({ saleId });
    if (!sale) {
      return NextResponse.json({ message: "Sale not found." }, { status: 404 });
    }
    return NextResponse.json({ sale });
  } catch {
    return NextResponse.json({ message: "Unable to load sale." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const saleId = (await context.params).saleId.trim();
  if (!saleId) {
    return NextResponse.json({ message: "Sale ID is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((field) => field !== "soldItems" && field !== "totalAmount") ||
    (body.soldItems !== undefined &&
      (!Array.isArray(body.soldItems) || body.soldItems.length === 0 || !body.soldItems.every(isSoldItem))) ||
    (body.totalAmount !== undefined && !isAmount(body.totalAmount))
  ) {
    return NextResponse.json(
      { message: "Provide soldItems and/or totalAmount. Items must follow the sale creation format, and totalAmount must be non-negative. Other fields cannot be changed." },
      { status: 400 },
    );
  }

  const update: Partial<Sale> = { updatedAt: new Date() };
  if (Array.isArray(body.soldItems)) update.soldItems = normalizeSoldItems(body.soldItems);
  if (isAmount(body.totalAmount)) update.totalAmount = body.totalAmount;

  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const existingSale = await db.collection<Sale>("sales").findOne({ saleId });

    if (!existingSale) {
      return NextResponse.json({ message: "Sale not found." }, { status: 404 });
    }

    const sale = await db.collection<Sale>("sales").findOneAndUpdate(
      { saleId },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!sale) {
      return NextResponse.json({ message: "Sale not found." }, { status: 404 });
    }

    if (update.soldItems) {
      await Promise.all([
        ...existingSale.soldItems.map((item) => {
          if (!item.productCode) return Promise.resolve();

          return db.collection("products").updateOne(
            { productCode: item.productCode },
            {
              $inc: { quantity: item.quantity },
              $set: { updatedAt: new Date() },
            },
          );
        }),
        ...update.soldItems.map((item) => {
          if (!item.productCode) return Promise.resolve();

          return db.collection("products").updateOne(
            { productCode: item.productCode },
            {
              $inc: { quantity: -item.quantity },
              $set: { updatedAt: new Date() },
            },
          );
        }),
      ]);
    }

    return NextResponse.json({ sale });
  } catch {
    return NextResponse.json({ message: "Unable to update sale." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_: Request, context: RouteContext) {
  const saleId = (await context.params).saleId.trim();
  if (!saleId) {
    return NextResponse.json({ message: "Sale ID is required." }, { status: 400 });
  }

  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const sale = await db.collection<Sale>("sales").findOne({ saleId });

    if (!sale) {
      return NextResponse.json({ message: "Sale not found." }, { status: 404 });
    }

    const result = await db.collection<Sale>("sales").deleteOne({ saleId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Sale not found." }, { status: 404 });
    }

    await Promise.all(
      sale.soldItems.map((item) => {
        if (!item.productCode) return Promise.resolve();

        return db.collection("products").updateOne(
          { productCode: item.productCode },
          {
            $inc: { quantity: item.quantity },
            $set: { updatedAt: new Date() },
          },
        );
      }),
    );

    return NextResponse.json({ message: "Sale deleted." });
  } catch {
    return NextResponse.json({ message: "Unable to delete sale." }, { status: 500 });
  }
}
