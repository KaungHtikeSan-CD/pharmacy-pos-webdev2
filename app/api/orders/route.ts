import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { type Order, type OrderStatus } from "@/types/order";

export async function GET() {
  try {
    const db = await getDb();
    const orders = await db
      .collection<Order>("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { message: "Unable to retrieve orders." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const requiredStringFields = [
    "orderId",
    "productCode",
    "medicineName",
    "category",
    "wholesaleShop",
    "status",
  ] as const;
  const missingFields: string[] = requiredStringFields.filter(
    (field) => typeof body[field] !== "string" || body[field].trim() === "",
  );

  const requiredNumberFields = [
    "quantity",
    "cardsPerBox",
    "wholesalePrice",
  ] as const;
  missingFields.push(
    ...requiredNumberFields.filter(
      (field) =>
        typeof body[field] !== "number" || !Number.isFinite(body[field]),
    ),
  );

  const createdAt = new Date(String(body.createdAt));
  const updatedAt = new Date(String(body.updatedAt));
  if (Number.isNaN(createdAt.getTime())) missingFields.push("createdAt");
  if (Number.isNaN(updatedAt.getTime())) missingFields.push("updatedAt");

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        message: "Missing or invalid required fields.",
        fields: missingFields,
      },
      { status: 400 },
    );
  }

  if (body.status !== "Ordered" && body.status !== "Arrived") {
    return NextResponse.json(
      { message: "Status must be Ordered or Arrived." },
      { status: 400 },
    );
  }

  const order: Order = {
    orderId: (body.orderId as string).trim(),
    productCode: (body.productCode as string).trim(),
    medicineName: (body.medicineName as string).trim(),
    category: (body.category as string).trim(),
    quantity: body.quantity as number,
    cardsPerBox: body.cardsPerBox as number,
    wholesalePrice: body.wholesalePrice as number,
    wholesaleShop: (body.wholesaleShop as string).trim(),
    status: body.status as OrderStatus,
    createdAt,
    updatedAt,
  };

  if (typeof body.barcode === "string" && body.barcode.trim() !== "") {
    order.barcode = body.barcode.trim();
  }

  try {
    const db = await getDb();
    const result = await db.collection<Order>("orders").insertOne(order);

    return NextResponse.json({ ...order, _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to create order." },
      { status: 500 },
    );
  }
}
