import { plannedProductFields } from "@/types/product";

export default function StockPage() {
  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Product / Stock</p>
        <h2>Product and stock foundation</h2>
        <p>
          Kaung Htike San is responsible for the Product/Stock module. This page
          defines the planned fields before full CRUD is implemented.
        </p>
      </div>

      <section className="work-panel">
        <h3>Planned product fields</h3>
        <div className="field-list">
          {plannedProductFields.map((field) => (
            <span key={field}>{field}</span>
          ))}
        </div>
      </section>

      <section className="work-panel">
        <h3>Next Product/Stock steps</h3>
        <ul>
          <li>Connect the Product API to MongoDB.</li>
          <li>Add product create, edit, delete, and search UI.</li>
          <li>Show low stock items using the low stock threshold.</li>
        </ul>
      </section>
    </section>
  );
}
