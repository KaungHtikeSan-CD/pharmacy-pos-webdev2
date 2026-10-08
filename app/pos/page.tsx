"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { type Product } from "@/types/product";
import { type SoldItem } from "@/types/sale";

type ProductRecord = Product & { _id?: string };

export default function PosPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [lookup, setLookup] = useState("");
  const [cart, setCart] = useState<SoldItem[]>([]);
  const [message, setMessage] = useState("");

  async function loadProducts() {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      setProducts(data.products ?? []);
    } catch {
      setMessage("Unable to load products.");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.totalAmount, 0),
    [cart],
  );

  function getAvailableStock(productCode?: string) {
    if (!productCode) return 0;
    return products.find((product) => product.productCode === productCode)?.quantity ?? 0;
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const term = lookup.trim().toLowerCase();
    const product = products.find(
      (item) =>
        item.productCode.toLowerCase() === term ||
        (item.barcode ?? "").toLowerCase() === term,
    );

    if (!product) {
      setMessage("Product code or barcode not found.");
      return;
    }

    const currentQuantity = cart.find((item) => item.productCode === product.productCode)?.quantity ?? 0;
    if (product.quantity <= currentQuantity) {
      setMessage(`${product.medicineName} has only ${product.quantity} item(s) in stock.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productCode === product.productCode);
      if (existing) {
        return current.map((item) =>
          item.productCode === product.productCode
            ? {
              ...item,
                quantity: item.quantity + 1,
                totalAmount: Math.max(0, (item.quantity + 1) * item.salePrice - item.discount),
              }
            : item,
        );
      }
      return [
        ...current,
        {
          productCode: product.productCode,
          barcode: product.barcode,
          medicineName: product.medicineName,
          quantity: 1,
          unit: "box",
          salePrice: product.salePrice,
          discount: 0,
          totalAmount: product.salePrice,
        },
      ];
    });
    setLookup("");
  }

  function updateCart(index: number, field: "quantity" | "discount" | "unit", value: string) {
    const item = cart[index];
    const availableStock = getAvailableStock(item?.productCode);
    const requestedQuantity = Math.max(1, Number(value));

    if (field === "quantity" && requestedQuantity > availableStock) {
      setMessage(`${item.medicineName} has only ${availableStock} item(s) in stock.`);
    } else {
      setMessage("");
    }

    setCart((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const quantity =
          field === "quantity"
            ? Math.min(requestedQuantity, getAvailableStock(item.productCode))
            : item.quantity;
        const discount = field === "discount" ? Math.max(0, Number(value)) : item.discount;
        const unit = field === "unit" ? (value as "box" | "card") : item.unit;
        return {
          ...item,
          quantity,
          discount,
          unit,
          totalAmount: Math.max(0, quantity * item.salePrice - discount),
        };
      }),
    );
  }

  function removeCartItem(index: number) {
    setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function checkout() {
    setMessage("");
    if (cart.length === 0) {
      setMessage("Add at least one item before checkout.");
      return;
    }

    const overStockItem = cart.find((item) => item.quantity > getAvailableStock(item.productCode));
    if (overStockItem) {
      setMessage(`${overStockItem.medicineName} has only ${getAvailableStock(overStockItem.productCode)} item(s) in stock.`);
      return;
    }

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: `SALE-${Date.now()}`,
          soldItems: cart,
          totalAmount,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to complete checkout.");
        return;
      }

      setCart([]);
      await loadProducts();
      setMessage("Checkout complete. Sale saved to purchase history.");
    } catch {
      setMessage("Unable to complete checkout.");
    }
  }

  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">POS Sale</p>
        <h2>Customer checkout</h2>
        <p>Scan with a barcode scanner or type a product code/barcode to add items and complete checkout.</p>
      </div>

      <section className="work-panel">
        <h3>Scan or type item</h3>
        <form className="inline-form" onSubmit={addProduct}>
          <input
            autoFocus
            placeholder="Scan barcode or type product code"
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
          />
          <button type="submit">Scan / Add</button>
        </form>
        <p className="helper-text">USB barcode scanners work like a keyboard. Keep this field selected, then scan the product barcode.</p>
        {message ? <p className="status-text">{message}</p> : null}
      </section>

      <section className="work-panel">
        <div className="panel-header">
          <h3>Cart</h3>
          <strong>Total: {totalAmount.toLocaleString()}</strong>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr><td colSpan={8}>No checkout items.</td></tr>
              ) : (
                cart.map((item, index) => (
                  <tr key={`${item.productCode}-${index}`}>
                    <td>{item.medicineName}</td>
                    <td>{getAvailableStock(item.productCode)}</td>
                    <td>
                      <select value={item.unit} onChange={(event) => updateCart(index, "unit", event.target.value)}>
                        <option value="box">box</option>
                        <option value="card">card</option>
                      </select>
                    </td>
                    <td><input type="number" min="1" value={item.quantity} onChange={(event) => updateCart(index, "quantity", event.target.value)} /></td>
                    <td>{item.salePrice.toLocaleString()}</td>
                    <td><input type="number" min="0" value={item.discount} onChange={(event) => updateCart(index, "discount", event.target.value)} /></td>
                    <td>{item.totalAmount.toLocaleString()}</td>
                    <td><button type="button" className="danger-button" onClick={() => removeCartItem(index)}>Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="form-actions">
          <button type="button" onClick={checkout}>Checkout</button>
        </div>
      </section>
    </section>
  );
}
