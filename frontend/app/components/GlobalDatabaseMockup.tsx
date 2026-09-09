import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function GlobalDatabaseMockup() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left Content */}
      <div className="lg:col-span-6 space-y-6">
        <h3 className="text-3xl font-semibold tracking-tight font-sans text-foreground leading-tight">
          Scan once, Everyone benefits
        </h3>
        
        <p className="text-body text-base max-w-lg leading-relaxed">
          Onbillo maintains a growing, verified barcode database. If another shop in India has already added a product, you&apos;ll get its details instantly without entering them manually. Setup your entire shop inventory in hours, not weeks.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Less manual work</h4>
              <p className="text-xs text-mute mt-0.5">Stop typing product names, tax weights, and categories for every new box.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Faster product setup</h4>
              <p className="text-xs text-mute mt-0.5">Just point your scanner and scan. The product detail is already in the cloud.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Community-powered database</h4>
              <p className="text-xs text-mute mt-0.5">A collaborative, verified catalog designed specifically for Indian retail shops.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div className="lg:col-span-6 flex justify-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-hairline shadow-level-4">
          <Image
            src="/scan_once_everyone_benefits.png"
            alt="Shopkeeper scanning a product barcode with Onbillo POS connected to the community-powered Global Database"
            width={880}
            height={1100}
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}
