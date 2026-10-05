import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triangles",
  description: "Professional networking platform",
  verification: {
    google: "0NJhd1AKbFYkmygwh26W1tjN-EdJZKdxgtrNYIFLyqw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}