import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = {
  title: "CRE 大樓租賃管理系統",
  description: "商用不動產大樓租賃管理系統"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AppNav />
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
