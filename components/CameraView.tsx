import React, { useEffect, useState } from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onReady?: () => void;
  onError?: (error: string) => void;
  enableDistanceCheck?: boolean; // Kept interface compatible though not used in snippet
}

const CameraView: React.FC<CameraViewProps> = ({ videoRef, onReady, onError }) => {
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<'left' | 'right' | null>(null);
  const [shoulderPosition, setShoulderPosition] = useState<{x: number, y: number} | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("La fotocamera non è supportata da questo browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (onReady) onReady();
          };
        }
      } catch (err) {
        let errorMessage = "Impossibile accedere alla webcam. Controlla le autorizzazioni del browser.";
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                errorMessage = "Accesso alla fotocamera negato. Per favore, abilita i permessi nelle impostazioni del browser.";
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    };

    initializeCamera();

    let highlightTimeoutId: number | null = null;
    let textTimeoutId: number | null = null;

    const handleMovement = (event: CustomEvent) => {
        const direction = event.detail.direction;
        
        // Logic for Mirrored View (-scale-x-100)
        // Forward (SI) -> Screen Right -> Highlight Right (Green)
        // Backward (NO) -> Screen Left -> Highlight Left (Red)
        
        if (direction === 'forward') {
            setHighlight('right');
            setDetectedText('SI / AVANTI');
        } else if (direction === 'backward') {
            setHighlight('left');
            setDetectedText('NO / INDIETRO');
        } else {
            // Neutral state
            setHighlight(null);
            setDetectedText(null);
        }

        if (highlightTimeoutId) clearTimeout(highlightTimeoutId);
        // Reset highlight after a bit if no new events come in (optional, but keep it snappy)
        highlightTimeoutId = window.setTimeout(() => setHighlight(null), 500);
        
        if (textTimeoutId) clearTimeout(textTimeoutId);
        textTimeoutId = window.setTimeout(() => setDetectedText(null), 1000);
    };
    window.addEventListener('movementDetected', handleMovement);

    const handleMovementCenter = (event: CustomEvent) => {
        const { center } = event.detail;
        if (center.x > 0 && center.y > 0) {
            // The video is flipped with -scale-x-100, so we need to flip the x coordinate for display.
            const flippedX = 100 - center.x;
            setShoulderPosition({ x: flippedX, y: center.y });
        }
    };
    window.addEventListener('movementCenterUpdate', handleMovementCenter);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('movementDetected', handleMovement);
      window.removeEventListener('movementCenterUpdate', handleMovementCenter);
      if (highlightTimeoutId) clearTimeout(highlightTimeoutId);
      if (textTimeoutId) clearTimeout(textTimeoutId);
    };
  }, [videoRef, onReady, onError]);

  return (
    <div className="relative w-full max-w-lg mx-auto h-[75vh] bg-black rounded-lg overflow-hidden flex items-center justify-center text-white border-2 border-gray-800 shadow-2xl">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 opacity-90" />
      {error && <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4"><p className="text-red-500 text-center">{error}</p></div>}
      
      {/* Visual Feedback Overlays (Highlights) */}
      {highlight && (
        <div className={`absolute top-0 h-full w-1/2 transition-opacity duration-200 ${
          highlight === 'right' ? 'right-0 bg-green-500 bg-opacity-30' : 'left-0 bg-red-500 bg-opacity-30'
        }`}></div>
      )}

      {/* Detected Text Overlay (Center Popup) */}
      {detectedText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-50">
              <span className={`px-8 py-4 rounded-xl text-white font-black text-4xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 ${
                  detectedText.includes('SI') 
                    ? 'bg-green-600 bg-opacity-90 border-green-300' 
                    : 'bg-red-600 bg-opacity-90 border-red-300'
              }`}>
                  {detectedText}
              </span>
          </div>
      )}

      {/* Static Overlay with Guidelines and Text Stacks */}
      <div className="absolute inset-0 flex justify-between items-center p-2 pointer-events-none">
        
        {/* LEFT SIDE - RETRO (NO) */}
        <div className="h-full relative flex flex-col items-center pt-4" style={{ width: '25%' }}>
          {/* Vertical Dashed Line */}
          <div className="absolute top-0 right-0 h-full w-0 border-r-2 border-red-500 border-dashed opacity-70"></div>
          
          {/* Top Label */}
          <div className="bg-black bg-opacity-70 px-3 py-1 rounded border border-red-500 mb-8">
             <span className="text-red-500 font-bold text-sm sm:text-base whitespace-nowrap">RETRO (NO) ←</span>
          </div>

          {/* Vertical Text Stack */}
          <div className="flex flex-col gap-6 items-center justify-center mt-4 opacity-60">
             <span className="text-red-500 font-black text-2xl sm:text-3xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>RETRO</span>
             <span className="text-red-500 font-black text-xl sm:text-2xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>INDIETRO</span>
             <span className="text-red-500 font-black text-4xl sm:text-5xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>NO</span>
          </div>
        </div>
        
        {/* RIGHT SIDE - FRONTE (SI) */}
        <div className="h-full relative flex flex-col items-center pt-4" style={{ width: '25%' }}>
          {/* Vertical Dashed Line */}
          <div className="absolute top-0 left-0 h-full w-0 border-l-2 border-green-500 border-dashed opacity-70"></div>
          
          {/* Top Label */}
          <div className="bg-black bg-opacity-70 px-3 py-1 rounded border border-green-500 mb-8">
             <span className="text-green-500 font-bold text-sm sm:text-base whitespace-nowrap">→ FRONTE (SI)</span>
          </div>

           {/* Vertical Text Stack */}
           <div className="flex flex-col gap-6 items-center justify-center mt-4 opacity-60">
             <span className="text-green-500 font-black text-2xl sm:text-3xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>FRONTE</span>
             <span className="text-green-500 font-black text-xl sm:text-2xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>AVANTI</span>
             <span className="text-green-500 font-black text-4xl sm:text-5xl tracking-widest uppercase" style={{ textShadow: '2px 2px 4px black' }}>SI</span>
          </div>
        </div>
      </div>

      {/* Dynamic blue circle to track shoulder movement */}
      {shoulderPosition && (
        <div 
            className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white opacity-80 pointer-events-none transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.8)]"
            style={{
                top: `calc(${shoulderPosition.y}% - 12px)`,
                left: `calc(${shoulderPosition.x}% - 12px)`,
            }}
        />
      )}
    </div>
  );
};

export default CameraView;