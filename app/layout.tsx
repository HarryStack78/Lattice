import type { Metadata, Viewport } from "next";
import { Syne, Inter, JetBrains_Mono, Manjari } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import CustomCursor from "@/components/CustomCursor";
import NoiseOverlay from "@/components/NoiseOverlay";
import { LocaleProvider } from "@/lib/i18n";
import { getSiteContent } from "@/lib/site";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const manjari = Manjari({
  subsets: ["malayalam", "latin"],
  weight: ["400", "700"],
  variable: "--font-ml",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = cookieStore.get("lattice_locale")?.value === "ml" ? "ml" : "en";
  const site = await getSiteContent(locale);
  const { title, description, siteUrl, siteName } = site.seo;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        ml: "/ml",
      },
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName,
      locale: locale === "ml" ? "ml_IN" : "en_US",
      type: "website",
      images: [{ url: "/og-image.png", width: 1254, height: 1254, alt: "Lattice logo" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#F4F4F2",
};

// Runs before first paint so the saved theme never flashes the wrong colours. Light is the default.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("lattice-theme");if(t!=="light"&&t!=="dark"){t="light"}document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",t==="light"?"#F4F4F2":"#0B0B0C")}}catch(e){document.documentElement.dataset.theme="light"}})();`;

const LOCALE_INIT_SCRIPT = `(function(){try{var p=window.location.pathname;var isMl=p.startsWith("/ml")||document.cookie.indexOf("lattice_locale=ml")!==-1;if(isMl){document.documentElement.lang="ml";document.documentElement.setAttribute("data-locale","ml");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("lattice_locale")?.value === "ml" ? "ml" : "en";

  return (
    <html
      lang={cookieLocale}
      data-theme="light"
      data-locale={cookieLocale}
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} ${manjari.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
        <noscript>
          <style>{`[data-mask],[data-fade]{visibility:visible !important}`}</style>
        </noscript>
      </head>
      <body className="bg-canvas font-sans text-ink-primary antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <NoiseOverlay />
        <LocaleProvider initialLocale={cookieLocale}>
          <ThemeProvider>
            <CustomCursor />
            <SmoothScrollProvider>
              <div id="main-content">{children}</div>
            </SmoothScrollProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
