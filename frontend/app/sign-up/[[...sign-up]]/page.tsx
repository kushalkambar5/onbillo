import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="mesh-gradient-bg min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-brand-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group outline-none">
          <img src="/favicon.svg" alt="Onbillo Logo" className="w-9 h-9 rounded-xl shadow-md shadow-brand-primary/15 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-2xl font-bold tracking-tight font-sans text-foreground">
            Onbillo
          </span>
        </Link>
        <p className="mt-2 text-xs text-mute font-medium tracking-wide uppercase">
          Create your account
        </p>
      </div>

      {/* Clerk Card Wrapper */}
      <div className="w-full max-w-[480px] flex justify-center z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full shadow-level-4 rounded-2xl bg-canvas",
              card: "w-full border border-hairline bg-canvas/90 backdrop-blur-md shadow-none rounded-2xl p-6 md:p-8",
              headerTitle: "text-foreground font-sans font-bold tracking-tight text-xl",
              headerSubtitle: "text-body text-sm mt-1",
              socialButtonsBlockButton: "border border-hairline hover:bg-canvas-soft text-foreground rounded-lg transition-all duration-200 text-sm h-10",
              socialButtonsBlockButtonText: "font-medium",
              dividerLine: "bg-hairline",
              dividerText: "text-mute text-xs px-2 uppercase font-mono tracking-wider",
              formFieldLabel: "text-foreground font-medium text-xs mb-1.5",
              formInput: "border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground",
              formButtonPrimary: "bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-lg transition-all duration-200 h-10 shadow-sm shadow-brand-primary/10 cursor-pointer",
              footerActionLink: "text-brand-primary hover:text-brand-secondary font-medium",
              footerActionText: "text-body",
              identityPreviewText: "text-foreground",
              identityPreviewEditButtonIcon: "text-brand-primary",
            },
          }}
        />
      </div>

      <div className="mt-8 text-center text-xs text-mute z-10">
        <Link href="/" className="hover:text-foreground transition-colors duration-200 underline underline-offset-4">
          Back to home page
        </Link>
      </div>
    </div>
  );
}
