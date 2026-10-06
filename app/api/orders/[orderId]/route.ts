import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { type Order, type OrderStatus } from "@/types/order";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

const editableTextFields = [
  "productCode",
  "medicineName",
  "category",
  "wholesaleShop",
] as const;
const editableNumberFields = [
  "quantity",
  "cardsPerBox",
  "wholesalePrice",
] as const;
const editableFields = [
  ...editableTextFields,
  ...editableNumberFields,
  "barcode",
  "status",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return value === "Ordered" || value === "Arrived";
}

async function getOrderId(context: RouteContext) {
  const { orderId } = await context.params;
  return orderId.trim();
}

export async function GET(_: Request, context: RouteContext) {
  const orderId = await getOrderId(context);

  if (!orderId) {
    return NextResponse.json({ message: "Order ID is required." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const order = await db.collection<Order>("orders").findOne({ orderId });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { message: "Unable to retrieve order." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const orderId = await getOrderId(context);

  if (!orderId) {
    return NextResponse.json({ message: "Order ID is required." }, { status: 400 });
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
        message: "Provide one or more valid order fields to update.",
        ...(invalidFields.length > 0 ? { fields: invalidFields } : {}),
      },
      { status: 400 },
    );
  }

  const invalidValues = [
    ...editableTextFields.filter(
      (field) => body[field] !== undefined && !isText(body[field]),
    ),
    ...editableNumberFields.filter(
      (field) => body[field] !== undefined && !isPositiveNumber(body[field]),
    ),
    ...(body.barcode !== undefined && !isText(body.barcode) ? ["barcode"] : []),
    ...(body.status !== undefined && !isOrderStatus(body.status) ? ["status"] : []),
  ];

  if (invalidValues.length > 0) {
    return NextResponse.json(
      { message: "Order contains invalid field values.", fields: invalidValues },
      { status: 400 },
    );
  }

  const update: Partial<Order> = { updatedAt: new Date() };

  for (const field of editableTextFields) {
    if (typeof body[field] === "string") update[field] = body[field].trim();
  }
  for (const field of editableNumberFields) {
    if (typeof body[field] === "number") update[field] = body[field];
  }
  if (typeof body.barcode === "string") update.barcode = body.barcode.trim();
  if (isOrderStatus(body.status)) update.status = body.status;

  try {
    const db = await getDb();
    const result = await db
      .collection<Order>("orders")
      .updateOne({ orderId }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const order = await db.collection<Order>("orders").findOne({ orderId });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { message: "Unable to update order." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_: Request, context: RouteContext) {
  const orderId = await getOrderId(context);

  if (!orderId) {
    return NextResponse.json({ message: "Order ID is required." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection<Order>("orders").deleteOne({ orderId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted." });
  } catch {
    return NextResponse.json(
      { message: "Unable to delete order." },
      { status: 500 },
    );
  }
}
