import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ascendsolutions.dev"),
  alternates: { canonical: "/" },
  title: {
    default: "Ascend Solutions | Technology Built for Families",
    template: "%s | Ascend Solutions",
  },
  description:
    "Family-first technology from Ascend Solutions, including practical apps like Pantrii.",
  openGraph: {
    title: "Ascend Solutions",
    description: "Practical apps for busy family life.",
    url: "https://ascendsolutions.dev",
    siteName: "Ascend Solutions",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ascend Solutions: Practical apps for busy family life." }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ascend Solutions",
    description: "Practical apps for busy family life.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/brand/ascend-icon-background.png",
    shortcut: "/brand/ascend-icon-background.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><a className="skip-link" href="#main-content">Skip to main content</a>{children}</body>
    </html>
  );
}
