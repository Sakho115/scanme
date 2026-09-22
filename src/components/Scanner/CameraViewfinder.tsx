import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import {
  Camera,
  CameraOff,
  RefreshCw,
  FlipHorizontal,
  AlertTriangle,
  Keyboard,
  Zap,
  ZapOff,
  Image as ImageIcon
} from 'lucide-react';

interface CameraViewfinderProps {
  onScanToken: (rawQrValue: string) => void;
  onOpenManualModal: () => void;
  isLocked: boolean;
  onCameraError?: (error: Error | string) => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onScanToken,
  onOpenManualModal,
  isLocked,
  onCameraError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Stop camera tracks and cleanup cleanly
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {
        // ignore
      }
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsStarting(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Discover camera devices after permission is granted
  const discoverDevices = useCallback(async () => {
    try {
      const videoDevices = await BrowserQRCodeReader.listVideoInputDevices();
      setDevices(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  // Continuous Native BarcodeDetector loop for 60fps instant snap (Android / Chrome)
  const startNativeBarcodeDetector = useCallback((videoElement: HTMLVideoElement) => {
    if (!('BarcodeDetector' in window)) return;

    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      
      const scanFrame = async () => {
        if (!videoElement || videoElement.readyState < 2 || isLockedRef.current) {
          animFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoElement);
          if (barcodes.length > 0 && !isLockedRef.current) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              onScanToken(raw);
            }
          }
        } catch {
          // Frame error or unsupported format
        }

        animFrameRef.current = requestAnimationFrame(scanFrame);
      };

      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (e) {
      console.warn('Native BarcodeDetector initialization bypassed:', e);
    }
  }, [onScanToken]);

  // Start scanning
  const startCamera = useCallback(async (deviceIdToUse?: string) => {
    stopCamera();
    setIsStarting(true);
    setErrorMessage(null);

    try {
      // Build optimized hints: QR format only, TRY_HARDER = true for inverted/skewed/blurry QRs
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      readerRef.current = new BrowserQRCodeReader(hints, {
        delayBetweenScanAttempts: 80, // ~12 fps for instant responsive capture
        delayBetweenScanSuccess: 1000,
        tryPlayVideoTimeout: 8000
      });

      if (!videoRef.current) {
        setIsStarting(false);
        return;
      }

      const targetDeviceId = deviceIdToUse || selectedDeviceId;

      // Clean mobile-first camera constraints
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            }
      };

      // Start stream using decodeFromConstraints
      const controls = await readerRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, _error) => {
          if (result && !isLockedRef.current) {
            const text = result.getText();
            if (text) {
              onScanToken(text);
            }
          }
        }
      );

      controlsRef.current = controls;

      // Inspect tracks for torch capabilities and continuous focus
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            const caps: any = track.getCapabilities ? track.getCapabilities() : {};
            if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
            }
            if (caps.torch) {
              setTorchSupported(true);
            }
          } catch {
            // ignore non-critical capability errors
          }
        }
      }

      // Start concurrent native BarcodeDetector if available
      startNativeBarcodeDetector(videoRef.current);

      // Refresh device list with granted permission labels
      await discoverDevices();

      setIsActive(true);
      setIsStarting(false);
    } catch (err: unknown) {
      console.error('Camera startup error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      let userFriendlyMsg = 'Camera access unavailable. Please allow camera permission and try again.';
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        userFriendlyMsg = 'Camera permission was denied. Please allow camera permissions in your browser address bar/settings.';
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        userFriendlyMsg = 'No camera device found on this system.';
      } else if (msg.includes('OverconstrainedError')) {
        userFriendlyMsg = 'Camera constraints not supported. Switching to default rear camera.';
        // Retry with default
        setTimeout(() => startCamera(), 300);
        return;
      }
      setErrorMessage(userFriendlyMsg);
      setIsActive(false);
      setIsStarting(false);
      if (onCameraError) {
        onCameraError(userFriendlyMsg);
      }
    }
  }, [discoverDevices, onCameraError, onScanToken, selectedDeviceId, startNativeBarcodeDetector, stopCamera]);

  // Flip / switch camera
  const handleSwitchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      } as any);
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Fallback: Scan QR from Image/Photo File
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const objectUrl = URL.createObjectURL(file);

      // 1. Try Native BarcodeDetector on image
      if ('BarcodeDetector' in window) {
        try {
          const img = new Image();
          img.src = objectUrl;
          await img.decode();
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            URL.revokeObjectURL(objectUrl);
            onScanToken(barcodes[0].rawValue);
            return;
          }
        } catch {
          // continue to ZXing
        }
      }

      // 2. Fallback to ZXing decodeFromImageUrl
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const staticReader = new BrowserQRCodeReader(hints);
      const result = await staticReader.decodeFromImageUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);

      if (result && result.getText()) {
        onScanToken(result.getText());
      } else {
        alert('Could not decode QR code from the selected photo. Please try a clearer photo or enter token manually.');
      }
    } catch (err) {
      console.error('Image decode failed:', err);
      alert('Could not decode QR code from the selected photo. Please ensure good lighting or enter the token manually.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden file input for Photo / Gallery fallback */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Viewfinder Container: Mobile-Optimized responsive sizing */}
      <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] sm:aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 flex flex-col items-center justify-center">
        {/* Live Video Element — PERSISTENT in DOM (opacity controlled, never display:none) */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isActive ? 1 : 0 }}
          playsInline
          muted
          autoPlay
        />

        {/* Viewfinder Overlay when Camera is Active */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 sm:p-6">
            {/* Top Instruction Banner */}
            <div className="bg-slate-900/85 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-slate-700/60 shadow-lg">
              Fit QR Code inside the frame
            </div>

            {/* Central QR Alignment Reticle Frame */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
              {/* Four High-Contrast Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 reticle-corner-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 reticle-corner-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 reticle-corner-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 reticle-corner-br" />

              {/* Animated Scan Beam */}
              {!isLocked && (
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_14px_rgba(59,130,246,0.9)] animate-scan-beam" />
              )}

              {/* Locked / Processing Indicator */}
              {isLocked && (
                <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                  <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    Processing pass...
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Badge & Flashlight Controls */}
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-slate-200 px-3 py-1 rounded-full text-xs border border-slate-700/50">
                <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                <span className="font-medium">{isLocked ? 'Verifying...' : 'Scanner ready'}</span>
              </div>

              {/* Flashlight toggle if supported */}
              {torchSupported && (
                <button
                  onClick={handleToggleTorch}
                  className={`touch-target p-2 rounded-full border transition-all ${
                    torchOn
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                >
                  {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inactive State: [ Open Camera ] */}
        {!isActive && !isStarting && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Camera Inactive</h3>
            <p className="text-slate-400 text-xs max-w-xs mb-6 leading-relaxed">
              Start your device camera to scan QR entry tokens on participant passes.
            </p>
            <button
              onClick={() => startCamera()}
              className="touch-target px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              Open Camera
            </button>
          </div>
        )}

        {/* Starting / Loading Spinner */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <span className="text-slate-300 text-sm font-semibold">Activating camera...</span>
          </div>
        )}

        {/* Camera Error Display */}
        {errorMessage && !isActive && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 max-w-xs mx-auto bg-slate-950">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4 className="text-white font-bold text-base mb-1">Camera Access Unavailable</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-5">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => startCamera()}
                className="touch-target w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onOpenManualModal}
                className="touch-target w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                Enter Pass ID / Token Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viewfinder Controls Toolbar — Touch Target Friendly */}
      <div className="w-full max-w-sm sm:max-w-md mt-3 flex items-center justify-between gap-2 px-1">
        {/* Toggle Camera Active / Stop */}
        {isActive ? (
          <button
            onClick={stopCamera}
            className="touch-target px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <CameraOff className="w-3.5 h-3.5 text-rose-500" />
            Pause Camera
          </button>
        ) : (
          <button
            onClick={() => startCamera()}
            className="touch-target px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Open Camera
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Flip / Switch Camera (if >1 device available) */}
          {devices.length > 1 && isActive && (
            <button
              onClick={handleSwitchCamera}
              className="touch-target px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1 transition-colors"
              title="Switch Camera Sensor"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xs:inline">Flip</span>
            </button>
          )}

          {/* Photo / Gallery Fallback Scan */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="touch-target px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1 transition-colors"
            title="Scan from Photo or Gallery"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Photo</span>
          </button>

          {/* Fallback Manual Token Entry Button */}
          <button
            onClick={onOpenManualModal}
            className="touch-target px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            <span>Enter Token</span>
          </button>
        </div>
      </div>
    </div>
  );
};
