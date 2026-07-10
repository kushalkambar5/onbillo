"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { productsApi } from "../../../utils/api";
import { ArrowLeft, Info, ScanBarcode, Upload, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(
  () => import("../../../components/BarcodeScanner"),
  { ssr: false }
);

export default function AdminAddProduct() {
  const { getToken } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    barcode: "",
    brand: "",
    name: "",
    category: "",
    mrp: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (cleanBarcode) {
      setForm((prev) => ({ ...prev, barcode: cleanBarcode }));
    }
    setScannerOpen(false);
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Invalid file format. Only PNG, JPG, JPEG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const parsedMrp = Math.round(parseFloat(form.mrp) * 100);
      if (isNaN(parsedMrp) || parsedMrp <= 0) {
        throw new Error("MRP must be a valid positive number.");
      }

      const isBoneyard = typeof window !== "undefined" && 
        ((window as Window & { __BONEYARD_BUILD?: unknown }).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

      let uploadedImageUrl: string | null = null;
      
      if (imageFile && !isBoneyard) {
        const token = await getToken();
        const uploadRes = await productsApi.uploadImage(token, imageFile);
        uploadedImageUrl = uploadRes.url;
      } else if (imageFile && isBoneyard) {
        uploadedImageUrl = imagePreview; // locally mocked image preview url
      }

      const data = {
        barcode: form.barcode.trim() || "",
        brand: form.brand.trim() || "",
        name: form.name.trim(),
        category: form.category.trim() || "",
        mrp: parsedMrp,
        imageUrl: uploadedImageUrl
      };

      if (isBoneyard) {
        setSuccess(`Successfully added product "${data.name}" directly to the global database.`);
        setForm({ barcode: "", brand: "", name: "", category: "", mrp: "" });
        clearSelectedImage();
        setTimeout(() => {
          router.push("/admin/products");
        }, 1500);
        return;
      }

      const token = await getToken();
      await productsApi.requestNewGlobalProduct(token, data);
      setSuccess(`Successfully added product "${data.name}" directly to the global database.`);
      setForm({ barcode: "", brand: "", name: "", category: "", mrp: "" });
      clearSelectedImage();
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Failed to add product to the global registry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl select-none">
      {/* Back Link & Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white font-sans">Add Global Product</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create a new verified product directly in the platform catalog.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-lg bg-zinc-900 border border-brand-primary/20 text-xs font-semibold text-brand-primary">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 text-xs font-semibold text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-md">
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
            UPC Barcode Value
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-10 pl-3 pr-10 text-white transition-all duration-200 outline-none"
              placeholder="e.g. 8901030818279"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer"
              title="Scan barcode with camera"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[9px] text-zinc-500 mt-1 block leading-normal">
            Optional. Leaving this empty makes it a non-barcoded catalog item.
          </span>
        </div>

        {/* Product Image Option */}
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
            Product Image
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                <img src={imagePreview} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Upload</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDeviceFileUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="text-[9px] text-zinc-500 leading-normal">
              Optional. PNG, JPG or WEBP format. Max size 5MB.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
              Brand Name
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-white transition-all duration-200 outline-none"
              placeholder="e.g. Brooke Bond"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-white transition-all duration-200 outline-none"
              placeholder="e.g. Beverages"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-white transition-all duration-200 outline-none"
            placeholder="e.g. Red Label Tea 500g"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
            Maximum Retail Price (MRP in ₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            min="0.01"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-white font-mono transition-all duration-200 outline-none"
            placeholder="e.g. 195.00"
          />
        </div>

        {/* Note on Auto-approval */}
        <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/10 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-normal">
            As a Platform Administrator, any product you create is automatically set to <strong>Approved</strong> and published immediately to the platform database.
          </p>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 h-10 border border-zinc-800 hover:bg-zinc-850 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 h-10 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading ? "Adding Product..." : "Create Product"}
          </button>
        </div>
      </form>

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        continuous={false}
        title="Scan Product Barcode"
      />
    </div>
  );
}
