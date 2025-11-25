
import React, { useEffect, useState } from 'react';
import { playFeedbackSound } from '../utils/sound';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onReady?: () => void;
  onError?: (error: string) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ videoRef, onReady, onError }) => {
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<'left' | 'right' | null>(null);
  const [shoulderPosition, setShoulderPosition] = useState<{x: number, y: number} | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  
  // Gauge State
  const [gaugeLevel, setGaugeLevel] = useState({ intensity: 0, direction: 'none' });
  const MAX_INTENSITY = 5000; // Approximate max value for gauge scaling

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
        if (direction === 'forward') {
            setHighlight('right');
            setDetectedText('SI / AVANTI');
            playFeedbackSound('positive'); // Audio Feedback
        } else if (direction === 'backward') {
            setHighlight('left');
            setDetectedText('NO / INDIETRO');
            playFeedbackSound('negative'); // Audio Feedback
        }

        if (highlightTimeoutId) clearTimeout(highlightTimeoutId);
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

    // Listen for real-time levels for the gauge
    const handleLevel = (event: CustomEvent) => {
        const { intensity, direction } = event.detail;
        setGaugeLevel({ intensity, direction });
    };
    window.addEventListener('movementLevel', handleLevel);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('movementDetected', handleMovement);
      window.removeEventListener('movementCenterUpdate', handleMovementCenter);
      window.removeEventListener('movementLevel', handleLevel);
      if (highlightTimeoutId) clearTimeout(highlightTimeoutId);
      if (textTimeoutId) clearTimeout(textTimeoutId);
    };
  }, [videoRef, onReady, onError]);

  // Calculate gauge widths
  const normalizedIntensity = Math.min(gaugeLevel.intensity / MAX_INTENSITY, 1) * 100;
  const leftWidth = gaugeLevel.direction === 'backward' ? `${normalizedIntensity}%` : '0%';
  const rightWidth = gaugeLevel.direction === 'forward' ? `${normalizedIntensity}%` : '0%';

  return (
    <div className="relative w-full max-w-lg mx-auto bg-black rounded-lg overflow-hidden flex flex-col shadow-2xl">
      {/* Video Container */}
      <div className="relative w-full h-[60vh] sm:h-[400px] bg-black flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
        {error && <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4"><p className="text-red-500 text-center">{error}</p></div>}
        
        {/* Visual Feedback Overlays */}
        {highlight && (
            <div className={`absolute top-0 h-full w-1/2 ${
            highlight === 'right' ? 'right-0 bg-green-500 bg-opacity-40' : 'left-0 bg-red-500 bg-opacity-40'
            }`}></div>
        )}

        {/* Detected Text Overlay */}
        {detectedText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300">
                <span className={`px-8 py-4 rounded-lg text-white font-bold text-3xl shadow-2xl ${
                    detectedText.includes('SI') ? 'bg-green-600 bg-opacity-80' : 'bg-red-600 bg-opacity-80'
                }`}>
                    {detectedText}
                </span>
            </div>
        )}

        {/* Overlay with guide lines and text */}
        <div className="absolute inset-0 flex justify-between items-center p-2 sm:p-4 pointer-events-none">
            <div className="h-full flex items-center" style={{ width: '20%' }}>
                <div className="w-full h-full border-r-2 border-red-500 border-dashed"></div>
                <span className="absolute left-2 sm:left-4 top-4 text-white font-bold bg-black bg-opacity-50 p-2 rounded text-xs sm:text-base">RETRO (NO)</span>
            </div>
            <div className="h-full flex items-center" style={{ width: '20%' }}>
                <div className="w-full h-full border-l-2 border-red-500 border-dashed"></div>
                <span className="absolute right-2 sm:right-4 top-4 text-white font-bold bg-black bg-opacity-50 p-2 rounded text-xs sm:text-base">FRONTE (SI)</span>
            </div>
        </div>

        {/* Dynamic blue circle to track shoulder movement */}
        {shoulderPosition && (
            <div 
                className="absolute w-8 h-8 bg-blue-500 rounded-full border-2 border-white opacity-70 pointer-events-none transition-all duration-100 ease-linear"
                style={{
                    top: `calc(${shoulderPosition.y}% - 16px)`,
                    left: `calc(${shoulderPosition.x}% - 16px)`,
                }}
            />
        )}
      </div>

      {/* Gauge Meter */}
      <div className="h-8 w-full bg-gray-900 flex relative border-t border-gray-700">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
        
        {/* Left Bar (Backward/NO) */}
        <div className="w-1/2 flex justify-end bg-gray-800 h-full relative">
            <div 
                className="h-full bg-gradient-to-l from-red-500 to-red-700 transition-all duration-100 ease-out"
                style={{ width: leftWidth }}
            ></div>
            <span className="absolute left-2 top-1 text-xs font-bold text-gray-400 uppercase">Indietro (NO)</span>
        </div>

        {/* Right Bar (Forward/SI) */}
        <div className="w-1/2 flex justify-start bg-gray-800 h-full relative">
            <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-700 transition-all duration-100 ease-out"
                style={{ width: rightWidth }}
            ></div>
            <span className="absolute right-2 top-1 text-xs font-bold text-gray-400 uppercase">Avanti (SI)</span>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
