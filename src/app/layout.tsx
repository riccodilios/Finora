import type { Metadata } from "next";
import { Inter, Cairo, Tajawal } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSync } from "@/components/ThemeSync";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LanguageSync } from "@/components/LanguageSync";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({ 
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finora - Financial Dashboard",
  description: "Manage your finances with Finora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden",
          footerActionLink: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Theme initialization
                  const storedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
                  const root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                  
                  // Language initialization
                  const storedLanguage = localStorage.getItem('language') || 'en';
                  document.documentElement.setAttribute('lang', storedLanguage);
                  const direction = storedLanguage === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.setAttribute('dir', direction);
                  document.documentElement.style.direction = direction;
                  
                  // Set font family based on language
                  if (storedLanguage === 'ar') {
                    document.documentElement.style.fontFamily = 'var(--font-cairo), var(--font-tajawal), system-ui, sans-serif';
                  } else {
                    document.documentElement.style.fontFamily = 'var(--font-inter), system-ui, sans-serif';
                  }
                })();
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} ${cairo.variable} ${tajawal.variable} font-sans flex flex-col min-h-screen`}>
          <LanguageProvider>
            <ThemeProvider>
              <ConvexClientProvider>
                <CurrencyProvider>
                  <ThemeSync />
                  <LanguageSync />
                  <div className="flex-1">
                    {children}
                  </div>
                  <Footer />
                </CurrencyProvider>
              </ConvexClientProvider>
            </ThemeProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}