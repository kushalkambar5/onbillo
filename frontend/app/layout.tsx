import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import PhonePromptModal from "./components/PhonePromptModal";
import PremiumBlockModal from "./components/PremiumBlockModal";
import "./globals.css";
import "./bones/registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onbillo — Next-Gen Billing & POS for Indian Retail",
  description: "A multi-platform billing & POS system for Indian retail shops — from kirana stores to restaurants and wholesale dealers. It combines barcode scanning, thermal printing, GST compliance, role-based access, cloud sync with offline-first resilience, and a global product database.",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Onbillo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          {/* Pre-hydration sanitizer: browser extensions (Urban VPN Proxy
              `bis_skin_checked` / `bis_use`, Grammarly, LanguageTool, Google)
              inject attributes / chrome-extension src into the DOM before React
              hydrates, causing "A tree hydrated but some attributes ... didn't
              match" errors. Strip them synchronously + observe late injections
              for 5s. */}
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `(function(){var ATTRS=["bis_skin_checked","bis_skin_visible","bis_use","data-dynamic-id","data-google-query-id","data-new-gr-c-s-check-loaded","data-gr-ext-installed","data-lt-installed","data-lt-tmp-id"];function strip(root){if(!root||!root.querySelectorAll)return;try{if(root.hasAttribute){for(var i=0;i<ATTRS.length;i++){if(root.hasAttribute(ATTRS[i]))root.removeAttribute(ATTRS[i]);}}for(var k=0;k<ATTRS.length;k++){var els=root.querySelectorAll("["+ATTRS[k]+"]");for(var j=0;j<els.length;j++){els[j].removeAttribute(ATTRS[k]);}}}catch(e){}}strip(document.documentElement);try{var obs=new MutationObserver(function(muts){for(var m=0;m<muts.length;m++){var t=muts[m].target;var a=muts[m].attributeName;if(t&&t.removeAttribute&&a&&ATTRS.indexOf(a)!==-1){t.removeAttribute(a);}}});obs.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:ATTRS});setTimeout(function(){obs.disconnect();},5000);}catch(e){}})();`,
            }}
          />
          {/* Plain inline script (not next/script): next/script's
              beforeInteractive uses a (self.__next_s).push payload with
              nonce/__html that extensions like Urban VPN overwrite with
              chrome-extension src + bis_use, guaranteeing a mismatch.
              A plain script has no such payload, and
              suppressHydrationWarning silences any residual mutation. */}
          <script
            id="theme-script"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme')||'light';if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200" suppressHydrationWarning>
          {children}
          <PhonePromptModal />
          <PremiumBlockModal />
        </body>
      </html>
    </ClerkProvider>
  );
}
