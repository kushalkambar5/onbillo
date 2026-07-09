"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Crop, Check, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { productsApi } from "../utils/api/products";

interface LogoUploadAndCropProps {
  value: string | null;
  onChange: (url: string | null) => void;
  getToken: () => Promise<string | null>;
}

export default function LogoUploadAndCrop({ value, onChange, getToken }: LogoUploadAndCropProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop Box state relative to displayed image dimensions in pixels
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 150, h: 150 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startCrop = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Detect boneyard/mock mode
  const isBoneyard = typeof window !== "undefined" && 
    (!!(window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Initialize crop coordinates once the image is loaded inside the modal
  const handleImageLoad = () => {
    if (imgRef.current) {
      const { clientWidth, clientHeight } = imgRef.current;
      setImgSize({ width: clientWidth, height: clientHeight });
      
      // Default crop: center 70% of the image size
      const size = Math.min(clientWidth, clientHeight) * 0.7;
      const x = (clientWidth - size) / 2;
      const y = (clientHeight - size) / 2;
      setCrop({ x, y, w: size, h: size });
    }
  };

  // Handle dragging crop overlay or handles
  const handlePointerDown = (e: React.PointerEvent, handleType: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    setActiveHandle(handleType);
    startPos.current = { x: e.clientX, y: e.clientY };
    startCrop.current = { ...crop };
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      if (activeHandle === "move") {
        const maxLeft = imgSize.width - crop.w;
        const maxTop = imgSize.height - crop.h;
        const newX = Math.max(0, Math.min(maxLeft, startCrop.current.x + dx));
        const newY = Math.max(0, Math.min(maxTop, startCrop.current.y + dy));
        setCrop(prev => ({ ...prev, x: newX, y: newY }));
      } else if (activeHandle === "se") {
        const limit = Math.min(imgSize.width - startCrop.current.x, imgSize.height - startCrop.current.y);
        const newSize = Math.max(20, Math.min(limit, startCrop.current.w + (dx + dy) / 2));
        setCrop(prev => ({ ...prev, w: newSize, h: newSize }));
      } else if (activeHandle === "nw") {
        const anchorX = startCrop.current.x + startCrop.current.w;
        const anchorY = startCrop.current.y + startCrop.current.h;
        const maxSize = Math.min(anchorX, anchorY);
        const newSize = Math.max(20, Math.min(maxSize, startCrop.current.w - (dx + dy) / 2));
        setCrop({
          x: anchorX - newSize,
          y: anchorY - newSize,
          w: newSize,
          h: newSize
        });
      } else if (activeHandle === "ne") {
        const anchorX = startCrop.current.x;
        const anchorY = startCrop.current.y + startCrop.current.h;
        const maxSize = Math.min(imgSize.width - anchorX, anchorY);
        const newSize = Math.max(20, Math.min(maxSize, startCrop.current.w + (dx - dy) / 2));
        setCrop({
          x: anchorX,
          y: anchorY - newSize,
          w: newSize,
          h: newSize
        });
      } else if (activeHandle === "sw") {
        const anchorX = startCrop.current.x + startCrop.current.w;
        const anchorY = startCrop.current.y;
        const maxSize = Math.min(anchorX, imgSize.height - anchorY);
        const newSize = Math.max(20, Math.min(maxSize, startCrop.current.w + (-dx + dy) / 2));
        setCrop({
          x: anchorX - newSize,
          y: anchorY,
          w: newSize,
          h: newSize
        });
      }
    };

    const handleGlobalPointerUp = () => {
      setActiveHandle(null);
    };

    document.addEventListener("pointermove", handleGlobalPointerMove);
    document.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      document.removeEventListener("pointermove", handleGlobalPointerMove);
      document.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [activeHandle, crop, imgSize]);

  const handleCancel = () => {
    setShowModal(false);
    setSelectedImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    setError(null);
    try {
      if (isBoneyard) {
        // In boneyard mock mode, convert image to Base64 to support viewing the real crop
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result as string);
          setUploading(false);
          setShowModal(false);
        };
        reader.readAsDataURL(fileToUpload);
      } else {
        const token = await getToken();
        const res = await productsApi.uploadImage(token, fileToUpload);
        onChange(res.url);
        setShowModal(false);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to upload image.";
      setError(errMsg);
      setUploading(false);
    }
  };

  const handleCropAndApply = () => {
    if (!imgRef.current || !selectedFile) return;

    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    
    // Scale crop coordinates to the image's natural dimensions
    const scaleX = img.naturalWidth / imgSize.width;
    const scaleY = img.naturalHeight / imgSize.height;

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.w * scaleX;
    const sourceHeight = crop.h * scaleY;

    // Enforce strict 1:1 square output size
    const finalSize = Math.max(1, Math.round(sourceWidth));

    canvas.width = finalSize;
    canvas.height = finalSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      finalSize,
      finalSize
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const originalName = selectedFile.name;
        const lastDotIdx = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIdx !== -1 ? originalName.substring(0, lastDotIdx) : originalName;
        const croppedFile = new File([blob], `${nameWithoutExt}-cropped.png`, {
          type: "image/png",
          lastModified: Date.now()
        });
        uploadFile(croppedFile);
      }
    }, "image/png");
  };

  const handleRemoveLogo = async () => {
    setError(null);
    const oldUrl = value;
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (oldUrl && oldUrl.startsWith("http") && !isBoneyard) {
      try {
        const parts = oldUrl.split("/");
        const key = parts[parts.length - 1];
        const token = await getToken();
        await productsApi.deleteImage(token, key);
      } catch (err) {
        console.error("Failed to delete image from R2:", err);
      }
    }
  };

  // Rotation handler that rotates the actual image data
  const handleRotate = () => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL("image/png");
      setSelectedImage(rotatedDataUrl);
      
      if (selectedFile) {
        canvas.toBlob((blob) => {
          if (blob) {
            const rotatedFile = new File([blob], selectedFile.name, {
              type: "image/png",
              lastModified: Date.now()
            });
            setSelectedFile(rotatedFile);
          }
        }, "image/png");
      }
    };
    img.src = selectedImage;
  };

  // Zoom control logic
  const maxCropSize = Math.min(imgSize.width, imgSize.height) || 150;
  const currentZoom = crop.w ? maxCropSize / crop.w : 1;

  const handleZoomChange = (newZoom: number) => {
    if (!imgSize.width || !imgSize.height) return;
    const maxW = Math.min(imgSize.width, imgSize.height);
    const newW = maxW / newZoom;
    
    // Resize keeping center
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    
    let newX = cx - newW / 2;
    let newY = cy - newW / 2;
    
    newX = Math.max(0, Math.min(imgSize.width - newW, newX));
    newY = Math.max(0, Math.min(imgSize.height - newW, newY));
    
    setCrop({
      x: newX,
      y: newY,
      w: newW,
      h: newW
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Preview / Upload area */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {value ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-2xl border border-hairline bg-canvas-soft overflow-hidden flex items-center justify-center shadow-inner shrink-0 relative group cursor-pointer transition-all duration-200 hover:border-brand-primary/40 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Shop Logo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
              <Upload className="w-4 h-4 mb-1 animate-bounce" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
            </div>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group bg-canvas-soft/50 shrink-0 hover:shadow-md hover:shadow-brand-primary/5 ${
              dragActive
                ? "border-brand-primary bg-brand-primary/5"
                : "border-hairline hover:border-brand-primary/40 hover:bg-canvas"
            }`}
          >
            <Upload className="w-5 h-5 text-mute group-hover:text-brand-primary group-hover:translate-y-[-2px] transition-all duration-200 mb-1.5" />
            <span className="text-[10px] text-mute font-semibold text-center px-2 group-hover:text-foreground transition-colors duration-200">
              Upload Logo
            </span>
          </div>
        )}

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">Shop Logo</h4>
            <p className="text-[11px] text-mute leading-relaxed">
              Upload your store logo. It can be added in the Bills. (Max 5MB)
            </p>
          </div>

          {value && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3.5 bg-brand-primary hover:bg-brand-secondary text-white text-[11px] font-bold rounded-lg shadow-sm shadow-brand-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Change Logo</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="h-8 px-3.5 bg-error-soft hover:bg-error-soft/80 border border-error/15 text-error-deep text-[11px] font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Crop Modal */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
          <div className="bg-canvas border border-hairline w-full max-w-2xl rounded-2xl overflow-hidden shadow-level-4 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-hairline flex justify-between items-center bg-canvas-soft">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-bold text-foreground">Adjust & Crop Logo</h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="text-mute hover:text-foreground p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Cropping Workspace & Preview Split Layout */}
            <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 items-center justify-center bg-neutral-950/20 overflow-y-auto max-h-[65vh]">
              {/* Workspace (Column 1) */}
              <div className="flex-1 flex items-center justify-center min-h-[260px] relative">
                <div
                  ref={containerRef}
                  className="relative overflow-hidden select-none border border-hairline rounded-lg bg-black/40"
                  style={{ touchAction: "none" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={selectedImage}
                    alt="Crop Target"
                    onLoad={handleImageLoad}
                    className="max-w-full max-h-[40vh] w-auto h-auto block pointer-events-none select-none"
                  />

                  {/* Dark overlay mask and transparent crop box with shadow trick */}
                  <div
                    className="absolute cursor-move border-2 border-brand-primary ring-2 ring-white/20"
                    style={{
                      left: `${crop.x}px`,
                      top: `${crop.y}px`,
                      width: `${crop.w}px`,
                      height: `${crop.h}px`,
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)"
                    }}
                    onPointerDown={(e) => handlePointerDown(e, "move")}
                  >
                    {/* Aspect Ratio Bounding Frame Grid Lines */}
                    <div className="absolute inset-0 border border-dashed border-white/30 pointer-events-none grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-dashed border-white/20" />
                      <div className="border-r border-b border-dashed border-white/20" />
                      <div className="border-b border-dashed border-white/20" />
                      <div className="border-r border-b border-dashed border-white/20" />
                      <div className="border-r border-b border-dashed border-white/20" />
                      <div className="border-b border-dashed border-white/20" />
                    </div>

                    {/* Circular Mask Guide */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-white/50 pointer-events-none" />

                    {/* NW Handle */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "nw")}
                      className="absolute -left-1.5 -top-1.5 w-3.5 h-3.5 bg-brand-primary border-2 border-white rounded-full cursor-nw-resize shadow-md hover:scale-125 active:scale-90 transition-transform z-10"
                    />
                    {/* NE Handle */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "ne")}
                      className="absolute -right-1.5 -top-1.5 w-3.5 h-3.5 bg-brand-primary border-2 border-white rounded-full cursor-ne-resize shadow-md hover:scale-125 active:scale-90 transition-transform z-10"
                    />
                    {/* SW Handle */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "sw")}
                      className="absolute -left-1.5 -bottom-1.5 w-3.5 h-3.5 bg-brand-primary border-2 border-white rounded-full cursor-sw-resize shadow-md hover:scale-125 active:scale-90 transition-transform z-10"
                    />
                    {/* SE Handle */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "se")}
                      className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-brand-primary border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 active:scale-90 transition-transform z-10"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Controls & Preview (Column 2) */}
              <div className="w-full md:w-44 flex flex-col items-center gap-5 shrink-0 border-t md:border-t-0 md:border-l border-hairline pt-5 md:pt-0 md:pl-5">
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-mute">Live Preview</span>
                </div>

                {/* Circular Preview Container */}
                <div className="w-24 h-24 rounded-full border-2 border-brand-primary bg-canvas-soft overflow-hidden relative shadow-md">
                  {imgSize.width > 0 && crop.w > 0 && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedImage}
                      alt="Circle Preview"
                      className="absolute block pointer-events-none max-w-none origin-top-left"
                      style={{
                        width: `${(imgSize.width / crop.w) * 100}%`,
                        height: `${(imgSize.height / crop.h) * 100}%`,
                        left: `-${(crop.x / crop.w) * 100}%`,
                        top: `-${(crop.y / crop.h) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Quick Rotate Button */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="w-full h-8 mt-2 flex items-center justify-center gap-1.5 bg-canvas-soft hover:bg-canvas-soft-2 border border-hairline text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-mute" />
                  <span>Rotate 90°</span>
                </button>
              </div>
            </div>

            {/* Modal Controls / Footer */}
            <div className="px-5 py-4 border-t border-hairline bg-canvas-soft flex flex-col gap-4">
              {/* Zoom Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-mute font-semibold">
                  <span className="flex items-center gap-1">
                    Zoom & Resize
                  </span>
                  <span>{Math.round(currentZoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-mute" />
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1.1, maxCropSize / 40)}
                    step={0.05}
                    value={currentZoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <ZoomIn className="w-4 h-4 text-mute" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-mute font-semibold">Output Resolution:</span>
                <span className="text-[10px] text-mute font-mono">
                  {Math.round(crop.w)} × {Math.round(crop.h)} px
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 h-9 text-xs font-semibold text-mute hover:text-foreground border border-hairline rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropAndApply}
                  disabled={uploading}
                  className="px-5 h-9 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-primary/10 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Crop & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
