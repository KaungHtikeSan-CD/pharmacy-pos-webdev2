import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { type Product } from "@/types/product";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function calculateSalePrice(wholesalePrice: number, profitPercentage: number) {
  return Math.round(wholesalePrice + (wholesalePrice * profitPercentage) / 100);
}

function getMissingFields(body: Record<string, unknown>) {
  const missingFields: string[] = [];

  const requiredTextFields = [
    "productId",
    "productCode",
    "medicineName",
    "category",
    "wholesaleShop",
  ] as const;

  missingFields.push(
    ...requiredTextFields.filter((field) => !isText(body[field])),
  );

  const positiveNumberFields = [
    "quantity",
    "cardsPerBox",
    "wholesalePrice",
  ] as const;

  missingFields.push(
    ...positiveNumberFields.filter((field) => !isPositiveNumber(body[field])),
  );

  const nonNegativeNumberFields = [
    "profitPercentage",
    "lowStockThreshold",
  ] as const;

  missingFields.push(
    ...nonNegativeNumberFields.filter(
      (field) => !isNonNegativeNumber(body[field]),
    ),
  );

  return missingFields;
}

export async function GET() {
  try {
    const db = await getDb();
    const products = await db
      .collection<Product>("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { message: "Unable to retrieve products." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { message: "Request body must be an object." },
      { status: 400 },
    );
  }

  const missingFields = getMissingFields(body);

  if (body.barcode !== undefined && !isText(body.barcode)) {
    missingFields.push("barcode");
  }

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        message: "Missing or invalid required fields.",
        fields: missingFields,
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const product: Product = {
    productId: (body.productId as string).trim(),
    productCode: (body.productCode as string).trim(),
    medicineName: (body.medicineName as string).trim(),
    category: (body.category as string).trim(),
    quantity: body.quantity as number,
    cardsPerBox: body.cardsPerBox as number,
    wholesalePrice: body.wholesalePrice as number,
    profitPercentage: body.profitPercentage as number,
    salePrice: calculateSalePrice(
      body.wholesalePrice as number,
      body.profitPercentage as number,
    ),
    wholesaleShop: (body.wholesaleShop as string).trim(),
    lowStockThreshold: body.lowStockThreshold as number,
    createdAt: now,
    updatedAt: now,
  };

  if (typeof body.barcode === "string" && body.barcode.trim() !== "") {
    product.barcode = body.barcode.trim();
  }

  try {
    const db = await getDb();
    const duplicate = await db.collection<Product>("products").findOne({
      $or: [
        { productId: product.productId },
        { productCode: product.productCode },
        ...(product.barcode ? [{ barcode: product.barcode }] : []),
      ],
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Product ID, product code, or barcode already exists." },
        { status: 409 },
      );
    }

    const result = await db.collection<Product>("products").insertOne(product);

    return NextResponse.json(
      { product: { ...product, _id: result.insertedId } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to create product." },
      { status: 500 },
    );
  }
}
