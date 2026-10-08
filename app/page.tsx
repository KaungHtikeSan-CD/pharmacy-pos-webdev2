"use client";

import { useEffect, useMemo, useState } from "react";

import { type Order } from "@/types/order";
import { type Product } from "@/types/product";
import { type Sale } from "@/types/sale";

type ProductRecord = Product & { _id?: string };
type OrderRecord = Order & { _id?: string };
type SaleRecord = Sale & { _id?: string };

export default function DashboardPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [productsResponse, ordersResponse, salesResponse] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/sales", { cache: "no-store" }),
        ]);
        const [productsData, ordersData, salesData] = await Promise.all([
          productsResponse.json(),
          ordersResponse.json(),
          salesResponse.json(),
        ]);
        setProducts(productsData.products ?? []);
        setOrders(ordersData.orders ?? []);
        setSales(salesData.sales ?? []);
      } catch {
        setMessage("Unable to load dashboard data. Check MongoDB connection.");
      }
    }

    loadDashboard();
  }, []);

  const totalSales = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  );
  const lowStockCount = products.filter(
    (product) => product.quantity <= product.lowStockThreshold,
  ).length;
  const arrivedOrders = orders.filter((order) => order.status === "Arrived").length;
  const topProducts = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    for (const sale of sales) {
      for (const item of sale.soldItems) {
        const key = item.productCode ?? item.barcode ?? item.medicineName;
        const existing = totals.get(key) ?? { name: item.medicineName, quantity: 0, total: 0 };
        existing.quantity += item.quantity;
        existing.total += item.totalAmount;
        totals.set(key, existing);
      }
    }
    return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [sales]);

  const summaryCards = [
    { label: "Stock Items", value: products.length.toString(), helper: `${lowStockCount} low stock` },
    { label: "Orders", value: orders.length.toString(), helper: `${arrivedOrders} arrived` },
    { label: "Total Sales", value: totalSales.toLocaleString(), helper: `${sales.length} sale records` },
  ];

  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Dashboard</p>
        <h2>Pharmacy overview</h2>
        <p>Track stock, wholesale orders, purchase history, and top-selling products.</p>
      </div>
      {message ? <p className="status-text">{message}</p> : null}

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <article className="summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.helper}</p>
          </article>
        ))}
      </div>

      <section className="work-panel">
        <h3>Top selling products</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Quantity Sold</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={3}>No sales yet.</td></tr>
              ) : (
                topProducts.map((product) => (
                  <tr key={product.name}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{product.total.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
