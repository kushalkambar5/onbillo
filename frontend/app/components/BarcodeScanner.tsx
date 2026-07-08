"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Volume2, VolumeX } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean; // If true, doesn't automatically close after a scan
  scanError?: string; // Optional error to display inside scanner viewport
}

// Module-level Unhandled Rejection Trap
if (typeof window !== "undefined") {
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (
      event.reason &&
      (event.reason.message?.includes("play() request was interrupted") ||
        event.reason.name === "AbortError" ||
        event.reason.message?.includes("AbortError"))
    ) {
      event.preventDefault();
      console.warn("Globally caught and suppressed play interruption AbortError.");
    }
  };
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = "Scan Product Barcode",
  continuous = false,
  scanError = "",
}: BarcodeScannerProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<any>(null);
  const lastScannedBarcode = useRef<string>("");
  const lastScannedTime = useRef<number>(0);

  // Web Audio API Beep Generator
  const playBeep = () => {
    if (isMuted) return;
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
    } catch (e) {
      console.error("Audio feedback failed:", e);
    }
  };

  // Safe scanner shutdown function
  const stopScanner = async () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
        console.warn("Error resetting ZXing reader:", err);
      }
      codeReaderRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn("Error stopping stream tracks:", err);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn("Error clearing video source:", e);
      }
    }
  };

  // Initialize and run scanner when open
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let activeReader: any = null;
    let stopNativeScan: (() => void) | null = null;

    setIsLoading(true);
    setError("");

    const startCamera = async () => {
      try {
        // Enumerate devices to list cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);

        // Request camera stream with HD resolution constraints for sharp scans
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId 
            ? { 
                deviceId: { exact: selectedCameraId },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
              } 
            : { 
                facingMode: "environment",
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
              }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        streamRef.current = stream;

        // Attempt continuous autofocus if supported by browser/device
        try {
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
          if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
            await track.applyConstraints({
              advanced: [{ focusMode: "continuous" } as any]
            });
          }
        } catch (focusErr) {
          console.warn("Could not apply autofocus constraints:", focusErr);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Suppressed video play interruption:", playErr);
          }

          const handleDecodedText = (decodedText: string) => {
            const now = Date.now();
            // Cooldown: 1.5 seconds for identical scans to prevent bounce
            if (decodedText === lastScannedBarcode.current && now - lastScannedTime.current < 1500) {
              return;
            }

            lastScannedBarcode.current = decodedText;
            lastScannedTime.current = now;

            playBeep();
            onScan(decodedText);

            if (!continuous) {
              handleClose();
            }
          };

          // 1. Try Native BarcodeDetector API (ML-Kit / Vision Engine)
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          if (BarcodeDetectorClass) {
            console.log("Starting hardware-accelerated Native BarcodeDetector API");
            try {
              const formats = await BarcodeDetectorClass.getSupportedFormats();
              const supportedFormats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "itf", "qr_code"].filter(
                (f) => formats.includes(f)
              );

              const detector = new BarcodeDetectorClass({ formats: supportedFormats });
              let isScanningActive = true;
              
              stopNativeScan = () => {
                isScanningActive = false;
              };

              const scanFrame = async () => {
                if (!isScanningActive) return;
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  try {
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                      handleDecodedText(barcodes[0].rawValue);
                    }
                  } catch (e) {
                    // Suppress frame read exceptions
                  }
                }
                if (isScanningActive) {
                  requestAnimationFrame(scanFrame);
                }
              };

              requestAnimationFrame(scanFrame);
              setCameraPermissionGranted(true);
              setIsLoading(false);
              return;
            } catch (detectorErr) {
              console.warn("Failed to initialize native BarcodeDetector, falling back to ZXing:", detectorErr);
            }
          }

          // 2. Fallback to ZXing JS Library
          console.log("Starting ZXing MultiFormatReader fallback");
          const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import("@zxing/library");

          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.ITF,
            BarcodeFormat.QR_CODE,
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);

          activeReader = new BrowserMultiFormatReader(hints);
          codeReaderRef.current = activeReader;

          // Start scanning frames from the video element
          activeReader.decodeFromVideoElement(videoRef.current, (result: any, err: any) => {
            if (result) {
              handleDecodedText(result.getText());
            }
          });
        }

        setCameraPermissionGranted(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Camera startup failed:", err);
        setError(err.message || "Could not access camera. Make sure permissions are granted.");
        setCameraPermissionGranted(false);
        setIsLoading(false);
      }
    };

    startCamera();

    // Clean up when modal closes, camera switches, or component unmounts
    return () => {
      if (stopNativeScan) {
        try {
          stopNativeScan();
        } catch (e) {}
      }
      if (activeReader) {
        try {
          activeReader.reset();
        } catch (e) {
          console.warn("Error resetting ZXing reader:", e);
        }
      }
      if (activeStream) {
        try {
          activeStream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn("Error stopping stream tracks:", e);
        }
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        } catch (e) {
          console.warn("Error pausing video during cleanup:", e);
        }
      }
    };
  }, [isOpen, selectedCameraId]);

  const handleClose = () => {
    onClose();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = e.target.value;
    setIsLoading(true);
    setSelectedCameraId(newCameraId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300 animate-in fade-in duration-200">
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
            <h3 className="text-sm font-bold text-foreground font-sans">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-canvas rounded-lg text-mute hover:text-foreground transition-colors"
              title={isMuted ? "Unmute scan beep" : "Mute scan beep"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-canvas rounded-lg text-mute hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative bg-black aspect-square w-full flex items-center justify-center p-3">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80">
              <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
              <p className="text-xs text-white/70 font-semibold font-mono">Initializing camera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-white">
              <span className="text-2xl mb-2">⚠️</span>
              <p className="text-xs font-semibold max-w-xs leading-relaxed text-red-400">
                {error}
              </p>
              <button
                onClick={() => {
                  setSelectedCameraId("");
                  setError("");
                  setIsLoading(true);
                }}
                className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors"
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {/* React Managed HTML5 Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full rounded-xl object-cover bg-zinc-950"
          ></video>

          {/* Overlay Box Frame & Laser line */}
          {!isLoading && !error && cameraPermissionGranted && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-3">
              <div className="relative w-[70%] h-[70%] border-2 border-brand-primary/40 rounded-xl">
                {/* Laser animation */}
                <div className="scanner-laser" />

                {/* Styled Brackets on the corners */}
                <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-brand-primary rounded-tl-md"></div>
                <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 border-brand-primary rounded-tr-md"></div>
                <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 border-brand-primary rounded-bl-md"></div>
                <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-brand-primary rounded-br-md"></div>
              </div>
            </div>
          )}

          {/* Scan error overlay */}
          {scanError && (
            <div className="absolute bottom-6 left-6 right-6 z-30 bg-red-600/90 text-white text-[10px] font-bold py-2 px-3 rounded-lg text-center shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              ⚠️ {scanError}
            </div>
          )}
        </div>

        {/* Footer Settings & Selector */}
        <div className="px-5 py-4 bg-canvas-soft border-t border-hairline flex flex-col gap-3">
          {/* Camera switcher */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-mute font-semibold shrink-0">Switch Camera:</span>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="flex-1 text-xs border border-hairline bg-canvas hover:border-hairline-strong rounded-lg h-8 px-2 text-foreground font-medium focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary outline-none"
              >
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

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
