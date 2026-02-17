import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Saksham's CodeForces Progress",
  description: "CodeForces Progress Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
