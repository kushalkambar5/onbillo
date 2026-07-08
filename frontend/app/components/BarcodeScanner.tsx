"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, Flashlight } from "lucide-react";
import { useZxing } from "react-zxing";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean;
  scanError?: string;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = "Scan Product Barcode",
  continuous = false,
  scanError = "",
}: BarcodeScannerProps) {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [torchEnabledChoice, setTorchEnabledChoice] = useState<boolean>(false);
  const [hasError, setHasError] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);

  const lastScannedBarcode = useRef<string>("");
  const lastScannedTime = useRef<number>(0);

  // Detect if mobile device or tablet
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /iPad|PlayBook/i.test(ua) || (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua));
      setIsMobileOrTablet(isMobile || isTablet);

      // Load initial torch choice from local storage
      const saved = localStorage.getItem("scanner_torch_enabled");
      setTorchEnabledChoice(saved === "true");
    }
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setHasError("");
      setIsPaused(false);
      lastScannedBarcode.current = "";
      lastScannedTime.current = 0;
    }
  }, [isOpen]);

  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  }, []);

  const { ref, torch } = useZxing({
    paused: !isOpen || isPaused,
    wasmUrl: "/zxing_reader.wasm",
    trySkew: true,
    formats: [
      "ean_13",
      "ean_8",
      "upc_a",
      "upc_e",
      "code_128",
      "code_39",
      "code_93",
      "codabar",
      "itf",
      "qr_code",
      "data_matrix",
    ],
    timeBetweenDecodingAttempts: 200,
    constraints: {
      video: {
        facingMode: "environment",
      },
      audio: false,
    },
    onDecodeResult(result) {
      const decodedText = result.rawValue;
      if (!decodedText) return;

      // Deduplication: ignore same barcode within 1500ms
      const now = Date.now();
      if (
        decodedText === lastScannedBarcode.current &&
        now - lastScannedTime.current < 1500
      ) {
        return;
      }
      lastScannedBarcode.current = decodedText;
      lastScannedTime.current = now;

      playBeep();
      onScan(decodedText);

      if (!continuous) {
        setIsPaused(true);
        onClose();
      }
    },
    onError(error) {
      console.error("Barcode scanner error:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setHasError("Camera permission denied. Please allow camera access in your browser settings and retry.");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setHasError("No camera found on this device.");
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setHasError("Camera is in use by another application. Please close it and retry.");
      } else {
        setHasError("Could not start camera. Ensure permission is granted.");
      }
    },
  });

  // Auto-enable torch if choice is set to true and it becomes available
  useEffect(() => {
    if (isOpen && torch.isAvailable && torchEnabledChoice && !torch.isOn) {
      torch.on().catch((err) => {
        console.error("Failed to auto-enable torch:", err);
      });
    }
  }, [isOpen, torch.isAvailable, torchEnabledChoice, torch.isOn, torch]);

  const toggleTorch = async () => {
    try {
      if (torch.isOn) {
        await torch.off();
        setTorchEnabledChoice(false);
        localStorage.setItem("scanner_torch_enabled", "false");
      } else {
        await torch.on();
        setTorchEnabledChoice(true);
        localStorage.setItem("scanner_torch_enabled", "true");
      }
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 transition-all duration-300 animate-in fade-in duration-200">
      <style>{`
        @keyframes scan-laser {
          0% { top: 4%; }
          50% { top: 96%; }
          100% { top: 4%; }
        }
        .scanner-laser {
          position: absolute;
          left: 4%;
          right: 4%;
          height: 2px;
          background-color: #0070f3;
          box-shadow: 0 0 10px #0070f3, 0 0 4px #0070f3;
          animation: scan-laser 2.2s infinite linear;
          z-index: 10;
        }
      `}</style>

      <div className="w-full max-w-md bg-canvas border border-hairline rounded-2xl shadow-level-4 overflow-hidden mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-canvas-soft">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-primary" />
            <h3 className="text-sm font-bold text-foreground font-sans">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isMobileOrTablet && torch.isAvailable && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg transition-colors ${
                  torch.isOn
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "hover:bg-canvas text-mute hover:text-foreground"
                }`}
                title={torch.isOn ? "Turn off torch" : "Turn on torch"}
              >
                <Flashlight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-canvas rounded-lg text-mute hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black aspect-square w-full flex items-center justify-center overflow-hidden">
          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-white">
              <span className="text-2xl mb-2">⚠️</span>
              <p className="text-xs font-semibold max-w-xs leading-relaxed text-red-400">{hasError}</p>
              <button
                onClick={() => {
                  setHasError("");
                  setIsPaused(false);
                }}
                className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors"
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {/* react-zxing mounts the camera stream on this video element */}
          <video
            ref={ref}
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Overlay: scan laser + corner brackets */}
          {!hasError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[70%] h-[70%] border-2 border-brand-primary/40 rounded-xl">
                <div className="scanner-laser" />
                <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-brand-primary rounded-tl-md" />
                <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 border-brand-primary rounded-tr-md" />
                <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 border-brand-primary rounded-bl-md" />
                <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-brand-primary rounded-br-md" />
              </div>
            </div>
          )}

          {scanError && (
            <div className="absolute bottom-6 left-6 right-6 z-30 bg-red-600 text-white text-[10px] font-bold py-2 px-3 rounded-lg text-center shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              ⚠️ {scanError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-canvas-soft border-t border-hairline flex flex-col gap-3">
          <div className="text-[10px] text-mute text-center leading-relaxed font-semibold">
            {continuous
              ? "Continuous scanning mode: items will be added in real-time."
              : "Align barcode inside the frame to scan automatically."}
          </div>
        </div>
      </div>
    </div>
  );
}
