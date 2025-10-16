import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EHS Suite",
  description: "EHS Suite – SMK3 ready dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
