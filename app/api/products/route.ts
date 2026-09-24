import { NextResponse } from "next/server";

import { plannedProductFields, type Product } from "@/types/product";

export async function GET() {
  return NextResponse.json({
    message: "Product and Stock API foundation is ready.",
    assignedTo: "Kaung Htike San",
    status: "Planning setup only",
    plannedFields: plannedProductFields,
    products: [] as Product[],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Product creation placeholder added. Full MongoDB save logic will be implemented in a later step.",
      assignedTo: "Kaung Htike San",
      plannedFields: plannedProductFields,
    },
    { status: 501 },
  );
}
