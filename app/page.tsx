const summaryCards = [
  { label: "Stock Items", value: "0", helper: "Product foundation added" },
  { label: "Orders", value: "0", helper: "Assigned to Oak" },
  { label: "Sales", value: "0", helper: "Assigned to Phyo" },
];

export default function DashboardPage() {
  return (
    <section className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Dashboard</p>
        <h2>Project foundation</h2>
        <p>
          This starter dashboard confirms the Next.js app structure. The team
          will add each CRUD module in separate commits.
        </p>
      </div>

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
        <h3>Current team split</h3>
        <ul>
          <li>Kaung Htike San: project setup and Product/Stock module</li>
          <li>Oak Soe Khant: Order Management module</li>
          <li>Phyo Min Khaing: POS Sale, Purchase History, and Dashboard data</li>
        </ul>
      </section>
    </section>
  );
}
