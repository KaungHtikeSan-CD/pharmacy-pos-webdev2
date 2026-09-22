import { NextResponse } from "next/server";

import {
  plannedSaleFields,
  plannedSoldItemFields,
  type Sale,
} from "@/types/sale";

export async function GET() {
  return NextResponse.json({
    message: "POS Sale and Purchase History API foundation is ready.",
    assignedTo: "Phyo Min Khaing",
    status: "Planning setup only",
    plannedFields: plannedSaleFields,
    plannedSoldItemFields,
    sales: [] as Sale[],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Sale creation placeholder added. Full MongoDB save logic will be implemented in a later step.",
      assignedTo: "Phyo Min Khaing",
      plannedFields: plannedSaleFields,
      plannedSoldItemFields,
    },
    { status: 501 },
  );
}
