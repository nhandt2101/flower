import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blumengeschäft",
  description: "Flower shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
