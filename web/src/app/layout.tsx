import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "n8n WhatsApp Agent Dashboard",
  description:
    "Collect structured WhatsApp automation payloads and dispatch them to your n8n workflows in real time.",
  metadataBase: new URL("https://agentic-68da2ec6.vercel.app"),
  openGraph: {
    title: "n8n WhatsApp Agent Dashboard",
    description:
      "Trigger WhatsApp Cloud API or Twilio conversations straight from a Vercel-hosted interface.",
    url: "https://agentic-68da2ec6.vercel.app",
    siteName: "n8n WhatsApp Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "n8n WhatsApp Agent Dashboard",
    description:
      "Streamline message automation with a polished launchpad connected to n8n workflows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
