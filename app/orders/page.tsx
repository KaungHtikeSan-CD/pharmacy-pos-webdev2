import { plannedOrderFields } from "@/types/order";

export default function OrdersPage() {
  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Orders</p>
        <h2>Order Management foundation</h2>
        <p>
          Assigned to Oak Soe Khant. Today&apos;s setup defines the planned order
          fields and adds placeholder GET and POST API routes for the next CRUD
          steps.
        </p>
      </div>

      <section className="work-panel">
        <h3>Planned order fields</h3>
        <ul>
          {plannedOrderFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
