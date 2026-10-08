"use client";

import { useEffect, useMemo, useState } from "react";

import { type Sale } from "@/types/sale";

type SaleRecord = Sale & { _id?: string };

export default function PurchaseHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSales() {
    setLoading(true);
    try {
      const response = await fetch("/api/sales", { cache: "no-store" });
      const data = await response.json();
      setSales(data.sales ?? []);
    } catch {
      setMessage("Unable to load purchase history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  const totalSales = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  );

  async function deleteSale(saleId: string) {
    const confirmed = window.confirm("Delete this sale record?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to delete sale.");
        return;
      }

      setMessage("Sale deleted.");
      await loadSales();
    } catch {
      setMessage("Unable to delete sale.");
    }
  }

  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Purchase History</p>
        <h2>Completed sales</h2>
        <p>Review checkout records by newest date first.</p>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <span>Total Sale Records</span>
          <strong>{sales.length}</strong>
          <p>Saved checkout transactions</p>
        </article>
        <article className="summary-card">
          <span>Total Sales Amount</span>
          <strong>{totalSales.toLocaleString()}</strong>
          <p>From purchase history</p>
        </article>
      </div>

      <section className="work-panel">
        <h3>History</h3>
        {message ? <p className="status-text">{message}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Loading purchase history...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={5}>No purchase history yet.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.saleId}>
                    <td>{sale.saleId}</td>
                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                    <td>{sale.soldItems.map((item) => `${item.medicineName} x${item.quantity}`).join(", ")}</td>
                    <td>{sale.totalAmount.toLocaleString()}</td>
                    <td><button type="button" className="danger-button" onClick={() => deleteSale(sale.saleId)}>Delete</button></td>
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
