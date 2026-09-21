import { NextResponse } from "next/server";

import { plannedOrderFields, type Order } from "@/types/order";

export async function GET() {
  return NextResponse.json({
    message: "Order Management API foundation is ready.",
    assignedTo: "Oak Soe Khant",
    status: "Planning setup only",
    plannedFields: plannedOrderFields,
    orders: [] as Order[],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Order creation placeholder added. Full MongoDB save logic will be implemented in a later step.",
      assignedTo: "Oak Soe Khant",
      plannedFields: plannedOrderFields,
    },
    { status: 501 },
  );
}
