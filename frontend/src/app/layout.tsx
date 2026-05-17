import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2chi · 이취",
  description: "취업·이직 올인원 워크스페이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
