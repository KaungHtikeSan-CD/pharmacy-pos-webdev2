"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { type Product } from "@/types/product";

type ProductRecord = Product & { _id?: string };

const emptyForm = {
  productId: "",
  productCode: "",
  barcode: "",
  medicineName: "",
  category: "",
  quantity: 0,
  cardsPerBox: 1,
  wholesalePrice: 0,
  profitPercentage: 20,
  salePrice: 0,
  wholesaleShop: "",
  lowStockThreshold: 5,
};

function calculateSalePrice(wholesalePrice: number, profitPercentage: number) {
  return Math.round(wholesalePrice + (wholesalePrice * profitPercentage) / 100);
}

export default function StockPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      setProducts(data.products ?? []);
    } catch {
      setMessage("Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [
        product.productCode,
        product.barcode ?? "",
        product.medicineName,
        product.category,
        product.wholesaleShop,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, search]);

  function updateField(field: keyof typeof emptyForm, value: string) {
    const numberFields = [
      "quantity",
      "cardsPerBox",
      "wholesalePrice",
      "profitPercentage",
      "salePrice",
      "lowStockThreshold",
    ];
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: numberFields.includes(field) ? Number(value) : value,
      };

      if (field === "wholesalePrice" || field === "profitPercentage") {
        nextForm.salePrice = calculateSalePrice(
          Number(nextForm.wholesalePrice),
          Number(nextForm.profitPercentage),
        );
      }

      return nextForm;
    });
  }

  function startEdit(product: ProductRecord) {
    setEditingId(product.productId);
    setForm({
      productId: product.productId,
      productCode: product.productCode,
      barcode: product.barcode ?? "",
      medicineName: product.medicineName,
      category: product.category,
      quantity: product.quantity,
      cardsPerBox: product.cardsPerBox,
      wholesalePrice: product.wholesalePrice,
      profitPercentage: product.profitPercentage,
      salePrice: product.salePrice,
      wholesaleShop: product.wholesaleShop,
      lowStockThreshold: product.lowStockThreshold,
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

    const productPayload = {
      productCode: form.productCode,
      medicineName: form.medicineName,
      category: form.category,
      quantity: form.quantity,
      cardsPerBox: form.cardsPerBox,
      wholesalePrice: form.wholesalePrice,
      profitPercentage: form.profitPercentage,
      salePrice: calculateSalePrice(form.wholesalePrice, form.profitPercentage),
      wholesaleShop: form.wholesaleShop,
      lowStockThreshold: form.lowStockThreshold,
      ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
    };
    const payload = {
      ...(editingId ? {} : { productId: form.productId }),
      ...productPayload,
    };
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to save product.");
        return;
      }

      setMessage(editingId ? "Product updated." : "Product added.");
      resetForm();
      await loadProducts();
    } catch {
      setMessage("Unable to save product.");
    }
  }

  async function deleteProduct(productId: string) {
    setMessage("");
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to delete product.");
        return;
      }

      setMessage("Product deleted.");
      await loadProducts();
    } catch {
      setMessage("Unable to delete product.");
    }
  }

  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Product / Stock</p>
        <h2>Stock management</h2>
        <p>Add medicines, edit stock details, search products, and monitor low stock items.</p>
      </div>

      <section className="work-panel">
        <h3>{editingId ? "Edit product" : "Add product"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Product ID
            <input value={form.productId} onChange={(event) => updateField("productId", event.target.value)} disabled={Boolean(editingId)} required />
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
            <input type="number" min="0" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} required />
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
            Profit %
            <input type="number" min="0" value={form.profitPercentage} onChange={(event) => updateField("profitPercentage", event.target.value)} required />
          </label>
          <label>
            Sale Price (Auto)
            <input type="number" min="0" value={form.salePrice} readOnly />
          </label>
          <label>
            Wholesale Shop
            <input value={form.wholesaleShop} onChange={(event) => updateField("wholesaleShop", event.target.value)} required />
          </label>
          <label>
            Low Stock Threshold
            <input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => updateField("lowStockThreshold", event.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit">{editingId ? "Update product" : "Add product"}</button>
            {editingId ? <button type="button" className="secondary" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>
        {message ? <p className="status-text">{message}</p> : null}
      </section>

      <section className="work-panel">
        <div className="panel-header">
          <h3>Stock list</h3>
          <input className="search-input" placeholder="Search stock" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Medicine</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Wholesale</th>
                <th>Sale</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}>Loading stock...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={8}>No products found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>{product.productCode}</td>
                    <td>{product.medicineName}</td>
                    <td>{product.category}</td>
                    <td>{Math.max(0, product.quantity)}</td>
                    <td>{product.wholesalePrice.toLocaleString()}</td>
                    <td>{product.salePrice.toLocaleString()}</td>
                    <td>
                      <span className={Math.max(0, product.quantity) <= product.lowStockThreshold ? "badge danger" : "badge"}>
                        {Math.max(0, product.quantity) <= product.lowStockThreshold ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="secondary" onClick={() => startEdit(product)}>Edit</button>
                        <button type="button" className="danger-button" onClick={() => deleteProduct(product.productId)}>Delete</button>
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
