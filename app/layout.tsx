import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharmacy POS System",
  description: "Web Development Project 2 pharmacy POS system",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/stock", label: "Stock" },
  { href: "/orders", label: "Orders" },
  { href: "/pos", label: "POS Sale" },
  { href: "/purchase-history", label: "Purchase History" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div>
            <p className="eyebrow">Web Development Project 2</p>
            <h1>Pharmacy POS System</h1>
          </div>
          <nav aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
