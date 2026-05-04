import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://platz-intl.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Platz | Japan-Made Nursing Care, Hospital & Care Facility Beds",
    template: "%s | Platz",
  },
  description:
    "Platz designs and manufactures medical beds in Japan — Rafio nursing care beds, P300 hospital beds, Miolet III, and Ardel care facility beds. Patented High Back Support Function reduces aspiration risk and bedsores. JIS T9254 certified.",
  keywords: [
    "medical bed",
    "hospital bed",
    "nursing care bed",
    "care facility bed",
    "Rafio",
    "P300",
    "Miolet",
    "Ardel",
    "Platz",
    "high back support",
    "bedsore prevention",
    "low floor bed",
    "Japan medical equipment",
    "护理床",
    "医院病床",
    "电动护理床",
  ],
  openGraph: {
    title: "Platz | Japan-Made Medical Beds",
    description:
      "Patented High Back Support Function reduces aspiration risk and bedsores. Very low-to-the-floor design (15 cm) prevents fall injuries. JIS T9254 certified.",
    siteName: "Platz",
    type: "website",
    url: siteUrl,
    locale: "en_US",
    alternateLocale: "zh_CN",
    images: [
      {
        url: "/images/og-cover.png",
        width: 1200,
        height: 630,
        alt: "Platz Rafio Nursing Care Bed with High Back Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Platz | Japan-Made Medical Beds",
    description:
      "Nursing care, hospital, and care facility beds with patented High Back Support Function. Reduces aspiration risk and bedsores.",
    images: ["/images/og-cover.png"],
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      zh: "/?lang=zh",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Platz Blog"
          href="/blog/rss.xml"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Platz",
              url: siteUrl,
              logo: `${siteUrl}/images/logo.png`,
              description:
                "Japan-made nursing care, hospital, and care facility beds with patented High Back Support Function.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "600 California St",
                addressLocality: "San Francisco",
                addressRegion: "CA",
                postalCode: "94108",
                addressCountry: "US",
              },
              contactPoint: {
                "@type": "ContactPoint",
                email: "jay.lin@usproglove.us",
                contactType: "sales",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Platz Rafio Nursing Care Bed",
              description:
                "Patented High Back Support Function reduces sacrum pressure by up to 39%. Very low-to-the-floor (15 cm) design prevents fall injuries. JIS T9254 certified.",
              brand: { "@type": "Brand", name: "Platz" },
              category: "Medical Bed / Nursing Care Bed",
              offers: {
                "@type": "Offer",
                availability: "https://schema.org/InStock",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S6MJ5ZRH0E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S6MJ5ZRH0E');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>{children}</I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
