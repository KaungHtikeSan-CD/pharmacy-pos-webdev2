import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { type Product } from "@/types/product";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

const textFields = [
  "productCode",
  "medicineName",
  "category",
  "wholesaleShop",
] as const;
const numberFields = [
  "quantity",
  "cardsPerBox",
  "wholesalePrice",
  "profitPercentage",
  "lowStockThreshold",
] as const;
const editableFields = [...textFields, ...numberFields, "barcode", "salePrice"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function calculateSalePrice(wholesalePrice: number, profitPercentage: number) {
  return Math.round(wholesalePrice + (wholesalePrice * profitPercentage) / 100);
}

async function getProductId(context: RouteContext) {
  const { productId } = await context.params;
  return productId.trim();
}

export async function GET(_: Request, context: RouteContext) {
  const productId = await getProductId(context);

  if (!productId) {
    return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const product = await db.collection<Product>("products").findOne({ productId });

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { message: "Unable to retrieve product." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const productId = await getProductId(context);

  if (!productId) {
    return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
  }

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

  const suppliedFields = Object.keys(body);
  const invalidFields = suppliedFields.filter(
    (field) => !editableFields.includes(field as (typeof editableFields)[number]),
  );

  if (suppliedFields.length === 0 || invalidFields.length > 0) {
    return NextResponse.json(
      {
        message: "Provide one or more valid product fields to update.",
        ...(invalidFields.length > 0 ? { fields: invalidFields } : {}),
      },
      { status: 400 },
    );
  }

  const invalidValues = [
    ...textFields.filter((field) => body[field] !== undefined && !isText(body[field])),
    ...numberFields.filter(
      (field) => body[field] !== undefined && !isNonNegativeNumber(body[field]),
    ),
    ...(body.salePrice !== undefined && !isNonNegativeNumber(body.salePrice) ? ["salePrice"] : []),
    ...(body.barcode !== undefined && !isText(body.barcode) ? ["barcode"] : []),
  ];

  if (invalidValues.length > 0) {
    return NextResponse.json(
      { message: "Product contains invalid field values.", fields: invalidValues },
      { status: 400 },
    );
  }

  const update: Partial<Product> = { updatedAt: new Date() };

  for (const field of textFields) {
    if (typeof body[field] === "string") update[field] = body[field].trim();
  }
  for (const field of numberFields) {
    if (typeof body[field] === "number") update[field] = body[field];
  }
  if (typeof body.barcode === "string") update.barcode = body.barcode.trim();

  try {
    const db = await getDb();
    const existingProduct = await db.collection<Product>("products").findOne({ productId });

    if (!existingProduct) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    update.salePrice = calculateSalePrice(
      typeof update.wholesalePrice === "number" ? update.wholesalePrice : existingProduct.wholesalePrice,
      typeof update.profitPercentage === "number" ? update.profitPercentage : existingProduct.profitPercentage,
    );

    const result = await db
      .collection<Product>("products")
      .updateOne({ productId }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const product = await db.collection<Product>("products").findOne({ productId });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { message: "Unable to update product." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_: Request, context: RouteContext) {
  const productId = await getProductId(context);

  if (!productId) {
    return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection<Product>("products").deleteOne({ productId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted." });
  } catch {
    return NextResponse.json(
      { message: "Unable to delete product." },
      { status: 500 },
    );
  }
}
