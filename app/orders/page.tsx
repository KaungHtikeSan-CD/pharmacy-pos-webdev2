"use client";

import { FormEvent, useEffect, useState } from "react";

import { type Order, type OrderStatus } from "@/types/order";

type OrderRecord = Order & { _id?: string };

const emptyForm = {
  orderId: "",
  productCode: "",
  barcode: "",
  medicineName: "",
  category: "",
  quantity: 1,
  cardsPerBox: 1,
  wholesalePrice: 0,
  wholesaleShop: "",
  status: "Ordered" as OrderStatus,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await response.json();
      setOrders(data.orders ?? []);
    } catch {
      setMessage("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    const numberFields = ["quantity", "cardsPerBox", "wholesalePrice"];
    setForm((current) => ({
      ...current,
      [field]: numberFields.includes(field) ? Number(value) : value,
    }));
  }

  function startEdit(order: OrderRecord) {
    setEditingId(order.orderId);
    setForm({
      orderId: order.orderId,
      productCode: order.productCode,
      barcode: order.barcode ?? "",
      medicineName: order.medicineName,
      category: order.category,
      quantity: order.quantity,
      cardsPerBox: order.cardsPerBox,
      wholesalePrice: order.wholesalePrice,
      wholesaleShop: order.wholesaleShop,
      status: order.status,
    });
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const originalOrder = editingId
      ? orders.find((order) => order.orderId === editingId)
      : null;

    const now = new Date().toISOString();
    const orderPayload = {
      productCode: form.productCode,
      medicineName: form.medicineName,
      category: form.category,
      quantity: form.quantity,
      cardsPerBox: form.cardsPerBox,
      wholesalePrice: form.wholesalePrice,
      wholesaleShop: form.wholesaleShop,
      status: form.status,
      ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
    };
    const payload = {
      ...(editingId
        ? {}
        : {
            orderId: form.orderId,
            createdAt: now,
            updatedAt: now,
          }),
      ...orderPayload,
    };
    const url = editingId ? `/api/orders/${editingId}` : "/api/orders";
    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to save order.");
        return;
      }

      if (editingId && originalOrder?.status === "Arrived") {
        setMessage("Order updated. Stock was recalculated for the arrived order.");
      } else if (editingId && form.status === "Arrived") {
        setMessage(`Order updated as arrived. Stock increased by ${form.quantity} for ${form.medicineName}.`);
      } else {
        setMessage(editingId ? "Order updated." : "Order added.");
      }
      resetForm();
      await loadOrders();
    } catch {
      setMessage("Unable to save order.");
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setMessage("");
    const order = orders.find((order) => order.orderId === orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to update order status.");
        return;
      }

      setMessage(
        status === "Arrived" && order
          ? `Order marked as arrived. Stock increased by ${order.quantity} for ${order.medicineName}.`
          : "Order status updated.",
      );
      await loadOrders();
    } catch {
      setMessage("Unable to update order status.");
    }
  }

  async function deleteOrder(orderId: string) {
    const order = orders.find((order) => order.orderId === orderId);
    const confirmed = window.confirm("Delete this order?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to delete order.");
        return;
      }

      setMessage(
        order?.status === "Arrived"
          ? `Order deleted. Stock was reduced by ${order.quantity} for ${order.medicineName}.`
          : "Order deleted.",
      );
      await loadOrders();
    } catch {
      setMessage("Unable to delete order.");
    }
  }

  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Orders</p>
        <h2>Order management</h2>
        <p>Create wholesale orders, edit them, mark items as arrived, and remove mistakes.</p>
      </div>

      <section className="work-panel">
        <h3>{editingId ? "Edit order" : "Add order"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Order ID
            <input value={form.orderId} onChange={(event) => updateField("orderId", event.target.value)} disabled={Boolean(editingId)} required />
          </label>
          <label>
            Product Code
            <input value={form.productCode} onChange={(event) => updateField("productCode", event.target.value)} required />
          </label>
          <label>
            Barcode
            <input value={form.barcode} onChange={(event) => updateField("barcode", event.target.value)} />
          </label>
          <label>
            Medicine Name
            <input value={form.medicineName} onChange={(event) => updateField("medicineName", event.target.value)} required />
          </label>
          <label>
            Category
            <input value={form.category} onChange={(event) => updateField("category", event.target.value)} required />
          </label>
          <label>
            Quantity
            <input type="number" min="1" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} required />
          </label>
          <label>
            Cards / Box
            <input type="number" min="1" value={form.cardsPerBox} onChange={(event) => updateField("cardsPerBox", event.target.value)} required />
          </label>
          <label>
            Wholesale Price
            <input type="number" min="0" value={form.wholesalePrice} onChange={(event) => updateField("wholesalePrice", event.target.value)} required />
          </label>
          <label>
            Wholesale Shop
            <input value={form.wholesaleShop} onChange={(event) => updateField("wholesaleShop", event.target.value)} required />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
              <option value="Ordered">Ordered</option>
              <option value="Arrived">Arrived</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit">{editingId ? "Update order" : "Add order"}</button>
            {editingId ? <button type="button" className="secondary" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>
        {message ? <p className="status-text">{message}</p> : null}
      </section>

      <section className="work-panel">
        <h3>Order list</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Shop</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6}>No orders found.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.medicineName}</td>
                    <td>{order.quantity}</td>
                    <td>{order.wholesaleShop}</td>
                    <td><span className={order.status === "Arrived" ? "badge" : "badge warning"}>{order.status}</span></td>
                    <td>
                      <div className="table-actions">
                        {order.status !== "Arrived" ? (
                          <button type="button" onClick={() => updateStatus(order.orderId, "Arrived")}>Arrived</button>
                        ) : null}
                        <button type="button" className="secondary" onClick={() => startEdit(order)}>Edit</button>
                        <button type="button" className="danger-button" onClick={() => deleteOrder(order.orderId)}>Delete</button>
                      </div>
                    </td>
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
