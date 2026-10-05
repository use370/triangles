import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triangles",
  description: "Professional networking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="0NJhd1AKbFYkmygwh26W1tjN-EdJZKdxgtrNYIFLyqw"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}